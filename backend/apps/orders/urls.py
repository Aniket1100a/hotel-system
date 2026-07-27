from rest_framework.routers import DefaultRouter
from .views import OrderViewSet, KOTViewSet, OrderItemViewSet

router = DefaultRouter()
router.register('kots', KOTViewSet, basename='kot')
router.register('items', OrderItemViewSet, basename='orderitem')
router.register('', OrderViewSet, basename='order')

urlpatterns = router.urls
