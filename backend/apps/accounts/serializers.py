from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User
from apps.staff.models import StaffProfile


class StaffProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StaffProfile
        fields = ['address', 'joining_date', 'basic_salary', 'is_active']


class UserSerializer(serializers.ModelSerializer):
    profile = StaffProfileSerializer(required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'role', 'phone_number', 'password', 'profile']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        profile_data = validated_data.pop('profile', {})
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()

        # Create or update profile
        StaffProfile.objects.create(user=user, **profile_data)

        return user

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', None)
        password = validated_data.pop('password', None)

        if password:
            instance.set_password(password)

        user = super().update(instance, validated_data)

        if profile_data:
            profile, created = StaffProfile.objects.get_or_create(user=user)
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()

        return user


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Login serializer — returns JWT tokens + the user's role/profile so
    the client apps can route to the right dashboard immediately."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['role'] = user.role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data
