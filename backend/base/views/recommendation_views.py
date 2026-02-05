from collections import Counter
from django.db.models import Count, Max

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from base.models import Product, Order, OrderItem, Recommendation
from base.serializers import ProductSerializer
from base.ml.restock_predictor import get_restock_predictor

from collections import Counter, defaultdict
from django.utils import timezone
from datetime import datetime


def _pk_field(model, fallback="id"):
    try:
        model._meta.get_field("_id")
        return "_id"
    except Exception:
        return fallback


def _serialize_products(products, reason, rec_type="for_you_dynamic"):
    return [
        {
            "product": ProductSerializer(p, many=False).data,
            "score": 0.0,
            "reason": reason,
            "type": rec_type,
        }
        for p in products
    ]


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def getRecommendations(request):
    rec_type = request.query_params.get("type", "for_you")

    qs = (
        Recommendation.objects
        .filter(user=request.user, rec_type=rec_type)
        .select_related("product")
        .order_by("-score")[:20]
    )

    return Response([
        {
            "product": ProductSerializer(r.product, many=False).data,
            "score": float(r.score or 0),
            "reason": r.reason,
            "type": r.rec_type,
        }
        for r in qs
    ])


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def getMyRecommendationsDynamic(request):
    """
    Dynamic with fallback:
    1) Use LAST ORDER basket + co-occurrence (most dynamic)
    2) If no last order/items -> category-based from user history
    3) If no history -> popular in-stock fallback (so slider never disappears)
    """
    topn = int(request.query_params.get("topn", 8))
    max_cats = int(request.query_params.get("max_cats", 3))

    order_pk = _pk_field(Order)
    product_pk = _pk_field(Product)

    # ---------------------------
    # Build user history (for fallback + category lock)
    # ---------------------------
    user_items = (
        OrderItem.objects
        .filter(order__user=request.user)
        .select_related("product")
    )

    bought_ids = set()
    cat_counts = Counter()

    for oi in user_items:
        p = oi.product
        if not p:
            continue
        pid = getattr(p, product_pk, None)
        if pid is not None:
            bought_ids.add(pid)

        cat = getattr(p, "category", None)
        if cat:
            cat_counts[cat] += 1

    top_cats = [c for c, _ in cat_counts.most_common(max_cats)] if cat_counts else []

    # ---------------------------
    # 1) LAST ORDER anchor (most dynamic)
    # ---------------------------
    last_order = (
        Order.objects
        .filter(user=request.user)
        .order_by(f"-{order_pk}")
        .first()
    )

    if last_order:
        anchor_pids = list(
            OrderItem.objects
            .filter(order=last_order)
            .values_list("product_id", flat=True)
        )
        anchor_pids = [pid for pid in anchor_pids if pid is not None]

        if anchor_pids:
            order_ids = (
                OrderItem.objects
                .filter(product_id__in=anchor_pids)
                .values_list("order_id", flat=True)
                .distinct()
            )

            others = (
                OrderItem.objects
                .filter(order_id__in=order_ids)
                .exclude(product_id__in=anchor_pids)
                .values_list("product_id", flat=True)
            )

            counts = Counter([pid for pid in others if pid is not None])
            ranked = [pid for pid, _ in counts.most_common(200)]

            filter_key = f"{product_pk}__in"
            products = list(
                Product.objects
                .filter(**{filter_key: ranked})
                .filter(countInStock__gt=0)
            )
            product_map = {getattr(p, product_pk): p for p in products}

            out = []
            for pid in ranked:
                p = product_map.get(pid)
                if not p:
                    continue
                if pid in bought_ids:
                    continue
                if top_cats and getattr(p, "category", None) not in top_cats:
                    continue

                out.append({
                    "product": ProductSerializer(p, many=False).data,
                    "score": float(counts.get(pid, 0)),
                    "reason": "Based on your last order (often bought together)",
                    "type": "for_you_dynamic",
                })
                if len(out) >= topn:
                    break

            if out:
                return Response(out)

    # ---------------------------
    # 2) Category-based fallback (history exists but no anchor)
    # ---------------------------
    if top_cats:
        candidates = (
            Product.objects
            .filter(category__in=top_cats, countInStock__gt=0)
            .exclude(**{f"{product_pk}__in": list(bought_ids)})
            .order_by("-rating", "-numReviews")[:topn]
        )
        if candidates:
            return Response(_serialize_products(
                candidates,
                reason="From categories you buy often",
                rec_type="for_you_dynamic",
            ))

    # ---------------------------
    # 3) Popular fallback (no orders / empty history)
    # ---------------------------
    popular = (
        Product.objects
        .filter(countInStock__gt=0)
        .order_by("-rating", "-numReviews")[:topn]
    )
    return Response(_serialize_products(popular, reason="Popular picks", rec_type="for_you_dynamic"))

