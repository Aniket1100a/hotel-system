from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, MenuItemViewSet

router = DefaultRouter()
router.register('categories', CategoryViewSet)
router.register('items', MenuItemViewSet)

urlpatterns = router.urls
