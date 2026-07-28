from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth (login / refresh token)
    path('api/auth/', include('apps.accounts.urls')),

    # Feature apps
    path('api/menu/', include('apps.menu.urls')),
    path('api/tables/', include('apps.tables.urls')),
    path('api/orders/', include('apps.orders.urls')),
    path('api/billing/', include('apps.billing.urls')),
    path('api/inventory/', include('apps.inventory.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
