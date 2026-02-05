"""
Visual/Image Search using CLIP embeddings
Allows users to search for products by uploading images
"""

import numpy as np
from PIL import Image
import io

try:
    from transformers import CLIPProcessor, CLIPModel
    import torch
    CLIP_AVAILABLE = True
except ImportError:
    CLIP_AVAILABLE = False


class ImageSearchEngine:
    """Visual search engine using CLIP embeddings"""
    
    def __init__(self):
        if not CLIP_AVAILABLE:
            raise ImportError("transformers and torch libraries not available")
        
        # Load CLIP model (smaller variant for speed)
        self.model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        self.processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        self.model.eval()
    
    def encode_image(self, image):
        """
        Generate embedding vector for an image
        
        Args:
            image: PIL Image or file-like object
            
        Returns:
            np.array: Image embedding vector
        """
        # Convert to PIL Image if needed
        if not isinstance(image, Image.Image):
            try:
                image = Image.open(image).convert('RGB')
            except Exception as e:
                raise ValueError(f"Could not load image: {e}")
        
        # Ensure RGB
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Process and encode
        inputs = self.processor(images=image, return_tensors="pt")
        
        with torch.no_grad():
            # Get image features - returns tensor directly for some models
            image_features = self.model.get_image_features(**inputs)
            
            # Convert to numpy (handle both tensor and ModelOutput)
            if hasattr(image_features, 'pooler_output'):
                features = image_features.pooler_output.cpu().numpy().squeeze()
            elif torch.is_tensor(image_features):
                features = image_features.cpu().numpy().squeeze()
            else:
                # Fallback - convert the whole output
                features = np.array(image_features).squeeze()
            
            # L2 normalization
            norm = np.linalg.norm(features)
            if norm > 0:
                features = features / norm
        
        return features
    
    def encode_image_path(self, image_path):
        """
        Generate embedding for image from file path
        
        Args:
            image_path (str): Path to image file
            
        Returns:
            np.array: Image embedding vector
        """
        with Image.open(image_path).convert('RGB') as img:
            return self.encode_image(img)
    
    def encode_image_bytes(self, image_bytes):
        """
        Generate embedding for image from bytes
        
        Args:
            image_bytes (bytes): Image data as bytes
            
        Returns:
            np.array: Image embedding vector
        """
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        return self.encode_image(image)
    
    def find_similar(self, query_embedding, product_embeddings, top_k=10):
        """
        Find most similar products to query image
        
        Args:
            query_embedding (np.array): Query image embedding
            product_embeddings (list): List of (product_id, embedding) tuples
            top_k (int): Number of results to return
            
        Returns:
            list: List of (product_id, similarity_score) tuples
        """
        if not product_embeddings:
            return []
        
        # Extract embeddings and ids
        product_ids = [pid for pid, _ in product_embeddings]
        embeddings = np.vstack([emb for _, emb in product_embeddings])
        
        # Normalize embeddings
        embeddings_norm = embeddings / np.linalg.norm(embeddings, axis=1, keepdims=True)
        query_norm = query_embedding / np.linalg.norm(query_embedding)
        
        # Calculate cosine similarity
        similarities = np.dot(embeddings_norm, query_norm)
        
        # Get top K
        top_indices = np.argsort(similarities)[-top_k:][::-1]
        
        results = [
            (product_ids[idx], float(similarities[idx]))
            for idx in top_indices
        ]
        
        return results


def get_image_search_engine():
    """Singleton pattern for image search engine"""
    if not hasattr(get_image_search_engine, '_instance'):
        if CLIP_AVAILABLE:
            get_image_search_engine._instance = ImageSearchEngine()
        else:
            get_image_search_engine._instance = None
    return get_image_search_engine._instance
