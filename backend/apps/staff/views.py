from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count
from .models import Attendance, StaffPayment, StaffProfile
from .serializers import AttendanceSerializer, StaffPaymentSerializer, StaffProfileSerializer

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        user_id = self.request.query_params.get('user')
        date = self.request.query_params.get('date')
        if user_id:
            qs = qs.filter(user_id=user_id)
        if date:
            qs = qs.filter(date=date)
        return qs

    @action(detail=False, methods=['get'])
    def summary(self, request):
        month = request.query_params.get('month') # YYYY-MM
        if not month:
            from django.utils import timezone
            month = timezone.now().strftime('%Y-%m')

        year, month_val = map(int, month.split('-'))

        summary_data = Attendance.objects.filter(
            date__year=year,
            date__month=month_val,
            status='PRESENT'
        ).values('user', 'user__username', 'user__first_name', 'user__last_name').annotate(
            days_present=Count('id'),
            total_hours=Sum('total_hours'),
            total_overtime=Sum('overtime_hours')
        )

        return Response(summary_data)

class StaffPaymentViewSet(viewsets.ModelViewSet):
    queryset = StaffPayment.objects.all()
    serializer_class = StaffPaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        user_id = self.request.query_params.get('user')
        if user_id:
            qs = qs.filter(user_id=user_id)
        return qs

class StaffProfileViewSet(viewsets.ModelViewSet):
    queryset = StaffProfile.objects.all()
    serializer_class = StaffProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'user_id'
