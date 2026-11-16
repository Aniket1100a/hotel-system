import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import User
from apps.tables.models import DiningTable, TableSection
from apps.menu.models import MenuItem
from apps.orders.models import Order, OrderItem

def seed_100():
    print("Seeding 100 tables and active orders...")

    # Get a waiter/manager user for order creation
    user = User.objects.filter(role__in=['ADMIN', 'MANAGER', 'WAITER']).first()
    if not user:
        print("Error: No user found. Run seed_data.py first.")
        return

    # Create sections
    sections = [
        TableSection.objects.get_or_create(name='Main Hall', defaults={'display_order': 1})[0],
        TableSection.objects.get_or_create(name='Garden', defaults={'display_order': 2})[0],
        TableSection.objects.get_or_create(name='Rooftop', defaults={'display_order': 3})[0],
        TableSection.objects.get_or_create(name='Banquet', defaults={'display_order': 4})[0],
    ]

    menu_items = list(MenuItem.objects.filter(is_active=True))
    if not menu_items:
        print("Error: No active menu items found. Run seed_data.py first.")
        return

    # Create 100 tables
    tables_created = 0
    orders_created = 0

    for i in range(1, 101):
        table_num = f"T-{i}"
        section = sections[i % len(sections)]
        table, created = DiningTable.objects.get_or_create(
            number=table_num,
            defaults={'capacity': 4, 'section': section, 'status': 'OCCUPIED'}
        )
        if created:
            tables_created += 1

        # Create active order for table if none exists
        if not Order.objects.filter(table=table, status__in=['PENDING', 'PREPARING', 'SERVED']).exists():
            order = Order.objects.create(
                table=table,
                waiter=user,
                order_type='DINE_IN',
                status='PENDING',
                notes=f'Scale test order for table {table_num}'
            )
            # Add 2 items per order
            item1 = menu_items[i % len(menu_items)]
            item2 = menu_items[(i + 1) % len(menu_items)]

            OrderItem.objects.create(
                order=order,
                menu_item=item1,
                quantity=1,
                price_at_order=item1.price,
                note='Scale test item 1'
            )
            OrderItem.objects.create(
                order=order,
                menu_item=item2,
                quantity=2,
                price_at_order=item2.price,
                note='Scale test item 2'
            )
            orders_created += 1

    print(f"Successfully created {tables_created} new tables (Total 100 tables ensured).")
    print(f"Successfully created {orders_created} active orders across tables.")

if __name__ == '__main__':
    seed_100()
