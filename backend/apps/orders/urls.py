from rest_framework.routers import DefaultRouter
from .views import OrderViewSet, OrderItemViewSet

router = DefaultRouter()
router.register('items', OrderItemViewSet, basename='orderitem')
router.register('', OrderViewSet, basename='order')

urlpatterns = router.urls
