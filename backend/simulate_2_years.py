import os
import django
import random
from datetime import timedelta
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.utils import timezone
from apps.accounts.models import User
from apps.tables.models import DiningTable
from apps.menu.models import MenuItem
from apps.orders.models import Order, OrderItem
from apps.billing.models import Invoice

def simulate_2_years_data(num_orders=15000):
    print(f"Simulating 2 years of operational data ({num_orders} historical orders)...")

    user = User.objects.filter(role__in=['ADMIN', 'MANAGER', 'WAITER']).first()
    tables = list(DiningTable.objects.all())
    menu_items = list(MenuItem.objects.filter(is_active=True))

    if not user or not tables or not menu_items:
        print("Error: Missing base setup data. Run seed_data.py first.")
        return

    now = timezone.now()
    start_date = now - timedelta(days=730)

    orders_to_create = []
    order_items_to_create = []
    invoices_to_create = []

    print("Generating bulk historical order records...")

    # Pre-generate orders
    for i in range(num_orders):
        # Calculate random timestamp in the last 730 days
        random_days = random.uniform(0, 730)
        order_time = start_date + timedelta(days=random_days)

        table = random.choice(tables)

        # 95% of past orders are BILLED, 5% CANCELLED
        status = Order.Status.BILLED if random.random() < 0.95 else Order.Status.CANCELLED

        order = Order(
            table=table,
            waiter=user,
            order_type=Order.OrderType.DINE_IN,
            status=status,
            notes=f"Historical order #{i+1}",
            is_handed_over=True,
            created_at=order_time,
            updated_at=order_time
        )
        orders_to_create.append(order)

    # Bulk create orders
    created_orders = Order.objects.bulk_create(orders_to_create, batch_size=2000)
    print(f"Bulk created {len(created_orders)} historical orders.")

    print("Generating bulk order items & invoices...")
    for order in created_orders:
        num_items = random.randint(1, 4)
        subtotal = Decimal('0.00')

        for _ in range(num_items):
            item = random.choice(menu_items)
            qty = random.randint(1, 3)
            price = item.price
            subtotal += price * qty

            order_items_to_create.append(
                OrderItem(
                    order=order,
                    menu_item=item,
                    quantity=qty,
                    price_at_order=price,
                    status=OrderItem.Status.SERVED,
                    note="Historical item"
                )
            )

        if order.status == Order.Status.BILLED:
            tax = (subtotal * Decimal('0.05')).quantize(Decimal('0.01'))
            discount = Decimal('0.00')
            total = subtotal + tax - discount

            invoices_to_create.append(
                Invoice(
                    order=order,
                    billed_by=user,
                    subtotal=subtotal,
                    tax_percent=Decimal('5.00'),
                    tax_amount=tax,
                    discount_amount=discount,
                    total_amount=total,
                    payment_method=Invoice.PaymentMethod.CASH,
                    is_paid=True,
                    created_at=order.created_at
                )
            )

    # Bulk create order items & invoices
    OrderItem.objects.bulk_create(order_items_to_create, batch_size=5000)
    Invoice.objects.bulk_create(invoices_to_create, batch_size=5000)

    print(f"Bulk created {len(order_items_to_create)} order items and {len(invoices_to_create)} invoices.")
    print("Running SQLite ANALYZE to update index statistics...")

    from django.db import connection
    with connection.cursor() as cursor:
        cursor.execute("ANALYZE;")

    print("2-year simulation complete!")

if __name__ == '__main__':
    simulate_2_years_data()
