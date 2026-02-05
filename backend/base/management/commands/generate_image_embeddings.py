"""
Management command to generate image embeddings for visual search
"""

from django.core.management.base import BaseCommand
from base.models import Product, ProductImageEmbedding
from base.ml.image_search import get_image_search_engine
import os


class Command(BaseCommand):
    help = 'Generate image embeddings for all products with images'

    def handle(self, *args, **options):
        self.stdout.write("🖼️  Generating image embeddings for visual search...")
        
        # Get image search engine
        search_engine = get_image_search_engine()
        if not search_engine:
            self.stdout.write(self.style.ERROR("Image search engine not available. Install required packages."))
            return
        
        # Get all products with images
        products = Product.objects.exclude(image='').exclude(image=None)
        total = products.count()
        
        if total == 0:
            self.stdout.write(self.style.WARNING("No products with images found."))
            return
        
        self.stdout.write(f"Found {total} products with images\n")
        
        created = 0
        updated = 0
        errors = 0
        
        for i, product in enumerate(products, 1):
            try:
                # Get or create image embedding
                img_emb, is_new = ProductImageEmbedding.objects.get_or_create(product=product)
                
                # Check if image file exists
                if not os.path.exists(product.image.path):
                    self.stdout.write(self.style.WARNING(f"  [{i}/{total}] Image not found for {product.name}"))
                    errors += 1
                    continue
                
                # Generate embedding
                embedding = search_engine.encode_image_path(product.image.path)
                img_emb.vector = embedding.tolist()
                img_emb.save()
                
                if is_new:
                    created += 1
                else:
                    updated += 1
                
                if i % 5 == 0:
                    self.stdout.write(f"  Processed {i}/{total} products...")
                    
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"  [{i}/{total}] Error processing {product.name}: {e}"))
                errors += 1
        
        self.stdout.write("\n" + "="*50)
        self.stdout.write(self.style.SUCCESS(f"✅ Complete!"))
        self.stdout.write(f"   Created: {created}")
        self.stdout.write(f"   Updated: {updated}")
        if errors > 0:
            self.stdout.write(self.style.WARNING(f"   Errors: {errors}"))
        self.stdout.write("="*50)
