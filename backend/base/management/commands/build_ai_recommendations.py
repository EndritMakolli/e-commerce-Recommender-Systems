from collections import defaultdict

from django.core.management.base import BaseCommand
from django.db.models import Prefetch
from django.utils import timezone
from datetime import timedelta

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from gensim.models import Word2Vec
from sentence_transformers import SentenceTransformer

from django.contrib.auth.models import User
from base.models import Product, Order, OrderItem, ProductEmbedding, UserProfile, Recommendation
from base.ml.restock_predictor import get_restock_predictor

MODEL_NAME = "all-MiniLM-L6-v2"


def product_text(p: Product) -> str:
    parts = [p.name or "", p.brand or "", p.category or "", p.description or ""]
    return " | ".join([x.strip() for x in parts if x and x.strip()])


class Command(BaseCommand):
    help = "Build AI recommendations: for_you, restock, frequently_bought"

    def add_arguments(self, parser):
        parser.add_argument("--topn", type=int, default=20)
        parser.add_argument("--days_window", type=int, default=365)
        parser.add_argument("--paid_only", action="store_true")

    def handle(self, *args, **opts):
        topn = opts["topn"]
        days_window = opts["days_window"]
        paid_only = opts["paid_only"]
        since = timezone.now() - timedelta(days=days_window)

        self.stdout.write("Loading embedding model...")
        embedder = SentenceTransformer(MODEL_NAME)

        # 1) Product embeddings
        self.stdout.write("Building product embeddings...")
        products = list(Product.objects.all())
        texts = [product_text(p) for p in products]
        vectors = embedder.encode(texts, normalize_embeddings=True)

        for p, v in zip(products, vectors):
            ProductEmbedding.objects.update_or_create(
                product=p,
                defaults={"vector": np.asarray(v, dtype=np.float32).tolist()},
            )

        emb_map = {
            pe.product_id: np.array(pe.vector, dtype=np.float32)
            for pe in ProductEmbedding.objects.select_related("product").all()
        }

        product_ids = []
        product_vecs = []
        product_map = {p._id: p for p in products}

        for p in products:
            v = emb_map.get(p._id)
            if v is not None:
                product_ids.append(p._id)
                product_vecs.append(v)

        all_vecs = np.vstack(product_vecs) if product_vecs else None

        # 2) Item2Vec
        self.stdout.write("Training Item2Vec (Word2Vec on baskets) ...")
        orders_qs = Order.objects.filter(createdAt__gte=since)
        if paid_only and hasattr(Order, "isPaid"):
            orders_qs = orders_qs.filter(isPaid=True)

        orders = orders_qs.prefetch_related(
            Prefetch("orderitem_set", queryset=OrderItem.objects.select_related("product"))
        )

        baskets = []
        for o in orders:
            items = [str(oi.product_id) for oi in o.orderitem_set.all() if oi.product_id]
            if len(items) >= 2:
                baskets.append(items)

        w2v = None
        if len(baskets) >= 10:
            w2v = Word2Vec(
                sentences=baskets,
                vector_size=64,
                window=6,
                min_count=1,
                workers=2,
                sg=1,
                epochs=30,
            )

        # 2.5) Train AI Restock Model
        self.stdout.write("Training AI Restock Predictor...")
        predictor = get_restock_predictor()
        
        # Prepare training data from all users
        training_data = []
        all_users = list(User.objects.all())
        
        for user in all_users:
            user_orders_qs = Order.objects.filter(user=user)
            if paid_only and hasattr(Order, "isPaid"):
                user_orders_qs = user_orders_qs.filter(isPaid=True)
            
            user_orders = user_orders_qs.prefetch_related("orderitem_set")
            
            # Group purchases by product
            product_purchases = defaultdict(list)
            for o in user_orders:
                dt = o.createdAt
                if dt is None:
                    continue
                for oi in o.orderitem_set.all():
                    if oi.product_id:
                        product_purchases[oi.product_id].append(dt)
            
            # Create training samples
            now = timezone.now()
            
            for pid, dts in product_purchases.items():
                if len(dts) >= 2:
                    dts_sorted = sorted(dts)
                    gaps = [(dts_sorted[i] - dts_sorted[i-1]).days 
                           for i in range(1, len(dts_sorted))]
                    
                    if gaps:
                        mean_gap = float(np.mean(gaps))
                        days_since = (now - dts_sorted[-1]).days
                        
                        # Calculate target probability (ground truth)
                        target = 1.0 - np.exp(-days_since / (mean_gap + 1e-9))
                        target = float(np.clip(target, 0.0, 1.0))
                        
                        training_data.append((dts, target))
        
        if training_data:
            self.stdout.write(f"Training with {len(training_data)} samples...")
            success = predictor.train(training_data)
            if success:
                self.stdout.write(self.style.SUCCESS("✓ AI Restock model trained!"))
            else:
                self.stdout.write(self.style.WARNING("⚠ AI training skipped (not enough data or sklearn unavailable)"))
        else:
            self.stdout.write(self.style.WARNING("⚠ Not enough data to train restock model"))

        # 3) Per user
        self.stdout.write("Generating recommendations per user...")
        users = list(User.objects.all())
        now = timezone.now()

        for user in users:
            user_orders_qs = Order.objects.filter(user=user)
            if paid_only and hasattr(Order, "isPaid"):
                user_orders_qs = user_orders_qs.filter(isPaid=True)

            user_orders = user_orders_qs.prefetch_related("orderitem_set")

            bought_ids = set()
            purchase_events = []  # (product_id, dt)

            for o in user_orders:
                dt = o.createdAt
                if dt is None:
                    continue
                for oi in o.orderitem_set.all():
                    if oi.product_id:
                        bought_ids.add(oi.product_id)
                        purchase_events.append((oi.product_id, dt))

            Recommendation.objects.filter(user=user).delete()

            # FOR_YOU
            if purchase_events and all_vecs is not None:
                vecs, ws = [], []
                for pid, dt in purchase_events:
                    v = emb_map.get(pid)
                    if v is None:
                        continue
                    days_ago = max(0.0, (now - dt).days)
                    w = 1.0 / (1.0 + days_ago / 30.0)
                    vecs.append(v)
                    ws.append(w)

                if vecs:
                    user_vec = np.average(np.vstack(vecs), axis=0, weights=np.array(ws))
                    user_vec = user_vec / (np.linalg.norm(user_vec) + 1e-9)

                    UserProfile.objects.update_or_create(user=user, defaults={"vector": user_vec.tolist()})

                    sims = cosine_similarity([user_vec], all_vecs)[0]
                    ranked = sorted(zip(product_ids, sims), key=lambda x: x[1], reverse=True)

                    count = 0
                    for pid, score in ranked:
                        if pid in bought_ids:
                            continue
                        p = product_map.get(pid)
                        if not p:
                            continue
                        if p.countInStock is not None and p.countInStock <= 0:
                            continue

                        Recommendation.objects.create(
                            user=user,
                            product=p,
                            rec_type="for_you",
                            score=float(score),
                            reason="Based on your interests and purchases",
                        )
                        count += 1
                        if count >= topn:
                            break

            # RESTOCK (with AI)
            times = defaultdict(list)
            for pid, dt in purchase_events:
                if dt is not None:
                    times[pid].append(dt)

            for pid, dts in times.items():
                if len(dts) < 2:
                    continue

                # Use AI prediction
                prob = predictor.predict(dts)
                
                dts_sorted = sorted(dts)
                last = dts_sorted[-1]
                days_since = (now - last).days
                
                p = product_map.get(pid)
                if not p or (p.countInStock is not None and p.countInStock <= 0):
                    continue

                # Calculate gaps for reason message
                gaps = [(dts_sorted[i] - dts_sorted[i-1]).days 
                       for i in range(1, len(dts_sorted))]
                gaps = [g for g in gaps if g > 0]
                
                if not gaps:
                    mean_gap_str = "unknown"
                else:
                    mean_gap_str = str(int(np.mean(gaps)))

                if prob >= 0.55 or days_since >= 30:  # AI-based threshold
                    Recommendation.objects.create(
                        user=user,
                        product=p,
                        rec_type="restock",
                        score=float(prob),
                        reason=f"AI predicts restock ({int(prob*100)}% confidence, cycle ~{mean_gap_str} days)"
                    )

            # FREQUENTLY_BOUGHT
            if w2v and purchase_events:
                anchor_pid = str(sorted(purchase_events, key=lambda x: x[1], reverse=True)[0][0])
                if anchor_pid in w2v.wv:
                    similars = w2v.wv.most_similar(anchor_pid, topn=topn + 10)
                    count = 0
                    for pid_str, score in similars:
                        try:
                            pid2 = int(pid_str)
                        except ValueError:
                            pid2 = pid_str

                        if pid2 in bought_ids:
                            continue

                        p = product_map.get(pid2)
                        if not p or (p.countInStock is not None and p.countInStock <= 0):
                            continue

                        Recommendation.objects.create(
                            user=user,
                            product=p,
                            rec_type="frequently_bought",
                            score=float(score),
                            reason="Often bought together",
                        )
                        count += 1
                        if count >= topn:
                            break

        self.stdout.write(self.style.SUCCESS("Done. AI recommendations built."))
