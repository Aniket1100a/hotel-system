from rest_framework import serializers
from .models import DiningTable


class DiningTableSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiningTable
        fields = ['id', 'number', 'capacity', 'status']
