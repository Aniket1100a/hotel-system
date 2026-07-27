from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import DiningTable, TableSection
from .serializers import DiningTableSerializer, TableSectionSerializer


class TableSectionViewSet(viewsets.ModelViewSet):
    queryset = TableSection.objects.all()
    serializer_class = TableSectionSerializer
    permission_classes = [IsAuthenticated]


class DiningTableViewSet(viewsets.ModelViewSet):
    """All authenticated roles can view/update table status (e.g. a waiter
    marking a table OCCUPIED when they seat guests)."""
    queryset = DiningTable.objects.all().select_related('section')
    serializer_class = DiningTableSerializer
    permission_classes = [IsAuthenticated]

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

        # Mark table as FREE
        table.status = DiningTable.Status.FREE
        table.save()

        # Handle active orders
        active_orders = table.orders.filter(status__in=['PENDING', 'PREPARING', 'SERVED'])
        for order in active_orders:
            if is_paid:
                order.status = 'BILLED'
            else:
                order.status = 'CANCELLED'
            order.save()

        # TODO: Log this action for audit
        return Response({'status': f'Table {table.number} closed ({ "Paid" if is_paid else "Unpaid" })'})
