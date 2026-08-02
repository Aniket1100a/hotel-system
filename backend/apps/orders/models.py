from django.db import models
from django.conf import settings
from apps.tables.models import DiningTable
from apps.menu.models import MenuItem


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        PREPARING = 'PREPARING', 'Preparing'
        SERVED = 'SERVED', 'Served'
        BILLED = 'BILLED', 'Billed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    class OrderType(models.TextChoices):
        DINE_IN = 'DINE_IN', 'Dine In'
        TAKEAWAY = 'TAKEAWAY', 'Takeaway'

    table = models.ForeignKey(DiningTable, on_delete=models.PROTECT, related_name='orders', null=True, blank=True)
    waiter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='orders_taken')
    order_type = models.CharField(max_length=10, choices=OrderType.choices, default=OrderType.DINE_IN)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDING)
    notes = models.TextField(blank=True)
    is_handed_over = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order #{self.id} - Table {self.table.number} ({self.status})"

    @property
    def total_amount(self):
        return sum(item.subtotal for item in self.items.all())


class OrderItem(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        PREPARING = 'PREPARING', 'Preparing'
        READY = 'READY', 'Ready'
        SERVED = 'SERVED', 'Served'

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    menu_item = models.ForeignKey(MenuItem, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(default=1)
    price_at_order = models.DecimalField(max_digits=8, decimal_places=2)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDING)
    note = models.CharField(max_length=255, blank=True)

    @property
    def subtotal(self):
        return self.quantity * self.price_at_order

    def __str__(self):
        return f"{self.quantity} x {self.menu_item.name} ({self.status})"
