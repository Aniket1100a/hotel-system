from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsAdmin(BasePermission):
    """Full access strictly for Admin (Owner)."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.role == 'ADMIN' or request.user.is_superuser))

class IsManagerOrAdmin(BasePermission):
    """Access for Admin or Manager."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ('ADMIN', 'MANAGER'))

class IsBillerOrHigher(BasePermission):
    """Access for Admin, Manager, or Biller."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ('ADMIN', 'MANAGER', 'BILLER'))

class IsAdminOrManager(BasePermission):
    """(Legacy) Full access for admin/manager; read-only for others."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.role in ('ADMIN', 'MANAGER') or request.user.is_superuser
