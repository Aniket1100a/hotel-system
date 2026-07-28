from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Invoice
from .serializers import InvoiceSerializer
from apps.tables.models import DiningTable


class InvoiceViewSet(viewsets.ModelViewSet):
    """Used by the React billing screen: generate + view invoices for
    served orders. Tax/total are computed server-side on creation."""
    queryset = Invoice.objects.all().select_related('order', 'order__table', 'billed_by')
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        invoice = self.get_object()
        invoice.is_paid = True
        invoice.save()

        # Free the table associated with the order
        table = invoice.order.table
        table.status = DiningTable.Status.FREE
        table.save()

        return Response({'status': 'Invoice marked as paid and table freed'})
