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

    table = models.ForeignKey(DiningTable, on_delete=models.PROTECT, related_name='orders')
    waiter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='orders_taken')
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDING)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order #{self.id} - Table {self.table.number} ({self.status})"

    @property
    def total_amount(self):
        return sum(item.subtotal for item in self.items.all())


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    menu_item = models.ForeignKey(MenuItem, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(default=1)
    price_at_order = models.DecimalField(max_digits=8, decimal_places=2)
    note = models.CharField(max_length=255, blank=True)

    @property
    def subtotal(self):
        return self.quantity * self.price_at_order

    def __str__(self):
        return f"{self.quantity} x {self.menu_item.name}"