from collections import Counter, defaultdict
from django.utils import timezone
from datetime import datetime

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def getRestockDynamic(request):
    """
    Time-based RESTOCK / REORDER with AI predictions (seconds-based, safe, dynamic):

    - For each product: collect purchase timestamps (order.createdAt)
    - Uses AI model to predict restock probability
    - Fallback to statistical method if AI unavailable

    Query params:
      - topn (default 8)
      - min_seconds (default 30)      -> hard minimum delay before showing
      - due_factor (default 0.8)      -> how close to expected gap before showing
      - use_avg_gap (default 1)       -> if 1 and 3+ purchases, average consecutive gaps
      - include_oos (default 0)       -> if 1, include out-of-stock products too
      - use_ai (default 1)            -> if 1, use AI predictions; if 0, use statistical method
    """

    topn = int(request.query_params.get("topn", 8))
    min_seconds = int(request.query_params.get("min_seconds", 30))
    due_factor = float(request.query_params.get("due_factor", 0.8))
    use_avg_gap = int(request.query_params.get("use_avg_gap", 1)) == 1
    include_oos = int(request.query_params.get("include_oos", 0)) == 1
    use_ai = int(request.query_params.get("use_ai", 1)) == 1

    product_pk = _pk_field(Product)

    user_items = (
        OrderItem.objects
        .filter(order__user=request.user)
        .select_related("product", "order")
    )

    # purchase timestamps by product id
    times_by_pid = defaultdict(list)
    counts = Counter()

    for oi in user_items:
        p = getattr(oi, "product", None)
        o = getattr(oi, "order", None)
        if not p or not o:
            continue

        # OPTIONAL: only count paid orders (uncomment if you want)
        # if not getattr(o, "isPaid", False):
        #     continue

        pid = getattr(p, product_pk, None)
        if pid is None:
            continue

        dt = getattr(o, "createdAt", None)
        if not dt:
            continue

        # if dt is a string or invalid, skip safely
        if isinstance(dt, str):
            continue

        # make timezone-aware safely
        try:
            if timezone.is_naive(dt):
                dt = timezone.make_aware(dt, timezone.get_current_timezone())
        except Exception:
            continue

        times_by_pid[pid].append(dt)
        counts[pid] += 1

    now = timezone.now()

    # Get AI predictor if enabled
    predictor = get_restock_predictor() if use_ai else None

    # which products are "due"
    due_pids = []
    meta = {}  # pid -> (count, expected_gap_seconds, since_last_seconds, ai_prob)

    for pid, dts in times_by_pid.items():
        if len(dts) < 2:
            continue

        dts_sorted = sorted(dts)
        last_buy = dts_sorted[-1]
        since_last = (now - last_buy).total_seconds()

        # HARD MINIMUM: don't show immediately after purchase
        if since_last < min_seconds:
            continue

        # Use AI prediction if available
        if predictor and use_ai:
            try:
                ai_prob = predictor.predict(dts)
                
                # Use AI probability for scoring
                if ai_prob >= 0.55:  # AI confidence threshold
                    gap_1_2 = (dts_sorted[1] - dts_sorted[0]).total_seconds()
                    expected_gap = float(gap_1_2)
                    
                    if use_avg_gap and len(dts_sorted) >= 3:
                        gaps = []
                        for i in range(1, len(dts_sorted)):
                            g = (dts_sorted[i] - dts_sorted[i - 1]).total_seconds()
                            if g > 0:
                                gaps.append(g)
                        if gaps:
                            expected_gap = sum(gaps) / len(gaps)
                    
                    due_pids.append(pid)
                    meta[pid] = (counts[pid], expected_gap, since_last, ai_prob)
                continue
            except Exception as e:
                print(f"AI prediction failed for {pid}: {e}")
                # Fall through to statistical method

        # Fallback to statistical method
        gap_1_2 = (dts_sorted[1] - dts_sorted[0]).total_seconds()
        if gap_1_2 <= 0:
            continue

        expected_gap = float(gap_1_2)

        # if 3+ purchases and enabled: average consecutive gaps (seconds)
        if use_avg_gap and len(dts_sorted) >= 3:
            gaps = []
            for i in range(1, len(dts_sorted)):
                g = (dts_sorted[i] - dts_sorted[i - 1]).total_seconds()
                if g > 0:
                    gaps.append(g)
            if gaps:
                expected_gap = sum(gaps) / len(gaps)

        # TIME-DUE RULE
        if since_last >= due_factor * expected_gap:
            due_pids.append(pid)
            meta[pid] = (counts[pid], expected_gap, since_last, None)

    # fetch products
    qs = Product.objects.filter(**{f"{product_pk}__in": due_pids})
    if not include_oos:
        qs = qs.filter(countInStock__gt=0)

    products = list(qs)
    pmap = {getattr(p, product_pk): p for p in products}

    # Updated ranking with AI scores
    def rank_key(pid):
        data = meta.get(pid, (0, 1.0, 0.0, None))
        c = data[0]
        eg = data[1]
        sl = data[2]
        ai_prob = data[3] if len(data) > 3 else None
        
        if ai_prob is not None:
            # AI-based ranking
            return (ai_prob, c)
        else:
            # Statistical ranking
            ratio = sl / eg if eg else 0.0
            return (ratio, c)

    ranked = sorted([pid for pid in due_pids if pid in pmap], key=rank_key, reverse=True)

    out = []
    for pid in ranked[:topn]:
        p = pmap.get(pid)
        if not p:
            continue

        data = meta.get(pid, (0, 0.0, 0.0, None))
        c = data[0]
        eg = data[1]
        sl = data[2]
        ai_prob = data[3] if len(data) > 3 else None

        # Convert seconds to human-readable format
        def format_time(seconds):
            seconds = int(seconds)
            if seconds < 3600:  # Less than 1 hour
                minutes = seconds // 60
                return f"{minutes} min" if minutes > 0 else f"{seconds} sec"
            elif seconds < 86400:  # Less than 1 day
                hours = seconds // 3600
                return f"{hours} hour{'s' if hours != 1 else ''}"
            else:  # Days
                days = seconds // 86400
                return f"{days} day{'s' if days != 1 else ''}"
        
        time_ago = format_time(sl)
        typical_gap = format_time(eg)
        
        # Enhanced reason with AI indicator
        if ai_prob is not None:
            reason = f"AI predicts restock ({int(ai_prob*100)}% confidence) — last bought {time_ago} ago"
        else:
            reason = f"Bought {c}× — last {time_ago} ago (typical gap ~{typical_gap})"

        out.append({
            "product": ProductSerializer(p, many=False).data,
            "score": float(ai_prob if ai_prob is not None else c),
            "reason": reason,
            "type": "restock_dynamic",
        })

    return Response(out)



