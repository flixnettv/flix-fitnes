from rest_framework import generics, permissions, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import authenticate, get_user_model
from .models import CoachProfile
from .serializers import (
    RegisterSerializer, UserSerializer, UserListSerializer,
    CoachProfileSerializer, CoachCreateSerializer, CoachPublicSerializer,
)

User = get_user_model()


class IsOwner(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'owner'


class IsCoach(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'coach'


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class UserListView(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserListSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'owner':
            return User.objects.all()
        elif user.role == 'coach':
            return User.objects.filter(assigned_coach=user)
        return User.objects.filter(id=user.id)


# ===== Owner Admin Views =====

class OwnerCoachViewSet(viewsets.ModelViewSet):
    """Owner manages coaches and their branding"""
    permission_classes = [IsOwner]

    def get_serializer_class(self):
        if self.action == 'create':
            return CoachCreateSerializer
        return CoachProfileSerializer

    def get_queryset(self):
        return CoachProfile.objects.select_related('user').all()

    def perform_destroy(self, instance):
        user = instance.user
        instance.delete()
        user.delete()


class OwnerStatsView(generics.GenericAPIView):
    """Owner dashboard statistics"""
    permission_classes = [IsOwner]

    def get(self, request):
        from workout_tracking.models import ClientPlan
        from nutrition_plan.models import ClientNutritionPlan
        from body_measurements.models import BodyMeasurement

        total_coaches = CoachProfile.objects.filter(is_active=True).count()
        total_clients = User.objects.filter(role='client').count()
        active_workout_plans = ClientPlan.objects.filter(is_active=True).count()
        active_nutrition_plans = ClientNutritionPlan.objects.filter(is_active=True).count()
        total_measurements = BodyMeasurement.objects.count()

        return Response({
            'total_coaches': total_coaches,
            'total_clients': total_clients,
            'active_workout_plans': active_workout_plans,
            'active_nutrition_plans': active_nutrition_plans,
            'total_measurements': total_measurements,
        })


class CoachClientViewSet(viewsets.ModelViewSet):
    """Coach manages their own clients"""
    serializer_class = UserSerializer
    permission_classes = [IsCoach]

    def get_queryset(self):
        return User.objects.filter(
            assigned_coach=self.request.user, role='client'
        )

    def perform_create(self, instance):
        instance.assigned_coach = self.request.user
        instance.role = 'client'
        instance.save()

    @action(detail=False, methods=['post'])
    def create_client(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save(role='client', assigned_coach=request.user)
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


# ===== Public Views (no auth needed) =====

class CoachPublicView(generics.RetrieveAPIView):
    """Public coach profile by slug - for branding the login page"""
    queryset = CoachProfile.objects.filter(is_active=True)
    serializer_class = CoachPublicSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'


class CoachClientRegisterView(generics.CreateAPIView):
    """Register a new client under a specific coach (public)"""
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        slug = self.kwargs.get('slug')
        try:
            coach_profile = CoachProfile.objects.get(slug=slug, is_active=True)
        except CoachProfile.DoesNotExist:
            return Response(
                {'detail': 'هذا المدرب غير موجود'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save(role='client', assigned_coach=coach_profile.user)
        return Response(
            {'detail': 'تم التسجيل بنجاح', 'user_id': user.id},
            status=status.HTTP_201_CREATED
        )


class CoachStatsView(generics.GenericAPIView):
    """Coach dashboard statistics"""
    permission_classes = [IsCoach]

    def get(self, request):
        from workout_tracking.models import ClientPlan
        from body_measurements.models import BodyMeasurement
        from datetime import date

        my_clients = User.objects.filter(assigned_coach=request.user, role='client')
        active_plans = ClientPlan.objects.filter(
            coach=request.user, is_active=True
        ).count()
        total_measurements = BodyMeasurement.objects.filter(
            client__assigned_coach=request.user
        ).count()

        return Response({
            'total_clients': my_clients.count(),
            'active_clients': my_clients.filter(is_active=True).count(),
            'active_plans': active_plans,
            'total_measurements': total_measurements,
        })
