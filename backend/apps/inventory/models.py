from django.db import models
from django.conf import settings

class InventoryItem(models.Model):
    UNIT_CHOICES = [
        ('KG', 'Kilogram (kg)'),
        ('G', 'Gram (g)'),
        ('L', 'Litre (L)'),
        ('ML', 'Millilitre (ml)'),
        ('PC', 'Piece (pc)'),
        ('PKT', 'Packet'),
    ]

    name = models.CharField(max_length=150, unique=True)
    unit = models.CharField(max_length=5, choices=UNIT_CHOICES, default='KG')
    current_stock = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    min_stock_level = models.DecimalField(max_digits=10, decimal_places=2, default=5)
    price_per_unit = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.current_stock} {self.unit})"

    @property
    def is_low_stock(self):
        return self.current_stock <= self.min_stock_level

class StockLog(models.Model):
    TYPE_CHOICES = [
        ('PURCHASE', 'Stock Purchase'),
        ('USAGE', 'Stock Usage'),
        ('WASTE', 'Wastage'),
        ('ADJUSTMENT', 'Manual Adjustment'),
    ]

    item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE, related_name='logs')
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    change_type = models.CharField(max_length=15, choices=TYPE_CHOICES)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.change_type}: {self.quantity} for {self.item.name}"
