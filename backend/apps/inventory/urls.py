from rest_framework.routers import DefaultRouter
from .views import InventoryItemViewSet, StockLogViewSet

router = DefaultRouter()
router.register('items', InventoryItemViewSet, basename='inventory-item')
router.register('logs', StockLogViewSet, basename='stock-log')

urlpatterns = router.urls
