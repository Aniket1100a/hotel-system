from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .serializers import MyTokenObtainPairSerializer, UserSerializer


class LoginView(TokenObtainPairView):
    """POST username + password -> access token, refresh token, user info."""
    serializer_class = MyTokenObtainPairSerializer


class MeView(APIView):
    """GET the currently logged-in user's profile (used by both apps to
    confirm the token is valid and to know which role's UI to show)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)
