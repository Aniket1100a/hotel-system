from rest_framework import serializers
from .models import Invoice


class InvoiceSerializer(serializers.ModelSerializer):
    table_number = serializers.CharField(source='order.table.number', read_only=True)
    billed_by_name = serializers.CharField(source='billed_by.username', read_only=True)
    waiter_name = serializers.CharField(source='order.waiter.username', read_only=True)

    class Meta:
        model = Invoice
        fields = ['id', 'bill_no', 'order', 'table_number', 'billed_by', 'billed_by_name', 'waiter_name', 'subtotal',
                  'tax_percent', 'tax_amount', 'discount_amount', 'total_amount',
                  'payment_method', 'is_paid', 'created_at']
        read_only_fields = ['bill_no', 'billed_by', 'subtotal', 'tax_amount', 'total_amount']

    def create(self, validated_data):
        from decimal import Decimal
        from django.utils import timezone
        order = validated_data['order']
        subtotal = Decimal(str(order.total_amount))
        tax_percent = Decimal(str(validated_data.get('tax_percent', '0.00')))
        discount = Decimal(str(validated_data.get('discount_amount', '0')))

        tax_amount = (subtotal * tax_percent) / Decimal('100')
        total = subtotal + tax_amount - discount

        request = self.context['request']

        # Generate bill number: YYMMDD-X
        # Let's save first to get ID, then update.

        invoice = Invoice.objects.create(
            order=order,
            billed_by=request.user,
            subtotal=subtotal,
            tax_percent=tax_percent,
            tax_amount=tax_amount,
            discount_amount=discount,
            total_amount=total,
            payment_method=validated_data.get('payment_method', Invoice.PaymentMethod.CASH),
            is_paid=True,
        )

        today_str = timezone.now().strftime('%y%m%d')
        prefix = f"{today_str}-"

        # Find the highest existing bill number for today
        # We fetch all today's bill numbers to avoid string sorting issues (e.g., "9" vs "10")
        today_bill_nos = Invoice.objects.filter(bill_no__startswith=prefix).values_list('bill_no', flat=True)

        max_num = 0
        for bno in today_bill_nos:
            try:
                num = int(bno.split('-')[-1])
                if num > max_num:
                    max_num = num
            except (ValueError, IndexError):
                continue

        next_num = max_num + 1
        invoice.bill_no = f"{prefix}{next_num}"
        invoice.save(update_fields=['bill_no'])

        # Update order status
        order.status = order.Status.BILLED
        order.save(update_fields=['status'])

        # Free the table immediately (only if it's a Dine-in order)
        if order.table:
            table = order.table
            table.status = 'FREE'
            table.save(update_fields=['status'])

        return invoice
