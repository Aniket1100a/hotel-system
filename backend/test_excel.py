import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIRequestFactory
from apps.accounts.models import User
from apps.billing.views import InvoiceViewSet

def test_export():
    try:
        factory = APIRequestFactory()
        request = factory.get('/api/billing/export_revenue_excel/')
        user = User.objects.get(username='owner1')
        request.user = user

        view = InvoiceViewSet.as_view({'get': 'export_revenue_excel'})
        response = view(request)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print(f"Content-Type: {response.headers.get('Content-Type')}")
            print(f"Content-Length: {len(response.content)}")
        else:
            print(f"Error Response: {response.content}")
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_export()
