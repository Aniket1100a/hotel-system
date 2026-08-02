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
        qs = super().get_queryset()
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)
        table_param = self.request.query_params.get('table')
        if table_param:
            qs = qs.filter(table_id=table_param)
        return qs

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
