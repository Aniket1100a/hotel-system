from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.accounts.permissions import IsAdminOrManager
from .models import InventoryItem, StockLog
from .serializers import InventoryItemSerializer, StockLogSerializer

class InventoryItemViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all().order_by('name')
    serializer_class = InventoryItemSerializer
    permission_classes = [IsAuthenticated, IsAdminOrManager]

    @action(detail=True, methods=['post'])
    def update_stock(self, request, pk=None):
        item = self.get_object()

        # In multipart requests, data might be in lists
        def get_single(key, default=''):
            val = request.data.get(key, default)
            return val[0] if isinstance(val, list) else val

        quantity = get_single('quantity', None)
        change_type = get_single('change_type', None)
        notes = get_single('notes', '')
        attachment = request.FILES.get('attachment')

        if quantity is None or not change_type:
            return Response({'error': 'Quantity and change_type are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from decimal import Decimal
            qty_decimal = Decimal(str(quantity))
        except (ValueError, TypeError, Decimal.InvalidOperation):
            return Response({'error': f'Invalid quantity: {quantity}'}, status=status.HTTP_400_BAD_REQUEST)

        # Update current stock
        item.current_stock += qty_decimal
        item.save(update_fields=['current_stock'])

        # Create log with attachment support
        StockLog.objects.create(
            item=item,
            quantity=qty_decimal,
            change_type=change_type,
            user=request.user,
            notes=notes,
            attachment=attachment
        )

        return Response(InventoryItemSerializer(item).data)

class StockLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = StockLog.objects.all().select_related('item', 'user').order_by('-created_at')
    serializer_class = StockLogSerializer
    permission_classes = [IsAuthenticated, IsAdminOrManager]

    def get_queryset(self):
        qs = super().get_queryset()
        item_id = self.request.query_params.get('item')
        if item_id:
            qs = qs.filter(item_id=item_id)
        return qs
