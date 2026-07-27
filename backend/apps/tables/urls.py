from rest_framework.routers import DefaultRouter
from .views import DiningTableViewSet, TableSectionViewSet

router = DefaultRouter()
router.register('sections', TableSectionViewSet, basename='tablesection')
router.register('', DiningTableViewSet, basename='table')

urlpatterns = router.urls
