import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.orders.models import Order
from apps.billing.models import Invoice

def debug(order_id):
    try:
        order = Order.objects.get(id=order_id)
        print(f"Order #{order.id}: Status={order.status}, Type={order.order_type}")
        inv = Invoice.objects.filter(order=order).first()
        if inv:
            print(f"Invoice #{inv.id}: Total={inv.total_amount}, Paid={inv.is_paid}")
        else:
            print("No invoice found for this order.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    debug(44)
