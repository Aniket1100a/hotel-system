from rest_framework import serializers
from .models import Category, MenuItem


class MenuItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItem
        fields = ['id', 'category', 'name', 'description', 'price', 'is_veg', 'is_available', 'image', 'linked_inventory_item', 'inventory_deduction_quantity']


class CategorySerializer(serializers.ModelSerializer):
    items = MenuItemSerializer(many=True, read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'display_order', 'items']