@api_view(["GET"])
@permission_classes([AllowAny])
def getRelatedProducts(request, pk):
    product_pk = _pk_field(Product)

    try:
        anchor = Product.objects.get(**{product_pk: pk})
    except Product.DoesNotExist:
        return Response([], status=200)

    anchor_id = getattr(anchor, product_pk)
    anchor_category = (anchor.category or "").lower().strip()

    order_ids = (
        OrderItem.objects
        .filter(product_id=anchor_id)
        .values_list("order_id", flat=True)
        .distinct()
    )

    others = (
        OrderItem.objects
        .filter(order_id__in=order_ids)
        .exclude(product_id=anchor_id)
        .values_list("product_id", flat=True)
    )

    counts = Counter([pid for pid in others if pid is not None])
    ranked = [pid for pid, _ in counts.most_common(200)]

    filter_key = f"{product_pk}__in"
    products = list(Product.objects.filter(**{filter_key: ranked}).filter(countInStock__gt=0))
    product_map = {getattr(p, product_pk): p for p in products}

    # Category-based filtering with smart logic
    # Define related category groups (products in same group can be recommended together)
    category_groups = [
        {'electronics', 'computers', 'gaming', 'cameras', 'audio'},
        {'food', 'grocery', 'beverages', 'snacks'},
        {'health', 'vitamins', 'supplements', 'wellness'},
        {'beauty', 'cosmetics', 'personal care', 'hair care'},
        {'home', 'kitchen', 'appliances'},
        {'clothing', 'fashion', 'accessories'},
    ]
    
    def categories_are_related(cat1, cat2):
        """Check if two categories should allow cross-recommendations"""
        if not cat1 or not cat2:
            return True  # If no category, allow (fallback)
        
        c1 = cat1.lower().strip()
        c2 = cat2.lower().strip()
        
        if c1 == c2:
            return True  # Same category
        
        # Check if both categories are in the same group
        for group in category_groups:
            c1_in_group = any(keyword in c1 for keyword in group)
            c2_in_group = any(keyword in c2 for keyword in group)
            if c1_in_group and c2_in_group:
                return True
        
        return False

    out = []
    
    for pid in ranked:
        p = product_map.get(pid)
        if not p:
            continue
        
        # Apply category filtering
        if anchor_category and p.category:
            if not categories_are_related(anchor_category, p.category):
                continue
        
        out.append({
            "product": ProductSerializer(p, many=False).data,
            "score": float(counts.get(pid, 0)),
            "reason": f"Often bought together with {anchor.name}",
            "type": "related",
        })
        if len(out) >= 8:
            break

    return Response(out)
