from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Order, OrderItem
from .serializers import OrderSerializer, OrderItemSerializer


class OrderViewSet(viewsets.ModelViewSet):
    """
    Used by the Flutter waiter app to place orders, and by the React admin
    panel to view/manage them. Any authenticated staff member can read;
    creation stamps the logged-in user as the waiter automatically.
    """
    queryset = Order.objects.all().prefetch_related('items', 'items__menu_item')
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset().order_by('-created_at')
        status_param = self.request.query_params.get('status')
        if status_param:
            statuses = [value.strip().upper() for value in status_param.split(',') if value.strip()]
            if statuses:
                qs = qs.filter(status__in=statuses)
        table_param = self.request.query_params.get('table')
        if table_param:
            qs = qs.filter(table_id=table_param)
        return qs

    @action(detail=True, methods=['post'])
    def cancel_order(self, request, pk=None):
        order = self.get_object()
        if order.status == 'BILLED':
            return Response({'error': 'Cannot cancel a billed order.'}, status=status.HTTP_400_BAD_REQUEST)

        order.status = 'CANCELLED'
        order.save()

        if order.table:
            table = order.table
            # Check if any other active splits exist
            has_active = Order.objects.filter(table=table, status__in=['PENDING', 'PREPARING', 'SERVED']).exclude(id=order.id).exists()
            if not has_active:
                table.status = 'FREE'
                table.save()

        return Response({'status': 'order cancelled'})

    @action(detail=True, methods=['post'])
    def mark_handed_over(self, request, pk=None):
        order = self.get_object()
        order.is_handed_over = True
        order.save()
        return Response({'status': 'order marked as handed over'})


class OrderItemViewSet(viewsets.ModelViewSet):
    queryset = OrderItem.objects.all()
    serializer_class = OrderItemSerializer
    permission_classes = [IsAuthenticated]

    def perform_destroy(self, instance):
        # Reverse inventory deduction before deleting
        order = instance.order
        order_serializer = OrderSerializer()
        order_serializer._deduct_inventory(
            instance.menu_item,
            -instance.quantity,
            self.request.user,
            order
        )
        instance.delete()

        # If no items left in order, cancel it and free table if necessary
        if not order.items.exists():
            order.status = Order.Status.CANCELLED
            order.save()
            if order.table:
                has_active = Order.objects.filter(
                    table=order.table,
                    status__in=[Order.Status.PENDING, Order.Status.PREPARING, Order.Status.SERVED]
                ).exclude(id=order.id).exists()
                if not has_active:
                    order.table.status = 'FREE'
                    order.table.save()

    def perform_update(self, serializer):
        instance = self.get_object()
        old_quantity = instance.quantity
        new_quantity = serializer.validated_data.get('quantity', old_quantity)

        if old_quantity != new_quantity:
            qty_diff = new_quantity - old_quantity
            order_serializer = OrderSerializer()
            order_serializer._deduct_inventory(
                instance.menu_item,
                qty_diff,
                self.request.user,
                instance.order
            )

        serializer.save()

    @action(detail=True, methods=['post'])
    def mark_ready(self, request, pk=None):
        item = self.get_object()
        item.status = OrderItem.Status.READY
        item.save()

        # Check if all items in the order are READY or SERVED
        order = item.order
        if not order.items.exclude(status__in=[OrderItem.Status.READY, OrderItem.Status.SERVED]).exists():
            order.status = Order.Status.SERVED
            order.save()

        return Response({'status': 'item marked ready'})
