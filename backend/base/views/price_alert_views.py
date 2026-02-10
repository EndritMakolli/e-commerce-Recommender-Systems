from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from decimal import Decimal

from base.models import Product, PriceAlert, PriceHistory
from base.serializers import ProductSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def createPriceAlert(request):
    """
    Create a price alert for a product
    Body: {
        "product_id": 1,
        "target_price": 99.99,  // optional
        "notify_any_drop": false  // optional, default false
    }
    """
    try:
        user = request.user
        product_id = request.data.get('product_id')
        target_price = request.data.get('target_price')
        notify_any_drop = request.data.get('notify_any_drop', False)

        if not product_id:
            return Response(
                {'error': 'product_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            product = Product.objects.get(_id=product_id)
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if alert already exists
        alert, created = PriceAlert.objects.get_or_create(
            user=user,
            product=product,
            defaults={
                'target_price': target_price,
                'notify_any_drop': notify_any_drop,
                'is_active': True,
                'notified': False
            }
        )

        if not created:
            # Update existing alert
            alert.target_price = target_price
            alert.notify_any_drop = notify_any_drop
            alert.is_active = True
            alert.notified = False
            alert.save()

        return Response({
            'message': 'Price alert created successfully',
            'alert': {
                'id': alert._id,
                'product_id': product._id,
                'product_name': product.name,
                'current_price': float(product.price),
                'target_price': float(alert.target_price) if alert.target_price else None,
                'notify_any_drop': alert.notify_any_drop,
                'created_at': alert.createdAt
            }
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getUserPriceAlerts(request):
    """Get all active price alerts for the logged-in user"""
    try:
        user = request.user
        alerts = PriceAlert.objects.filter(
            user=user,
            is_active=True
        ).select_related('product')

        alert_data = []
        for alert in alerts:
            product = alert.product
            
            # Check if price has dropped
            price_dropped = False
            if alert.notify_any_drop:
                # Check price history to see if there's a drop
                latest_history = PriceHistory.objects.filter(
                    product=product
                ).order_by('-createdAt').first()
                
                if latest_history and latest_history.price < product.price:
                    price_dropped = True
            elif alert.target_price and product.price <= alert.target_price:
                price_dropped = True

            alert_data.append({
                'id': alert._id,
                'product': {
                    'id': product._id,
                    'name': product.name,
                    'image': product.image.url if product.image else None,
                    'current_price': float(product.price),
                    'category': product.category,
                    'countInStock': product.countInStock
                },
                'target_price': float(alert.target_price) if alert.target_price else None,
                'notify_any_drop': alert.notify_any_drop,
                'price_dropped': price_dropped,
                'notified': alert.notified,
                'created_at': alert.createdAt
            })

        return Response({
            'alerts': alert_data,
            'count': len(alert_data)
        })

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def deletePriceAlert(request, pk):
    """Delete a price alert"""
    try:
        user = request.user
        
        try:
            alert = PriceAlert.objects.get(_id=pk, user=user)
        except PriceAlert.DoesNotExist:
            return Response(
                {'error': 'Price alert not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        alert.delete()
        
        return Response(
            {'message': 'Price alert deleted successfully'},
            status=status.HTTP_200_OK
        )

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def getProductPriceHistory(request, pk):
    """Get price history for a product"""
    try:
        try:
            product = Product.objects.get(_id=pk)
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get price history (last 90 days)
        from datetime import timedelta
        ninety_days_ago = timezone.now() - timedelta(days=90)
        
        history = PriceHistory.objects.filter(
            product=product,
            createdAt__gte=ninety_days_ago
        ).order_by('createdAt')

        history_data = [{
            'price': float(h.price),
            'discount_percentage': float(h.discount_percentage),
            'date': h.createdAt.strftime('%Y-%m-%d'),
            'timestamp': h.createdAt.isoformat()
        } for h in history]

        # Add current price
        current_data = {
            'price': float(product.price),
            'discount_percentage': 0.0,
            'date': timezone.now().strftime('%Y-%m-%d'),
            'timestamp': timezone.now().isoformat()
        }

        # Calculate stats
        if history_data:
            prices = [h['price'] for h in history_data]
            lowest_price = min(prices)
            highest_price = max(prices)
            average_price = sum(prices) / len(prices)
        else:
            lowest_price = highest_price = average_price = float(product.price)

        return Response({
            'product_id': product._id,
            'product_name': product.name,
            'current_price': float(product.price),
            'history': history_data,
            'stats': {
                'lowest_price': lowest_price,
                'highest_price': highest_price,
                'average_price': round(average_price, 2),
                'current_vs_lowest': round(((float(product.price) - lowest_price) / lowest_price) * 100, 2) if lowest_price > 0 else 0,
                'current_vs_average': round(((float(product.price) - average_price) / average_price) * 100, 2) if average_price > 0 else 0
            }
        })

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getSmartPricingRecommendation(request, pk):
    """
    AI-powered smart pricing recommendation
    Suggests optimal discount for a user based on their behavior
    """
    try:
        user = request.user
        
        try:
            product = Product.objects.get(_id=pk)
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # AI Logic: Analyze user behavior and product data
        from base.models import ProductEvent, Order, OrderItem
        from datetime import timedelta

        # 1. Check how many times user viewed this product
        view_count = ProductEvent.objects.filter(
            user=user,
            product=product,
            event_type='view'
        ).count()
        # Include current page view (track may not be saved yet when smart-pricing is called)
        effective_view_count = view_count + 1

        # 2. Check if product is in cart but not purchased
        cart_added = ProductEvent.objects.filter(
            user=user,
            product=product,
            event_type='add_to_cart'
        ).exists()

        # 3. Check user's purchase history in this category
        user_category_purchases = OrderItem.objects.filter(
            order__user=user,
            order__isPaid=True,
            product__category=product.category
        ).count()

        # 4. Calculate time since first view
        first_view = ProductEvent.objects.filter(
            user=user,
            product=product,
            event_type='view'
        ).order_by('createdAt').first()

        days_since_first_view = 0
        if first_view:
            days_since_first_view = (timezone.now() - first_view.createdAt).days

        # AI Decision Logic
        recommended_discount = 0
        confidence = 0.0
        reason = "Standard pricing"

        # High interest signals (presentation: same day so demo works in one session)
        # Use effective_view_count so current page view counts even if track not saved yet
        if effective_view_count >= 3 and days_since_first_view >= 0:
            recommended_discount = 15
            confidence = 0.85
            reason = "User viewed 3+ times - high interest, price sensitive"
            branch = "15% (3+ views, same day)"
        elif cart_added and days_since_first_view >= 1:
            recommended_discount = 10
            confidence = 0.75
            reason = "Item in cart but not purchased - needs incentive"
            branch = "10% (cart, 1+ day)"
        elif effective_view_count >= 2:
            recommended_discount = 5
            confidence = 0.60
            reason = "Multiple views - showing interest"
            branch = "5% (2+ views)"
        elif user_category_purchases >= 3:
            recommended_discount = 8
            confidence = 0.70
            reason = "Frequent buyer in this category - loyalty discount"
            branch = "8% (category loyalty)"
        else:
            confidence = 0.50
            reason = "New viewer - standard pricing"
            branch = "0% (new viewer)"

        # Calculate suggested price
        current_price = float(product.price)
        suggested_price = current_price * (1 - recommended_discount / 100)

        return Response({
            'product_id': product._id,
            'product_name': product.name,
            'current_price': current_price,
            'suggested_discount': recommended_discount,
            'suggested_price': round(suggested_price, 2),
            'confidence': confidence,
            'reason': reason,
            'user_signals': {
                'view_count': view_count,
                'effective_view_count': effective_view_count,
                'cart_added': cart_added,
                'days_since_first_view': days_since_first_view,
                'category_purchases': user_category_purchases
            }
        })

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
