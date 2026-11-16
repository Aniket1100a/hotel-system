from rest_framework import viewsets, permissions
from apps.accounts.permissions import IsAdmin, IsManagerOrAdmin
from .models import Attendance, StaffPayment
from .serializers import AttendanceSerializer, StaffPaymentSerializer

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsManagerOrAdmin]

    def get_queryset(self):
        qs = super().get_queryset()
        user_id = self.request.query_params.get('user')
        date = self.request.query_params.get('date')
        if user_id:
            qs = qs.filter(user_id=user_id)
        if date:
            qs = qs.filter(date=date)
        return qs

class StaffPaymentViewSet(viewsets.ModelViewSet):
    queryset = StaffPayment.objects.all()
    serializer_class = StaffPaymentSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = super().get_queryset()
        user_id = self.request.query_params.get('user')
        if user_id:
            qs = qs.filter(user_id=user_id)
        return qs
