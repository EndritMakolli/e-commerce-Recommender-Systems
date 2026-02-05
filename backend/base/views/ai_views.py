"""
AI-powered features: Visual Search
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from base.models import Product, ProductImageEmbedding
from base.serializers import ProductSerializer
from base.ml.image_search import get_image_search_engine

import numpy as np


@api_view(['POST'])
@permission_classes([AllowAny])
def visualSearch(request):
    """
    Visual search - upload image to find similar products
    Expects: multipart/form-data with 'image' file
    Query params: top_k (default 8), min_similarity (default 0.65)
    """
    if 'image' not in request.FILES:
        return Response(
            {'error': 'No image file provided'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    image_file = request.FILES['image']
    top_k = int(request.GET.get('top_k', 8))
    min_similarity = float(request.GET.get('min_similarity', 0.65))  # 65% minimum threshold
    
    # Get image search engine
    search_engine = get_image_search_engine()
    if not search_engine:
        return Response(
            {'error': 'Visual search not available'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    
    try:
        # Encode uploaded image
        query_embedding = search_engine.encode_image_bytes(image_file.read())
        
        # Get all product image embeddings
        product_embeddings = []
        for img_emb in ProductImageEmbedding.objects.select_related('product').all():
            if img_emb.vector and len(img_emb.vector) > 0:
                product_embeddings.append((
                    img_emb.product._id,
                    np.array(img_emb.vector, dtype=np.float32)
                ))
        
        if not product_embeddings:
            return Response({
                'results': [],
                'message': 'No product embeddings available. Please generate embeddings first.'
            })
        
        # Find similar products
        similar = search_engine.find_similar(query_embedding, product_embeddings, top_k=top_k)
        
        # Fetch products and serialize with threshold filtering
        results = []
        
        for product_id, similarity in similar:
            # Apply similarity threshold
            if similarity < min_similarity:
                continue
            
            try:
                product = Product.objects.get(_id=product_id)
                match_pct = round(float(similarity) * 100, 1)
                
                results.append({
                    'product': ProductSerializer(product, many=False).data,
                    'similarity': round(float(similarity), 3),
                    'match_percentage': match_pct
                })
            except Product.DoesNotExist:
                continue
        
        return Response({
            'results': results,
            'total_found': len(results)
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
