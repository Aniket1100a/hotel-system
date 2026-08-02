from rest_framework import serializers
from .models import InventoryItem, StockLog

class InventoryItemSerializer(serializers.ModelSerializer):
    is_low_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = InventoryItem
        fields = '__all__'

class StockLogSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = StockLog
        fields = '__all__'
        read_only_fields = ['user']
