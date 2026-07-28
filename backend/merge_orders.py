import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.orders.models import Order, OrderItem
from apps.tables.models import DiningTable

def merge():
    tables = DiningTable.objects.all()
    for table in tables:
        # Find all active orders for this table
        active_orders = Order.objects.filter(
            table=table,
            status__in=['PENDING', 'PREPARING', 'SERVED']
        ).order_by('created_at')

        if active_orders.count() > 1:
            print(f"Merging {active_orders.count()} orders for Table {table.number}...")
            main_order = active_orders[0]
            duplicates = active_orders[1:]

            for duplicate in duplicates:
                # Move items to main order
                OrderItem.objects.filter(order=duplicate).update(order=main_order)
                # Delete duplicate order
                duplicate.delete()

            print(f"Table {table.number} merged into Order #{main_order.id}")

if __name__ == '__main__':
    merge()
