from rest_framework.routers import DefaultRouter
from .views import DiningTableViewSet

router = DefaultRouter()
router.register('', DiningTableViewSet, basename='table')

urlpatterns = router.urls
