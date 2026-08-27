"""
Progress App Views
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Avg, Count

from progress.models import ProgressPhoto, Goal, WeeklyCheckin
from progress.serializers import (
    ProgressPhotoSerializer, GoalSerializer, WeeklyCheckinSerializer,
)
from workout_tracking.views import TenantScopedViewSet


class ProgressPhotoViewSet(TenantScopedViewSet):
    serializer_class = ProgressPhotoSerializer

    def get_queryset(self):
        user = self.request.user
        gym = user.get_gym()
        if gym is None:
            return ProgressPhoto.objects.none()
        qs = ProgressPhoto.objects.filter(gym=gym)
        if hasattr(user, "client_profile"):
            return qs.filter(client=user.client_profile) | qs.filter(is_private=False)
        if hasattr(user, "trainer_profile"):
            return qs.filter(client__trainer=user.trainer_profile)
        return qs

    def perform_create(self, serializer):
        client = getattr(self.request.user, "client_profile", None)
        gym = self.get_gym()
        if client is None and gym:
            client_id = self.request.data.get("client_id")
            if client_id:
                from fitpro.acct.models import ClientProfile
                client = ClientProfile.objects.filter(id=client_id, gym=gym).first()
        serializer.save(gym=gym, client=client)


class GoalViewSet(TenantScopedViewSet):
    serializer_class = GoalSerializer

    def get_queryset(self):
        user = self.request.user
        gym = user.get_gym()
        if gym is None:
            return Goal.objects.none()
        qs = Goal.objects.filter(gym=gym)
        if hasattr(user, "client_profile"):
            return qs.filter(client=user.client_profile)
        if hasattr(user, "trainer_profile"):
            return qs.filter(client__trainer=user.trainer_profile)
        return qs

    def perform_create(self, serializer):
        gym = self.get_gym()
        client_id = self.request.data.get("client_id")
        from fitpro.acct.models import ClientProfile
        client = None
        if hasattr(self.request.user, "client_profile"):
            client = self.request.user.client_profile
        elif client_id and gym:
            client = ClientProfile.objects.filter(id=client_id, gym=gym).first()
        if client is None:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"client_id": "A valid client is required."})
        serializer.save(gym=gym, client=client)

    @action(detail=True, methods=["post"])
    def update_progress(self, request, pk=None):
        """Client updates their current value on a goal."""
        goal = self.get_object()
        current = request.data.get("current_value")
        if current is not None:
            goal.current_value = current
            goal.save(update_fields=["current_value"])
        return Response(GoalSerializer(goal).data)


class WeeklyCheckinViewSet(TenantScopedViewSet):
    serializer_class = WeeklyCheckinSerializer

    def get_queryset(self):
        user = self.request.user
        gym = user.get_gym()
        if gym is None:
            return WeeklyCheckin.objects.none()
        qs = WeeklyCheckin.objects.filter(gym=gym)
        if hasattr(user, "client_profile"):
            return qs.filter(client=user.client_profile)
        if hasattr(user, "trainer_profile"):
            return qs.filter(client__trainer=user.trainer_profile)
        return qs

    def perform_create(self, serializer):
        gym = self.get_gym()
        client = getattr(self.request.user, "client_profile", None)
        if client is None and gym:
            client_id = self.request.data.get("client_id")
            if client_id:
                from fitpro.acct.models import ClientProfile
                client = ClientProfile.objects.filter(id=client_id, gym=gym).first()
        serializer.save(gym=gym, client=client)

    @action(detail=True, methods=["post"])
    def feedback(self, request, pk=None):
        """Trainer reviews a check-in with feedback."""
        checkin = self.get_object()
        checkin.trainer_feedback = request.data.get("trainer_feedback", "")
        checkin.next_week_adjustments = request.data.get("next_week_adjustments", "")
        checkin.save(update_fields=["trainer_feedback", "next_week_adjustments"])
        return Response(WeeklyCheckinSerializer(checkin).data)

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """Aggregate progress stats for the requesting trainer's clients."""
        qs = self.get_queryset()
        agg = qs.aggregate(
            avg_weight=Avg("weight_kg"),
            avg_adherence=Avg("adherence"),
            total=Count("id"),
        )
        return Response(agg)
