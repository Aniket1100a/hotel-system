from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AttendanceViewSet, StaffPaymentViewSet, StaffProfileViewSet

router = DefaultRouter()
router.register(r'attendance', AttendanceViewSet)
router.register(r'payments', StaffPaymentViewSet)
router.register(r'profiles', StaffProfileViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
