from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User
from apps.core.models import UserFeatureOverride

class UserFeatureOverrideInline(admin.TabularInline):
    model = UserFeatureOverride
    extra = 0

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    inlines = [UserFeatureOverrideInline]
    fieldsets = UserAdmin.fieldsets + (
        ('Hotel Role', {'fields': ('role', 'phone_number')}),
    )
    list_display = ('username', 'first_name', 'last_name', 'role', 'is_staff')
    list_editable = ('role',)
    list_filter = ('role', 'is_staff', 'is_active')
