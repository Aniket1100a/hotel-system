from rest_framework import serializers
from .models import Invoice
from apps.orders.models import Order


class InvoiceSerializer(serializers.ModelSerializer):
    table_number = serializers.CharField(source='order.table.number', read_only=True)
    billed_by_name = serializers.CharField(source='billed_by.username', read_only=True)
    waiter_name = serializers.CharField(source='order.waiter.username', read_only=True)

    class Meta:
        model = Invoice
        fields = ['id', 'bill_no', 'customer_name', 'order', 'table_number', 'billed_by', 'billed_by_name', 'waiter_name', 'subtotal',
                  'tax_percent', 'tax_amount', 'discount_amount', 'total_amount',
                  'payment_method', 'is_paid', 'created_at']
        read_only_fields = ['bill_no', 'billed_by', 'subtotal', 'tax_amount', 'total_amount']

    def create(self, validated_data):
        from decimal import Decimal
        from django.utils import timezone

        now = timezone.now()
        date_str = now.strftime("%y%m%d")

        # Robust bill number generation:
        # Find the max sequence number for today and increment it
        last_bill = Invoice.objects.filter(bill_no__startswith=date_str).order_by('id').last()
        if last_bill and last_bill.bill_no:
            try:
                last_seq = int(last_bill.bill_no.split()[-1])
                next_seq = last_seq + 1
            except (ValueError, IndexError):
                next_seq = Invoice.objects.filter(created_at__date=now.date()).count() + 1
        else:
            next_seq = 1

        bill_no = f"{date_str} {next_seq}"

        # Double check uniqueness loop
        while Invoice.objects.filter(bill_no=bill_no).exists():
            next_seq += 1
            bill_no = f"{date_str} {next_seq}"

        order = validated_data['order']
        subtotal = Decimal(str(order.total_amount))
        tax_percent = Decimal(str(validated_data.get('tax_percent', '0.00')))
        discount = Decimal(str(validated_data.get('discount_amount', '0')))

        tax_amount = (subtotal * tax_percent) / Decimal('100')
        total = subtotal + tax_amount - discount

        request = self.context['request']
        invoice = Invoice.objects.create(
            bill_no=bill_no,
            customer_name=validated_data.get('customer_name', ''),
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

        # Free the table only if no other active splits exist
        if order.table:
            table = order.table
            has_active_splits = Order.objects.filter(
                table=table,
                status__in=['PENDING', 'PREPARING', 'SERVED']
            ).exclude(id=order.id).exists()

            if not has_active_splits:
                table.status = 'FREE'
                table.save(update_fields=['status'])

        return invoice
