from rest_framework import serializers
from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    menu_item_name = serializers.CharField(source='menu_item.name', read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'menu_item', 'menu_item_name', 'quantity', 'price_at_order', 'note', 'subtotal']
        read_only_fields = ['price_at_order']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    table_number = serializers.CharField(source='table.number', read_only=True)
    waiter_name = serializers.CharField(source='waiter.username', read_only=True)
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'table', 'table_number', 'waiter', 'waiter_name', 'status',
                  'notes', 'items', 'total_amount', 'created_at', 'updated_at']
        read_only_fields = ['waiter']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        request = self.context['request']
        order = Order.objects.create(waiter=request.user, **validated_data)
        for item_data in items_data:
            OrderItem.objects.create(
                order=order,
                menu_item=item_data['menu_item'],
                quantity=item_data['quantity'],
                note=item_data.get('note', ''),
                price_at_order=item_data['menu_item'].price,
            )
        return order
