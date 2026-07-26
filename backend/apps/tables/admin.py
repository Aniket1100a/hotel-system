from django.contrib import admin
from .models import DiningTable


@admin.register(DiningTable)
class DiningTableAdmin(admin.ModelAdmin):
    list_display = ('number', 'capacity', 'status')
    list_filter = ('status',)
