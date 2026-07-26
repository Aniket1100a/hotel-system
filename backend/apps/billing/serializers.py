from rest_framework import serializers
from .models import Invoice


class InvoiceSerializer(serializers.ModelSerializer):
    table_number = serializers.CharField(source='order.table.number', read_only=True)
    billed_by_name = serializers.CharField(source='billed_by.username', read_only=True)

    class Meta:
        model = Invoice
        fields = ['id', 'order', 'table_number', 'billed_by', 'billed_by_name', 'subtotal',
                  'tax_percent', 'tax_amount', 'discount_amount', 'total_amount',
                  'payment_method', 'is_paid', 'created_at']
        read_only_fields = ['billed_by', 'subtotal', 'tax_amount', 'total_amount']

    def create(self, validated_data):
        order = validated_data['order']
        subtotal = order.total_amount
        tax_percent = validated_data.get('tax_percent', 5.00)
        discount = validated_data.get('discount_amount', 0)
        tax_amount = (subtotal * tax_percent) / 100
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
        )
        order.status = order.Status.BILLED
        order.save(update_fields=['status'])
        return invoice
