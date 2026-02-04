#!/usr/bin/env python
"""
Generate sample purchase data for AI recommendation testing
"""
import os
import django
import random
from datetime import timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.utils import timezone
from base.models import User, Product, Order, OrderItem
from decimal import Decimal

def generate_sample_orders():
    """Generate realistic purchase history for testing AI recommendations"""
    
    print("\n🔄 Generating Sample Purchase Data...\n")
    
    # Get all users and products
    users = list(User.objects.all())
    products = list(Product.objects.all())
    
    if not users:
        print("❌ No users found! Please create users first.")
        return
    
    if not products:
        print("❌ No products found! Please create products first.")
        return
    
    print(f"👥 Found {len(users)} users")
    print(f"📦 Found {len(products)} products\n")
    
    # Define product bundles (items commonly bought together)
    bundles = [
        # Tech Bundle
        [p for p in products if any(x in p.name.lower() for x in ['iphone', 'airpods', 'apple', 'watch'])],
        # Gaming Bundle
        [p for p in products if any(x in p.name.lower() for x in ['playstation', 'mouse', 'gaming'])],
        # Kitchen Bundle
        [p for p in products if any(x in p.name.lower() for x in ['air fryer', 'airwrap'])],
        # Food Bundle (for restocking)
        [p for p in products if any(x in p.name.lower() for x in ['milk', 'salt', 'oil', 'sugar', 'vitamin'])],
    ]
    
    # Remove empty bundles
    bundles = [b for b in bundles if b]
    
    orders_created = 0
    
    # Generate orders for each user
    for user in users[:5]:  # First 5 users
        print(f"\n👤 Creating orders for {user.username}...")
        
        # Create 3-8 orders per user
        num_orders = random.randint(3, 8)
        
        for i in range(num_orders):
            # Random date in the past 90 days
            days_ago = random.randint(1, 90)
            order_date = timezone.now() - timedelta(days=days_ago)
            
            # Create order
            order = Order.objects.create(
                user=user,
                paymentMethod='PayPal',
                taxPrice=Decimal('0.00'),
                shippingPrice=Decimal('0.00'),
                totalPrice=Decimal('0.00'),
                isPaid=True,
                paidAt=order_date,
                isDelivered=True,
                deliveredAt=order_date + timedelta(days=3),
                createdAt=order_date
            )
            
            # Add items to order
            # Sometimes use bundles (60% chance), sometimes random
            if random.random() < 0.6 and bundles:
                # Pick a bundle
                bundle = random.choice(bundles)
                items_to_add = random.sample(bundle, min(random.randint(1, 3), len(bundle)))
            else:
                # Random products
                items_to_add = random.sample(products, random.randint(1, 4))
            
            total_price = Decimal('0.00')
            
            for product in items_to_add:
                quantity = random.randint(1, 2)
                price = product.price * quantity
                total_price += price
                
                OrderItem.objects.create(
                    product=product,
                    order=order,
                    name=product.name,
                    qty=quantity,
                    price=product.price,
                    image=product.image.url if product.image else ''
                )
            
            # Update order total
            order.totalPrice = total_price
            order.save()
            
            orders_created += 1
            print(f"  ✓ Order #{order._id}: {len(items_to_add)} items, ${total_price:.2f}, {days_ago} days ago")
    
    print(f"\n✅ Created {orders_created} completed orders!")
    
    # Create repeat purchases for restock recommendations
    print(f"\n🔄 Creating repeat purchases for restock testing...")
    
    # Pick first user and create repeat purchases of food items
    if users:
        user = users[0]
        food_products = [p for p in products if any(x in p.name.lower() for x in ['milk', 'salt', 'oil', 'vitamin'])]
        
        if food_products:
            repeat_count = 0
            for product in food_products[:3]:  # Pick 3 food items
                # Create 3-5 purchases over time with regular intervals
                num_repeats = random.randint(3, 5)
                base_days = 60
                interval = base_days // num_repeats  # Regular interval (e.g., every 15 days)
                
                for i in range(num_repeats):
                    days_ago = base_days - (i * interval) + random.randint(-2, 2)  # Add some variance
                    order_date = timezone.now() - timedelta(days=days_ago)
                    
                    order = Order.objects.create(
                        user=user,
                        paymentMethod='PayPal',
                        taxPrice=Decimal('0.00'),
                        shippingPrice=Decimal('0.00'),
                        totalPrice=product.price,
                        isPaid=True,
                        paidAt=order_date,
                        isDelivered=True,
                        deliveredAt=order_date + timedelta(days=2),
                        createdAt=order_date
                    )
                    
                    OrderItem.objects.create(
                        product=product,
                        order=order,
                        name=product.name,
                        qty=1,
                        price=product.price,
                        image=product.image.url if product.image else ''
                    )
                    
                    repeat_count += 1
            
            print(f"  ✓ Created {repeat_count} repeat purchases for {user.username}")
    
    print(f"\n🎉 Sample data generation complete!")
    print(f"\n📊 Database Status:")
    print(f"  Orders: {Order.objects.count()}")
    print(f"  Completed Orders: {Order.objects.filter(isPaid=True).count()}")
    print(f"  Order Items: {OrderItem.objects.count()}")

if __name__ == '__main__':
    # Ask for confirmation
    print("⚠️  This will create sample purchase data in your database.")
    response = input("Continue? (yes/no): ")
    
    if response.lower() in ['yes', 'y']:
        generate_sample_orders()
    else:
        print("Cancelled.")
