from rest_framework import serializers
from django.utils import timezone
from .models import Order, OrderItem, KOT


class OrderItemSerializer(serializers.ModelSerializer):
    menu_item_name = serializers.CharField(source='menu_item.name', read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'menu_item', 'menu_item_name', 'quantity', 'price_at_order', 'note', 'subtotal', 'status', 'kot']
        read_only_fields = ['price_at_order', 'kot']


class KOTSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    table_number = serializers.CharField(source='order.table.number', read_only=True)

    class Meta:
        model = KOT
        fields = ['id', 'order', 'number', 'table_number', 'items', 'created_at']


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

        if items_data:
            kot = KOT.objects.create(order=order, number=1)
            for item_data in items_data:
                OrderItem.objects.create(
                    order=order,
                    kot=kot,
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
                # If more than 2 minutes, we only allow ADDING new items, not modifying/deleting existing ones
                # This logic is a bit complex in a nested serializer update.
                # For Phase 1, we will implement it by checking if existing items were modified.
                pass

        # Update order fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None:
            # Separate existing items from new items
            existing_items = {item.id: item for item in instance.items.all()}
            new_items_data = []

            for item_data in items_data:
                item_id = item_data.get('id')
                if item_id and item_id in existing_items:
                    item = existing_items.pop(item_id)
                    # 2-minute rule check for modification
                    if user.role == 'WAITER' and (timezone.now() - instance.created_at).total_seconds() > 120:
                        # Skip modification if after 2 mins
                        continue

                    for attr, value in item_data.items():
                        if attr != 'id':
                            setattr(item, attr, value)
                    item.save()
                else:
                    new_items_data.append(item_data)

            # 2-minute rule check for deletion
            if user.role != 'WAITER' or (timezone.now() - instance.created_at).total_seconds() <= 120:
                for item in existing_items.values():
                    item.delete()

            # Create new KOT for new items
            if new_items_data:
                last_kot = instance.kots.last()
                next_number = (last_kot.number + 1) if last_kot else 1
                kot = KOT.objects.create(order=instance, number=next_number)
                for item_data in new_items_data:
                    OrderItem.objects.create(
                        order=instance,
                        kot=kot,
                        menu_item=item_data['menu_item'],
                        quantity=item_data['quantity'],
                        note=item_data.get('note', ''),
                        price_at_order=item_data['menu_item'].price,
                    )

        return instance
