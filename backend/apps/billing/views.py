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
    queryset = Invoice.objects.all().select_related('order', 'order__table', 'order__waiter', 'billed_by')
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        date_param = self.request.query_params.get('date')
        if date_param:
            qs = qs.filter(created_at__date=date_param)
        return qs

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

    @action(detail=False, methods=['get'])
    def revenue_stats(self, request):
        from django.db.models import Sum
        from django.db.models.functions import TruncDate, TruncMonth
        from django.utils import timezone
        import datetime

        # Access check
        if request.user.role not in ['ADMIN', 'MANAGER']:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        today = timezone.now()
        first_of_month = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        first_of_year = today.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)

        # Daily Revenue for current year (to build Month > Day hierarchy)
        daily_stats = Invoice.objects.filter(
            created_at__gte=first_of_year,
            is_paid=True
        ).annotate(date=TruncDate('created_at')).values('date').annotate(
            total=Sum('total_amount')
        ).order_by('-date')

        # Summary for current month
        this_month_total = Invoice.objects.filter(
            created_at__gte=first_of_month,
            is_paid=True
        ).aggregate(Sum('total_amount'))['total_amount__sum'] or 0

        # Also send monthly summary for year-level view
        monthly_stats = Invoice.objects.filter(
            created_at__gte=first_of_year,
            is_paid=True
        ).annotate(month=TruncMonth('created_at')).values('month').annotate(
            total=Sum('total_amount')
        ).order_by('-month')

        return Response({
            'daily': daily_stats,
            'monthly': monthly_stats,
            'this_month_total': this_month_total
        })

