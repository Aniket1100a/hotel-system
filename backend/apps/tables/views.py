from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.accounts.permissions import IsAdminOrManager
from .models import DiningTable, TableSection
from .serializers import DiningTableSerializer, TableSectionSerializer
from apps.orders.models import Order


class TableSectionViewSet(viewsets.ModelViewSet):
    queryset = TableSection.objects.all()
    serializer_class = TableSectionSerializer
    permission_classes = [IsAuthenticated, IsAdminOrManager]


class DiningTableViewSet(viewsets.ModelViewSet):
    """All authenticated roles can view/update table status (e.g. a waiter
    marking a table OCCUPIED when they seat guests)."""
    queryset = DiningTable.objects.all().select_related('section')
    serializer_class = DiningTableSerializer
    permission_classes = [IsAuthenticated, IsAdminOrManager]

    @action(detail=True, methods=['post'])
    def close_table(self, request, pk=None):
        table = self.get_object()
        user = request.user

        # Check permissions
        if user.role not in ['ADMIN', 'MANAGER', 'BILLER']:
            return Response(
                {'error': 'Only Managers, Cashiers or Admins can close tables.'},
                status=status.HTTP_403_FORBIDDEN
            )

        is_paid = request.data.get('is_paid', True)
        active_orders = table.orders.filter(status__in=['PENDING', 'PREPARING', 'SERVED'])

        # Only mark table as FREE if NO other active orders exist for any splits
        has_other_splits = Order.objects.filter(
            table=table,
            status__in=['PENDING', 'PREPARING', 'SERVED']
        ).exclude(id__in=[o.id for o in active_orders]).exists()

        if not has_other_splits:
            table.status = DiningTable.Status.FREE
            table.save()

        # Handle active orders
        for order in active_orders:
            if is_paid:
                order.status = 'BILLED'
            else:
                order.status = 'CANCELLED'
            order.save()

        status_msg = "Table fully closed" if not has_other_splits else "Current split closed"
        return Response({'status': f'{status_msg} ({ "Paid" if is_paid else "Unpaid" })'})
