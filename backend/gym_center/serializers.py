from rest_framework import serializers
from .models import Gym, GymInvitation

class GymSerializer(serializers.ModelSerializer):
    class Meta:
        model = Gym
        fields = ["id", "slug", "name", "description", "city", "custom_domain", "kind",
                  "primary_color", "secondary_color", "accent_color", "background_color", "surface_color",
                  "default_theme", "banner", "background_image",
                  "splash_title", "splash_tagline", "splash_style", "splash_image",
                  "font_family", "font_weight_regular", "font_weight_medium", "font_weight_bold",
                  "logo", "favicon", "contact_email", "contact_phone", "instagram_url", "twitter_url", "website_url",
                  "meta_title", "meta_description", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_slug(self, value):
        import re
        if not re.match(r"^[a-z0-9-]{3,50}$", value):
            raise serializers.ValidationError("Slug 3-50 أحرف (a-z, 0-9, -)")
        return value.lower()

class GymInvitationSerializer(serializers.ModelSerializer):
    class Meta:
        model = GymInvitation
        fields = ["id", "gym", "email", "role", "token", "is_accepted", "created_at"]
        read_only_fields = ["id", "token", "created_at"]

class GymPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Gym
        fields = ["id", "slug", "name", "description", "primary_color", "city", "kind", "splash_title", "splash_tagline", "logo"]

class TrainerAdminSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="user.get_full_name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    gym_name = serializers.CharField(source="gym.name", read_only=True)
    clients_count = serializers.IntegerField(source="clients.count", read_only=True)

    class Meta:
        from acct.models import TrainerProfile
        model = TrainerProfile
        fields = ["id", "name", "email", "gym", "gym_name", "employee_id",
                  "specialization", "certifications", "max_clients", "clients_count",
                  "hourly_rate", "hire_date", "is_active"]

    def update(self, instance, validated_data):
        for f in ("specialization", "certifications", "max_clients", "hourly_rate", "is_active"):
            if f in validated_data:
                setattr(instance, f, validated_data[f])
        instance.save()
        return instance
