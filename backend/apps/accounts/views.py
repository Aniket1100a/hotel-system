from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import User
from .serializers import MyTokenObtainPairSerializer, UserSerializer
from .permissions import IsAdminOrManager


class LoginView(TokenObtainPairView):
    """POST username + password -> access token, refresh token, user info."""
    serializer_class = MyTokenObtainPairSerializer


class MeView(APIView):
    """GET/PATCH the currently logged-in user's profile."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        user = request.user
        data = request.data.copy()

        # Handle password change separately for security
        new_password = data.pop('password', None)
        current_password = data.pop('current_password', None)

        if new_password:
            if not current_password or not user.check_password(current_password):
                return Response({'detail': 'Incorrect current password.'}, status=400)
            user.set_password(new_password)
            user.save()
            if not data:
                return Response({'detail': 'Password updated successfully.'})

        # Prevent users from changing their own role or username
        data.pop('role', None)
        data.pop('username', None)

        serializer = UserSerializer(user, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('id')
    serializer_class = UserSerializer
    permission_classes = [IsAdminOrManager]
