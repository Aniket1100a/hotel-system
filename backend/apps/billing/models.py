from django.db import models
from django.conf import settings
from apps.orders.models import Order


class Invoice(models.Model):
    class PaymentMethod(models.TextChoices):
        CASH = 'CASH', 'Cash'
        CARD = 'CARD', 'Card'
        UPI = 'UPI', 'UPI'

    bill_no = models.CharField(max_length=50, unique=True, null=True, blank=True)
    customer_name = models.CharField(max_length=150, blank=True, default='')
    order = models.OneToOneField(Order, on_delete=models.PROTECT, related_name='invoice')
    billed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='invoices_issued')
    discount_approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='discounts_approved')
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    tax_percent = models.DecimalField(max_digits=5, decimal_places=2, default=5.00)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=10, choices=PaymentMethod.choices, default=PaymentMethod.CASH)
    is_paid = models.BooleanField(default=False)

    # Local Storage Container Fields
    receipt_copy = models.TextField(blank=True, null=True) # HTML/Text copy of the bill
    receipt_file = models.FileField(upload_to='receipts/%Y/%m/%d/', blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Invoice #{self.id} for Order #{self.order_id} - ₹{self.total_amount}"
