from collections import Counter
from django.db.models import Count, Max

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from base.models import Product, Order, OrderItem, Recommendation
from base.serializers import ProductSerializer

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
    Time-based RESTOCK / REORDER (seconds-based, safe, dynamic):

    - For each product: collect purchase timestamps (order.createdAt)
    - expected_gap_seconds:
        * gap between 1st and 2nd purchase
        * optionally average consecutive gaps if 3+ purchases
    - show product only if:
        * since_last_seconds >= min_seconds  (default 30s)
        AND
        * since_last_seconds >= due_factor * expected_gap_seconds

    Query params:
      - topn (default 8)
      - min_seconds (default 30)      -> hard minimum delay before showing
      - due_factor (default 0.8)      -> how close to expected gap before showing
      - use_avg_gap (default 1)       -> if 1 and 3+ purchases, average consecutive gaps
      - include_oos (default 0)       -> if 1, include out-of-stock products too
    """

    topn = int(request.query_params.get("topn", 8))
    min_seconds = int(request.query_params.get("min_seconds", 30))
    due_factor = float(request.query_params.get("due_factor", 0.8))
    use_avg_gap = int(request.query_params.get("use_avg_gap", 1)) == 1
    include_oos = int(request.query_params.get("include_oos", 0)) == 1

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

    # which products are "due"
    due_pids = []
    meta = {}  # pid -> (count, expected_gap_seconds, since_last_seconds)

    for pid, dts in times_by_pid.items():
        if len(dts) < 2:
            continue

        dts_sorted = sorted(dts)

        # expected gap based on first->second purchase (seconds)
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

        last_buy = dts_sorted[-1]
        since_last = (now - last_buy).total_seconds()

        # HARD MINIMUM: don't show immediately after purchase
        if since_last < min_seconds:
            continue

        # TIME-DUE RULE
        if since_last >= due_factor * expected_gap:
            due_pids.append(pid)
            meta[pid] = (counts[pid], expected_gap, since_last)

    # fetch products
    qs = Product.objects.filter(**{f"{product_pk}__in": due_pids})
    if not include_oos:
        qs = qs.filter(countInStock__gt=0)

    products = list(qs)
    pmap = {getattr(p, product_pk): p for p in products}

    # rank: most overdue ratio first, then most bought
    def rank_key(pid):
        c, eg, sl = meta.get(pid, (0, 1.0, 0.0))
        ratio = sl / eg if eg else 0.0
        return (ratio, c)

    ranked = sorted([pid for pid in due_pids if pid in pmap], key=rank_key, reverse=True)

    out = []
    for pid in ranked[:topn]:
        p = pmap.get(pid)
        if not p:
            continue

        c, eg, sl = meta.get(pid, (0, 0.0, 0.0))

        # readable seconds
        sl_s = int(sl)
        eg_s = int(eg)

        out.append({
            "product": ProductSerializer(p, many=False).data,
            "score": float(c),
            "reason": f"Bought {c}× — last {sl_s}s ago (typical gap ~{eg_s}s)",
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

    out = []
    for pid in ranked:
        p = product_map.get(pid)
        if not p:
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
