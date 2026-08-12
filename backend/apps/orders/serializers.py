from rest_framework import serializers
from django.utils import timezone
from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    menu_item_name = serializers.CharField(source='menu_item.name', read_only=True)
    linked_inventory_item_name = serializers.CharField(source='menu_item.linked_inventory_item.name', read_only=True)
    inventory_deduction_quantity = serializers.DecimalField(max_digits=10, decimal_places=2, source='menu_item.inventory_deduction_quantity', read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'menu_item', 'menu_item_name', 'linked_inventory_item_name', 'inventory_deduction_quantity', 'quantity', 'price_at_order', 'note', 'subtotal', 'status']
        read_only_fields = ['price_at_order']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    table_number = serializers.SerializerMethodField()
    waiter_name = serializers.CharField(source='waiter.username', read_only=True)
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'table', 'sub_table', 'table_number', 'waiter', 'waiter_name', 'order_type', 'status',
                  'notes', 'is_handed_over', 'items', 'total_amount', 'created_at', 'updated_at']
        read_only_fields = ['waiter']

    def get_table_number(self, obj):
        if not obj.table:
            return None
        return f"{obj.table.number}{obj.sub_table}"

    def _deduct_inventory(self, menu_item, quantity, user, order):
        linked_item = menu_item.linked_inventory_item
        if not linked_item:
            return

        deduction = menu_item.inventory_deduction_quantity * quantity
        linked_item.current_stock = max(linked_item.current_stock - deduction, 0)
        linked_item.save(update_fields=['current_stock'])

        from apps.inventory.models import StockLog
        StockLog.objects.create(
            item=linked_item,
            quantity=-deduction,
            change_type='USAGE',
            user=user,
            notes=f"Auto-deducted for Order #{order.id}",
        )

    def _create_order_items(self, order, items_data, user):
        for item_data in items_data:
            menu_item = item_data['menu_item']
            quantity = item_data['quantity']
            note = item_data.get('note', '')

            existing_item = order.items.filter(menu_item=menu_item, note=note).first()
            if existing_item:
                existing_item.quantity += quantity
                existing_item.save(update_fields=['quantity'])
                order_item = existing_item
            else:
                order_item = OrderItem.objects.create(
                    order=order,
                    menu_item=menu_item,
                    quantity=quantity,
                    note=note,
                    price_at_order=menu_item.price,
                )

            self._deduct_inventory(menu_item, quantity, user, order)

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        table = validated_data.get('table')
        sub_table = validated_data.get('sub_table', '')
        request = self.context['request']

        # Check if exact table+sub_table already has an active order
        if table:
            existing_order = Order.objects.filter(
                table=table,
                sub_table=sub_table,
                status__in=['PENDING', 'PREPARING', 'SERVED']
            ).first()

            if existing_order:
                # Add new items to existing order instead of creating a new one
                self._create_order_items(existing_order, items_data, request.user)
                return existing_order

        order = Order.objects.create(waiter=request.user, **validated_data)

        if order.order_type == 'DINE_IN' and order.table:
            order.table.status = 'OCCUPIED'
            order.table.save(update_fields=['status'])

        self._create_order_items(order, items_data, request.user)
        return order

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        request = self.context['request']
        user = request.user
        is_waiter = getattr(user, 'role', 'WAITER') == 'WAITER'

        if instance.status in ['BILLED', 'CANCELLED']:
             raise serializers.ValidationError("Cannot edit a closed or cancelled order.")

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None:
            if is_waiter:
                # Waiters can only ADD items. Items in request are considered NEW additions.
                for item_data in items_data:
                    menu_item = item_data['menu_item']
                    quantity = item_data['quantity']
                    note = item_data.get('note', '')

                    if quantity <= 0: continue

                    existing_item = instance.items.filter(menu_item=menu_item, note=note).first()
                    if existing_item:
                        existing_item.quantity += quantity
                        existing_item.save(update_fields=['quantity'])
                    else:
                        OrderItem.objects.create(
                            order=instance,
                            menu_item=menu_item,
                            quantity=quantity,
                            note=note,
                            price_at_order=menu_item.price,
                        )
                    self._deduct_inventory(menu_item, quantity, user, instance)
            else:
                # Admins/Managers can still edit/delete (sync state)
                existing_items = {item.id: item for item in instance.items.all()}
                for item_data in items_data:
                    item_id = item_data.get('id')
                    if item_id and item_id in existing_items:
                        item = existing_items.pop(item_id)
                        new_qty = item_data.get('quantity', item.quantity)
                        qty_diff = new_qty - item.quantity
                        if qty_diff != 0:
                            self._deduct_inventory(item.menu_item, qty_diff, user, instance)

                        for attr, value in item_data.items():
                            if attr != 'id' and attr != 'menu_item':
                                setattr(item, attr, value)
                        item.save()
                    else:
                        menu_item = item_data['menu_item']
                        quantity = item_data['quantity']
                        note = item_data.get('note', '')
                        existing_item = instance.items.filter(menu_item=menu_item, note=note).first()
                        if existing_item:
                            if existing_item.id in existing_items:
                                existing_items.pop(existing_item.id)
                            qty_diff = quantity - existing_item.quantity
                            if qty_diff != 0:
                                self._deduct_inventory(menu_item, qty_diff, user, instance)
                            existing_item.quantity = quantity
                            existing_item.save(update_fields=['quantity'])
                        else:
                            order_item = OrderItem.objects.create(
                                order=instance,
                                menu_item=menu_item,
                                quantity=quantity,
                                note=note,
                                price_at_order=menu_item.price,
                            )
                            self._deduct_inventory(order_item.menu_item, order_item.quantity, user, instance)

                for item in existing_items.values():
                    self._deduct_inventory(item.menu_item, -item.quantity, user, instance)
                    item.delete()

        return instance
