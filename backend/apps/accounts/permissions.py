from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsAdminUser(BasePermission):
    """Full access only for ADMIN users or superusers."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.role == 'ADMIN' or request.user.is_superuser))

class IsAdminOrManager(BasePermission):
    """Full access for ADMIN/MANAGER; read-only for others."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.role in ('ADMIN', 'MANAGER') or request.user.is_superuser

class IsBiller(BasePermission):
    """Access for BILLER, ADMIN, or MANAGER."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (
            request.user.role in ('BILLER', 'ADMIN', 'MANAGER') or request.user.is_superuser
        ))

class IsWaiter(BasePermission):
    """Access for WAITER, ADMIN, or MANAGER."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (
            request.user.role in ('WAITER', 'ADMIN', 'MANAGER') or request.user.is_superuser
        ))

class IsKitchen(BasePermission):
    """Access for KITCHEN, ADMIN, or MANAGER."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (
            request.user.role in ('KITCHEN', 'ADMIN', 'MANAGER') or request.user.is_superuser
        ))

class IsStaffOnly(BasePermission):
    """Restrict access to ADMIN/MANAGER for sensitive data (like staff details)."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (
            request.user.role in ('ADMIN', 'MANAGER') or request.user.is_superuser
        ))
