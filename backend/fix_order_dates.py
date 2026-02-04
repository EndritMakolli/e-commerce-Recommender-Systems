#!/usr/bin/env python
"""
Fix order dates to be properly spaced over time for AI recommendations
"""
import os
import django
import random
from datetime import timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.utils import timezone
from base.models import Order

def fix_order_dates():
    """Update existing orders to have realistic dates spread over the past 90 days"""
    
    print("\n🔧 Fixing Order Dates...\n")
    
    orders = Order.objects.filter(isPaid=True).order_by('_id')
    
    if not orders.exists():
        print("❌ No paid orders found!")
        return
    
    print(f"Found {orders.count()} paid orders")
    
    # Group orders by user to maintain temporal relationships
    from collections import defaultdict
    orders_by_user = defaultdict(list)
    
    for order in orders:
        orders_by_user[order.user_id].append(order)
    
    updated_count = 0
    
    for user_id, user_orders in orders_by_user.items():
        # Sort by current ID to maintain order
        user_orders.sort(key=lambda o: o._id)
        
        # Distribute orders over past 90 days
        num_orders = len(user_orders)
        
        for i, order in enumerate(user_orders):
            # Older orders first, newer orders more recent
            # Spread evenly but with some randomness
            if num_orders > 1:
                # Position in time (0 = oldest, 1 = newest)
                position = i / (num_orders - 1)
                # Days ago (90 days ago for oldest, 1-10 days ago for newest)
                days_ago = int(90 - (position * 80)) + random.randint(-3, 3)
                days_ago = max(1, min(90, days_ago))  # Clamp between 1-90
            else:
                days_ago = random.randint(30, 60)
            
            # Create timezone-aware datetime
            new_date = timezone.now() - timedelta(days=days_ago)
            
            # Update order dates
            order.createdAt = new_date
            order.paidAt = new_date
            order.deliveredAt = new_date + timedelta(days=random.randint(2, 5))
            order.save(update_fields=['createdAt', 'paidAt', 'deliveredAt'])
            
            updated_count += 1
            
            if updated_count % 10 == 0:
                print(f"  ✓ Updated {updated_count}/{orders.count()} orders...")
    
    print(f"\n✅ Updated {updated_count} orders with realistic dates!")
    
    # Show distribution
    print("\n📊 Order Distribution:")
    from collections import Counter
    now = timezone.now()
    
    date_ranges = {
        "0-7 days ago": 0,
        "8-14 days ago": 0,
        "15-30 days ago": 0,
        "31-60 days ago": 0,
        "61-90 days ago": 0,
    }
    
    for order in Order.objects.filter(isPaid=True):
        days_ago = (now - order.createdAt).days
        if days_ago <= 7:
            date_ranges["0-7 days ago"] += 1
        elif days_ago <= 14:
            date_ranges["8-14 days ago"] += 1
        elif days_ago <= 30:
            date_ranges["15-30 days ago"] += 1
        elif days_ago <= 60:
            date_ranges["31-60 days ago"] += 1
        else:
            date_ranges["61-90 days ago"] += 1
    
    for range_name, count in date_ranges.items():
        print(f"  • {range_name}: {count} orders")

if __name__ == '__main__':
    print("⚠️  This will update dates for all existing orders.")
    response = input("Continue? (yes/no): ")
    
    if response.lower() in ['yes', 'y']:
        fix_order_dates()
    else:
        print("Cancelled.")
