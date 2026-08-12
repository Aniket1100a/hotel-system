from rest_framework import serializers
from .models import Attendance, StaffPayment, StaffProfile
from apps.accounts.models import User

class StaffProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StaffProfile
        fields = ['address', 'joining_date', 'basic_salary', 'is_active']

class AttendanceSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source='user.username', read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Attendance
        fields = '__all__'

    def get_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"

class StaffPaymentSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source='user.username', read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = StaffPayment
        fields = '__all__'

    def get_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"
