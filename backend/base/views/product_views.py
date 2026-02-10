from django.shortcuts import render

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger

from base.models import Product, Review, ProductEmbedding, ProductEvent
from base.serializers import ProductSerializer

from rest_framework import status
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

# For semantic search
try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMER_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMER_AVAILABLE = False


@api_view(['GET'])
def getProducts(request):
    query = request.query_params.get('keyword')
    semantic_mode = request.query_params.get('semantic', '0') == '1'
    
    if query == None:
        query = ''

    # Semantic Search Mode
    if query and semantic_mode and SENTENCE_TRANSFORMER_AVAILABLE:
        try:
            # Load embedder
            embedder = SentenceTransformer('all-MiniLM-L6-v2')
            
            # Get query embedding
            query_vec = embedder.encode(query, normalize_embeddings=True)
            
            # Get all product embeddings
            product_embeddings = ProductEmbedding.objects.select_related('product').all()
            
            if not product_embeddings:
                # Fallback to keyword search if no embeddings
                products = Product.objects.filter(name__icontains=query).order_by('-createdAt')
            else:
                # Calculate similarities
                product_ids = []
                product_vecs = []
                
                for pe in product_embeddings:
                    if pe.vector and len(pe.vector) > 0:
                        product_ids.append(pe.product_id)
                        product_vecs.append(np.array(pe.vector, dtype=np.float32))
                
                if product_vecs:
                    all_vecs = np.vstack(product_vecs)
                    similarities = cosine_similarity([query_vec], all_vecs)[0]
                    
                    # Sort by similarity (descending)
                    ranked = sorted(zip(product_ids, similarities), key=lambda x: x[1], reverse=True)
                    
                    # Get top products (filter by similarity threshold)
                    top_product_ids = [pid for pid, sim in ranked if sim > 0.20]  # 0.20 threshold (lowered for better results)
                    
                    if top_product_ids:
                        # Preserve order from ranking
                        products_list = list(Product.objects.filter(_id__in=top_product_ids))
                        id_to_product = {p._id: p for p in products_list}
                        products = [id_to_product[pid] for pid in top_product_ids if pid in id_to_product]
                    else:
                        products = []
                else:
                    products = Product.objects.filter(name__icontains=query).order_by('-createdAt')
        except Exception as e:
            # Fallback to keyword search
            products = Product.objects.filter(name__icontains=query).order_by('-createdAt')
    else:
        # Regular keyword search
        products = Product.objects.filter(name__icontains=query).order_by('-createdAt')

    # Pagination
    page = request.query_params.get('page')
    paginator = Paginator(products, 8)

    try:
        products = paginator.page(page)
    except PageNotAnInteger:
        products = paginator.page(1)
    except EmptyPage:
        products = paginator.page(paginator.num_pages)

    if page == None:
        page = 1

    page = int(page)
    
    serializer = ProductSerializer(products, many=True)
    
    return Response({'products': serializer.data, 'page': page, 'pages': paginator.num_pages})


@api_view(['GET'])
def getTopProducts(request):
    products = Product.objects.filter(rating__gte=4).order_by('-rating')[0:5]
    serializer = ProductSerializer(products, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def getProduct(request, pk):
    product = Product.objects.get(_id=pk)
    serializer = ProductSerializer(product, many=False)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def createProduct(request):
    user = request.user

    product = Product.objects.create(
        user=user,
        name='Sample Name',
        price=0,
        brand='Sample Brand',
        countInStock=0,
        category='Sample Category',
        description=''
    )

    serializer = ProductSerializer(product, many=False)
    return Response(serializer.data)


@api_view(['PUT'])
@permission_classes([IsAdminUser])
def updateProduct(request, pk):
    data = request.data
    product = Product.objects.get(_id=pk)

    product.name = data['name']
    product.price = data['price']
    product.brand = data['brand']
    product.countInStock = data['countInStock']
    product.category = data['category']
    product.description = data['description']

    product.save()

    serializer = ProductSerializer(product, many=False)
    return Response(serializer.data)


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def deleteProduct(request, pk):
    product = Product.objects.get(_id=pk)
    product.delete()
    return Response('Producted Deleted')


@api_view(['POST'])
def uploadImage(request):
    data = request.data

    product_id = data['product_id']
    product = Product.objects.get(_id=product_id)

    product.image = request.FILES.get('image')
    product.save()

    return Response('Image was uploaded')


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def createProductReview(request, pk):
    user = request.user
    product = Product.objects.get(_id=pk)
    data = request.data

    # 1 - Review already exists
    alreadyExists = product.review_set.filter(user=user).exists()
    if alreadyExists:
        content = {'detail': 'Product already reviewed'}
        return Response(content, status=status.HTTP_400_BAD_REQUEST)

    # 2 - No Rating or 0
    elif data['rating'] == 0:
        content = {'detail': 'Please select a rating'}
        return Response(content, status=status.HTTP_400_BAD_REQUEST)

    # 3 - Create review
    else:
        review = Review.objects.create(
            user=user,
            product=product,
            name=user.first_name,
            rating=data['rating'],
            comment=data['comment'],
        )

        reviews = product.review_set.all()
        product.numReviews = len(reviews)

        total = 0
        for i in reviews:
            total += i.rating

        product.rating = total / len(reviews)
        product.save()

        return Response('Review Added')


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trackProductEvent(request, pk):
    """
    Track user product events (view, add_to_cart, purchase)
    Body: { "event_type": "view" | "add_to_cart" | "purchase" }
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

        event_type = request.data.get('event_type', 'view')
        
        if event_type not in ['view', 'add_to_cart', 'purchase']:
            return Response(
                {'error': 'Invalid event_type. Must be: view, add_to_cart, or purchase'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create or update event (avoid duplicates for views within same session)
        # For views, we'll create a new event each time (allows tracking frequency)
        # For cart/purchase, we can check if already exists
        if event_type == 'view':
            # Always create view events to track frequency
            ProductEvent.objects.create(
                user=user,
                product=product,
                event_type=event_type,
                weight=1.0
            )
        else:
            # For cart/purchase, create if doesn't exist
            ProductEvent.objects.get_or_create(
                user=user,
                product=product,
                event_type=event_type,
                defaults={'weight': 1.0}
            )

        return Response({
            'message': f'Event tracked: {event_type}',
            'product_id': product._id,
            'event_type': event_type
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
