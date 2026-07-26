from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Invoice
from .serializers import InvoiceSerializer


class InvoiceViewSet(viewsets.ModelViewSet):
    """Used by the React billing screen: generate + view invoices for
    served orders. Tax/total are computed server-side on creation."""
    queryset = Invoice.objects.all().select_related('order', 'order__table', 'billed_by')
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]
