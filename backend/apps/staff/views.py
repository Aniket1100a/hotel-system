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

    @action(detail=False, methods=['post'])
    def bulk_mark_present(self, request):
        from django.utils import timezone
        today = timezone.now().date()
        from apps.accounts.models import User
        active_staff = User.objects.filter(is_active=True)
        created_count = 0
        for user in active_staff:
            _, created = Attendance.objects.get_or_create(
                user=user,
                date=today,
                defaults={
                    'status': 'PRESENT',
                    'check_in': '10:00:00',
                    'check_out': '22:00:00'
                }
            )
            if created:
                created_count += 1
        return Response({'status': f'Marked {created_count} staff as present'})

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

    @action(detail=False, methods=['get'])
    def payroll_preview(self, request):
        from django.utils import timezone
        from django.db.models import Sum, Q
        month_param = request.query_params.get('month') # YYYY-MM
        if month_param:
            year, month = map(int, month_param.split('-'))
        else:
            now = timezone.now()
            year, month = now.year, now.month

        results = []
        profiles = StaffProfile.objects.select_related('user').all()

        for profile in profiles:
            user = profile.user
            # Attendance stats
            att_stats = Attendance.objects.filter(
                user=user,
                date__year=year,
                date__month=month,
                status='PRESENT'
            ).aggregate(
                days=Count('id'),
                total_hours=Sum('total_hours'),
                overtime=Sum('overtime_hours')
            )

            # Advances/Payments in that month
            payments_stats = StaffPayment.objects.filter(
                user=user,
                payment_date__year=year,
                payment_date__month=month
            ).aggregate(
                advances=Sum('amount', filter=Q(payment_type='ADVANCE')),
                others=Sum('amount', filter=~Q(payment_type='ADVANCE'))
            )

            days = att_stats['days'] or 0
            total_overtime = att_stats['overtime'] or 0
            advances = payments_stats['advances'] or 0

            # Calculation: (Basic Salary / 30 * days) + (Overtime * Rate) - Advances
            # Note: This is a simplified practical logic for a hotel.
            daily_rate = profile.basic_salary / 30
            earned_salary = daily_rate * days
            overtime_pay = total_overtime * profile.overtime_rate_per_hour
            net_payable = earned_salary + overtime_pay - advances

            results.append({
                'user_id': user.id,
                'username': user.username,
                'full_name': f"{user.first_name} {user.last_name}",
                'basic_salary': profile.basic_salary,
                'days_present': days,
                'total_overtime': total_overtime,
                'overtime_pay': overtime_pay,
                'advances_taken': advances,
                'net_payable': round(net_payable, 2)
            })

        return Response(results)
