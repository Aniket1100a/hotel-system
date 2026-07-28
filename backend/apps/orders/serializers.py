from rest_framework import serializers
from django.utils import timezone
from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    menu_item_name = serializers.CharField(source='menu_item.name', read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'menu_item', 'menu_item_name', 'quantity', 'price_at_order', 'note', 'subtotal', 'status']
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
        table = validated_data.get('table')
        request = self.context['request']

        # Check if table already has an active order
        existing_order = Order.objects.filter(
            table=table,
            status__in=['PENDING', 'PREPARING', 'SERVED']
        ).first()

        if existing_order:
            # Add new items to existing order instead of creating a new one
            for item_data in items_data:
                OrderItem.objects.create(
                    order=existing_order,
                    menu_item=item_data['menu_item'],
                    quantity=item_data['quantity'],
                    note=item_data.get('note', ''),
                    price_at_order=item_data['menu_item'].price,
                )
            return existing_order

        # Standard creation if no active order exists
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

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        request = self.context['request']
        user = request.user

        # 2-minute rule for Waiters
        if user.role == 'WAITER':
            now = timezone.now()
            diff = now - instance.created_at
            if diff.total_seconds() > 120:
                # After 2 mins, waiters cannot edit existing items
                pass

        # Update order fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None:
            existing_items = {item.id: item for item in instance.items.all()}

            for item_data in items_data:
                item_id = item_data.get('id')
                if item_id and item_id in existing_items:
                    item = existing_items.pop(item_id)
                    # 2-minute rule check for modification
                    if user.role == 'WAITER' and (timezone.now() - instance.created_at).total_seconds() > 120:
                        continue

                    for attr, value in item_data.items():
                        if attr != 'id':
                            setattr(item, attr, value)
                    item.save()
                else:
                    # Create new item
                    OrderItem.objects.create(
                        order=instance,
                        menu_item=item_data['menu_item'],
                        quantity=item_data['quantity'],
                        note=item_data.get('note', ''),
                        price_at_order=item_data['menu_item'].price,
                    )

            # 2-minute rule check for deletion
            if user.role != 'WAITER' or (timezone.now() - instance.created_at).total_seconds() <= 120:
                for item in existing_items.values():
                    item.delete()

        return instance
