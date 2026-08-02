from rest_framework import serializers
from .models import Invoice


class InvoiceSerializer(serializers.ModelSerializer):
    table_number = serializers.CharField(source='order.table.number', read_only=True)
    billed_by_name = serializers.CharField(source='billed_by.username', read_only=True)
    waiter_name = serializers.CharField(source='order.waiter.username', read_only=True)

    class Meta:
        model = Invoice
        fields = ['id', 'order', 'table_number', 'billed_by', 'billed_by_name', 'waiter_name', 'subtotal',
                  'tax_percent', 'tax_amount', 'discount_amount', 'total_amount',
                  'payment_method', 'is_paid', 'created_at']
        read_only_fields = ['billed_by', 'subtotal', 'tax_amount', 'total_amount']

    def create(self, validated_data):
        from decimal import Decimal
        order = validated_data['order']
        subtotal = Decimal(str(order.total_amount))
        tax_percent = Decimal(str(validated_data.get('tax_percent', '0.00')))
        discount = Decimal(str(validated_data.get('discount_amount', '0')))

        tax_amount = (subtotal * tax_percent) / Decimal('100')
        total = subtotal + tax_amount - discount

        request = self.context['request']
        invoice = Invoice.objects.create(
            order=order,
            billed_by=request.user,
            subtotal=subtotal,
            tax_percent=tax_percent,
            tax_amount=tax_amount,
            discount_amount=discount,
            total_amount=total,
            payment_method=validated_data.get('payment_method', Invoice.PaymentMethod.CASH),
            is_paid=True,  # Set to PAID immediately
        )

        # Update order status
        order.status = order.Status.BILLED
        order.save(update_fields=['status'])

        # Free the table immediately (only if it's a Dine-in order)
        if order.table:
            table = order.table
            table.status = 'FREE'
            table.save(update_fields=['status'])

        return invoice
