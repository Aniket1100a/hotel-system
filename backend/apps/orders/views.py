from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Order
from .serializers import OrderSerializer


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
