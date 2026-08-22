from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import CoachProfile

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'phone', 'role']

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'phone',
            'role', 'avatar', 'birthdate', 'gender', 'height_cm', 'bio',
            'specializations', 'experience_years', 'assigned_coach', 'medical_notes', 'goals',
            'is_active', 'date_joined',
        ]
        read_only_fields = ['date_joined']


class UserListSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'role', 'phone', 'avatar', 'assigned_coach', 'is_active']


class CoachProfileSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    clients_count = serializers.SerializerMethodField()

    class Meta:
        model = CoachProfile
        fields = [
            'id', 'user', 'user_name', 'user_username', 'slug', 'display_name', 'logo',
            'tagline', 'description',
            'primary_color', 'secondary_color', 'background_color', 'text_color', 'font_family',
            'contact_phone', 'contact_email',
            'social_instagram', 'social_twitter', 'social_tiktok', 'social_youtube',
            'is_active', 'created_at', 'updated_at', 'clients_count',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_clients_count(self, obj):
        return obj.user.clients.filter(role='client').count()


class CoachCreateSerializer(serializers.ModelSerializer):
    username = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=6)
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    phone = serializers.CharField(write_only=True, required=False, default='')
    slug = serializers.SlugField(write_only=True)
    display_name = serializers.CharField()

    class Meta:
        model = CoachProfile
        fields = [
            'username', 'email', 'password', 'first_name', 'last_name', 'phone',
            'slug', 'display_name', 'tagline', 'description',
            'primary_color', 'secondary_color', 'background_color', 'text_color', 'font_family',
            'contact_phone', 'contact_email',
            'social_instagram', 'social_twitter', 'social_tiktok', 'social_youtube',
        ]

    def validate_slug(self, value):
        if CoachProfile.objects.filter(slug=value).exists():
            raise serializers.ValidationError('هذا الرابط مستخدم بالفعل')
        return value

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('اسم المستخدم مستخدم بالفعل')
        return value

    def create(self, validated_data):
        user_data = {
            'username': validated_data.pop('username'),
            'email': validated_data.pop('email'),
            'password': validated_data.pop('password'),
            'first_name': validated_data.pop('first_name'),
            'last_name': validated_data.pop('last_name'),
            'phone': validated_data.pop('phone', ''),
        }
        user = User.objects.create_user(role='coach', **user_data)
        profile = CoachProfile.objects.create(user=user, **validated_data)
        return profile


class CoachPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoachProfile
        fields = [
            'slug', 'display_name', 'logo', 'tagline', 'description',
            'primary_color', 'secondary_color', 'background_color', 'text_color', 'font_family',
            'contact_phone', 'contact_email',
            'social_instagram', 'social_twitter', 'social_tiktok', 'social_youtube',
        ]


class OwnerLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()
