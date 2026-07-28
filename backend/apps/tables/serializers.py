from rest_framework import serializers
from .models import DiningTable, TableSection


class TableSectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TableSection
        fields = ['id', 'name', 'display_order']


class DiningTableSerializer(serializers.ModelSerializer):
    section_name = serializers.CharField(source='section.name', read_only=True)

    class Meta:
        model = DiningTable
        fields = ['id', 'number', 'capacity', 'status', 'section', 'section_name']
