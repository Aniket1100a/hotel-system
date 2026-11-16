import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.menu.models import Category, MenuItem

def add_items():
    # 1. Create/Get Categories
    bev_cat, _ = Category.objects.get_or_create(name='Beverages')
    main_cat, _ = Category.objects.get_or_create(name='Main Course')
    bread_cat, _ = Category.objects.get_or_create(name='Breads')

    items_to_add = [
        # Beverages
        {'name': 'Water Bottle', 'category': bev_cat, 'price': 20.00},

        # Main Course
        {'name': 'Mix Veg', 'category': main_cat, 'price': 200.00},
        {'name': 'Lasuni Methi', 'category': main_cat, 'price': 200.00},
        {'name': 'Kaju Curry', 'category': main_cat, 'price': 230.00},
        {'name': 'Veg Biryani', 'category': main_cat, 'price': 200.00},

        # Breads
        {'name': 'Wheat Roti', 'category': bread_cat, 'price': 20.00},
        {'name': 'Chapati', 'category': bread_cat, 'price': 25.00},
        {'name': 'Tandoor Roti', 'category': bread_cat, 'price': 20.00},
    ]

    for item in items_to_add:
        obj, created = MenuItem.objects.get_or_create(
            name=item['name'],
            defaults={
                'category': item['category'],
                'price': item['price'],
                'is_veg': True,
                'is_available': True,
                'is_active': True
            }
        )
        if created:
            print(f"Added: {item['name']}")
        else:
            # Update existing if needed
            obj.is_veg = True
            obj.price = item['price']
            obj.category = item['category']
            obj.is_active = True
            obj.save()
            print(f"Updated: {item['name']}")

if __name__ == '__main__':
    add_items()
