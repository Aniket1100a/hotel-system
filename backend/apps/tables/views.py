from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import DiningTable
from .serializers import DiningTableSerializer


class DiningTableViewSet(viewsets.ModelViewSet):
    """All authenticated roles can view/update table status (e.g. a waiter
    marking a table OCCUPIED when they seat guests)."""
    queryset = DiningTable.objects.all()
    serializer_class = DiningTableSerializer
    permission_classes = [IsAuthenticated]
