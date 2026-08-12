from rest_framework.views import APIView
from rest_framework.response import Response
from .models import SystemSetting, RolePermission, UserFeatureOverride
from rest_framework.permissions import IsAuthenticated

class SettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        settings = SystemSetting.objects.all()
        perms = RolePermission.objects.all()

        # User-specific overrides
        user_overrides = UserFeatureOverride.objects.filter(user=request.user)
        overrides_dict = {o.feature_id: o.is_enabled for o in user_overrides}

        data = {
            "flags": {s.key: s.value for s in settings},
            "permissions": {
                p.feature_id: {
                    "ADMIN": p.can_admin,
                    "MANAGER": p.can_manager,
                    "WAITER": p.can_waiter,
                    "BILLER": p.can_biller,
                    "KITCHEN": p.can_kitchen,
                } for p in perms
            },
            "user_overrides": overrides_dict
        }
        return Response(data)
