from django.contrib import admin
from .models import Invoice


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'total_amount', 'payment_method', 'is_paid', 'created_at')
    list_filter = ('payment_method', 'is_paid')
