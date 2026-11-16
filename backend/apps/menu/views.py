from rest_framework import viewsets
from apps.accounts.permissions import IsAdminOrManager
from .models import Category, MenuItem
from .serializers import CategorySerializer, MenuItemSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().prefetch_related('items')
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrManager]


class MenuItemViewSet(viewsets.ModelViewSet):
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer
    permission_classes = [IsAdminOrManager]

    def get_queryset(self):
        # Always allow detail operations (retrieve, update, destroy) to see all items
        if self.action in ['retrieve', 'update', 'partial_update', 'destroy']:
            return MenuItem.objects.all()

        # For list and other actions, only show active items
        qs = MenuItem.objects.filter(is_active=True)
        category_id = self.request.query_params.get('category')
        if category_id:
            qs = qs.filter(category_id=category_id)
        return qs

    def destroy(self, request, *args, **kwargs):
        from django.db.models.deletion import ProtectedError
        from rest_framework.response import Response
        instance = self.get_object()

        # If it's already inactive, just return success
        if not instance.is_active:
            return Response(status=status.HTTP_204_NO_CONTENT)

        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            # Soft delete: archive instead of permanent removal
            instance.is_active = False
            instance.save()
            return Response(status=status.HTTP_204_NO_CONTENT)
