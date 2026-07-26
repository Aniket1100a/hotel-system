from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminOrManager(BasePermission):
    """Full access for admin/manager; read-only for everyone else who is
    authenticated (waiters, billers, kitchen)."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.role in ('ADMIN', 'MANAGER') or request.user.is_superuser
