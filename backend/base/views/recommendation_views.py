from collections import Counter

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from base.models import Product, Order, OrderItem, Recommendation
from base.serializers import ProductSerializer


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
