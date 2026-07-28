from django.db import models


class Category(models.Model):
    """e.g. Starters, Main Course, Beverages."""
    name = models.CharField(max_length=100, unique=True)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['display_order', 'name']
        verbose_name_plural = 'Categories'

    def __str__(self):
        return self.name


class MenuItem(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='items')
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    is_veg = models.BooleanField(default=True)
    is_available = models.BooleanField(default=True)
    image = models.ImageField(upload_to='menu_items/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # New inventory linking fields
    linked_inventory_item = models.ForeignKey(
        'inventory.InventoryItem',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='menu_items'
    )
    inventory_deduction_quantity = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=1.00
    )

    class Meta:
        ordering = ['category__display_order', 'name']

    def __str__(self):
        return f"{self.name} - ₹{self.price}"
