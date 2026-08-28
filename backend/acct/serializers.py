from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import TrainerProfile, ClientProfile, GymAdminProfile

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "role", "is_active", "phone", "language", "date_joined"]
        read_only_fields = ["id", "date_joined"]

class TrainerProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = TrainerProfile
        fields = "__all__"
        read_only_fields = ["id", "gym", "user", "created_at", "updated_at"]

class ClientProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = ClientProfile
        fields = "__all__"
        read_only_fields = ["id", "gym", "user", "created_at", "updated_at"]

class MeSerializer(serializers.ModelSerializer):
    gym = serializers.SerializerMethodField()
    class Meta:
        model = User
        fields = ["id", "email", "username", "first_name", "last_name", "role", "is_active", "gym", "is_superuser"]
    def get_gym(self, obj):
        g = obj.get_gym()
        if g:
            return {"id": str(g.id), "name": g.name, "slug": g.slug}
        return None
