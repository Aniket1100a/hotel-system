from django.contrib import admin
from .models import SystemSetting, RolePermission, UserFeatureOverride

@admin.register(SystemSetting)
class SystemSettingAdmin(admin.ModelAdmin):
    list_display = ('key', 'value', 'description')
    list_editable = ('value',)

@admin.register(RolePermission)
class RolePermissionAdmin(admin.ModelAdmin):
    list_display = ('feature_name', 'can_admin', 'can_manager', 'can_waiter', 'can_biller', 'can_kitchen')
    list_editable = ('can_admin', 'can_manager', 'can_waiter', 'can_biller', 'can_kitchen')

@admin.register(UserFeatureOverride)
class UserFeatureOverrideAdmin(admin.ModelAdmin):
    list_display = ('user', 'feature_id', 'is_enabled')
    list_filter = ('user', 'feature_id')
    list_editable = ('is_enabled',)
