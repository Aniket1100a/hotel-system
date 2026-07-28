import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import User
from apps.tables.models import DiningTable, TableSection
from apps.menu.models import Category, MenuItem

def seed():
    # Role-based Users
    users = [
        ('owner1', 'owner123', User.Role.ADMIN, 'Hotel', 'Owner'),
        ('manager1', 'manager123', User.Role.MANAGER, 'John', 'Manager'),
        ('waiter1', 'waiter123', User.Role.WAITER, 'Sam', 'Waiter'),
        ('kitchen1', 'kitchen123', User.Role.KITCHEN, 'Chef', 'Ram'),
        ('cashier1', 'cashier123', User.Role.BILLER, 'Alice', 'Cashier'),
    ]

    for username, password, role, first, last in users:
        if not User.objects.filter(username=username).exists():
            if role == User.Role.ADMIN:
                User.objects.create_superuser(
                    username=username, password=password, role=role,
                    first_name=first, last_name=last
                )
            else:
                User.objects.create_user(
                    username=username, password=password, role=role,
                    first_name=first, last_name=last
                )
            print(f"Created {role}: {username} / {password}")

    # Create Sections
    hall, _ = TableSection.objects.get_or_create(name='Main Hall', defaults={'display_order': 1})
    garden, _ = TableSection.objects.get_or_create(name='Garden', defaults={'display_order': 2})
    print("Created sections.")

    # Create Tables
    for i in range(1, 4):
        table_num = str(i)
        DiningTable.objects.get_or_create(number=table_num, defaults={'capacity': 4, 'section': hall})

    for i in range(4, 6):
        table_num = str(i)
        DiningTable.objects.get_or_create(number=table_num, defaults={'capacity': 4, 'section': garden})
    print("Created 5 tables across sections.")

    # Create Menu
    bev, _ = Category.objects.get_or_create(name='Beverages', defaults={'display_order': 1})
    main, _ = Category.objects.get_or_create(name='Main Course', defaults={'display_order': 2})

    MenuItem.objects.get_or_create(
        name='Coffee',
        defaults={'category': bev, 'price': 50, 'is_veg': True}
    )
    MenuItem.objects.get_or_create(
        name='Tea',
        defaults={'category': bev, 'price': 30, 'is_veg': True}
    )
    MenuItem.objects.get_or_create(
        name='Paneer Butter Masala',
        defaults={'category': main, 'price': 250, 'is_veg': True}
    )
    MenuItem.objects.get_or_create(
        name='Dal Tadka',
        defaults={'category': main, 'price': 180, 'is_veg': True}
    )
    print("Created menu items.")

if __name__ == '__main__':
    seed()
