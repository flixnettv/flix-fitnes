from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Avg, Count
from .models import ProgressPhoto, Goal, WeeklyCheckin
from .serializers import ProgressPhotoSerializer, GoalSerializer, WeeklyCheckinSerializer

def get_gym_for_user(user):
    try:
        return user.get_gym()
    except Exception:
        if hasattr(user, "gym_admin_profile"):
            return user.gym_admin_profile.gym
        if hasattr(user, "coach_profile"):
            return user.owned_gyms.first() if hasattr(user, "owned_gyms") else None
        return None

class ProgressPhotoViewSet(viewsets.ModelViewSet):
    serializer_class = ProgressPhotoSerializer
    def get_queryset(self):
        user = self.request.user
        gym = get_gym_for_user(user)
        if gym is None and not user.is_superuser:
            return ProgressPhoto.objects.none()
        qs = ProgressPhoto.objects.filter(gym=gym) if gym else ProgressPhoto.objects.all()
        if hasattr(user, "client_profile"):
            return qs.filter(client=user.client_profile)
        if hasattr(user, "coach_profile") or getattr(user, "role", "") == "coach":
            try:
                from acct.models import ClientProfile
                # filter clients assigned to this coach if possible
                clients = ClientProfile.objects.filter(trainer__user=user).values_list("id", flat=True) if hasattr(ClientProfile, "trainer") else []
                if clients:
                    return qs.filter(client_id__in=clients)
            except Exception:
                pass
        return qs
    def perform_create(self, serializer):
        gym = get_gym_for_user(self.request.user)
        client = getattr(self.request.user, "client_profile", None)
        if client is None and gym:
            client_id = self.request.data.get("client_id")
            if client_id:
                from acct.models import ClientProfile
                client = ClientProfile.objects.filter(id=client_id, gym=gym).first()
        serializer.save(gym=gym, client=client)

class GoalViewSet(viewsets.ModelViewSet):
    serializer_class = GoalSerializer
    def get_queryset(self):
        user = self.request.user
        gym = get_gym_for_user(user)
        if gym is None and not user.is_superuser:
            return Goal.objects.none()
        qs = Goal.objects.filter(gym=gym) if gym else Goal.objects.all()
        if hasattr(user, "client_profile"):
            return qs.filter(client=user.client_profile)
        return qs
    def perform_create(self, serializer):
        gym = get_gym_for_user(self.request.user)
        client_id = self.request.data.get("client_id")
        from acct.models import ClientProfile
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
        goal = self.get_object()
        current = request.data.get("current_value")
        if current is not None:
            goal.current_value = current
            goal.save(update_fields=["current_value"])
        return Response(GoalSerializer(goal).data)

class WeeklyCheckinViewSet(viewsets.ModelViewSet):
    serializer_class = WeeklyCheckinSerializer
    def get_queryset(self):
        user = self.request.user
        gym = get_gym_for_user(user)
        if gym is None and not user.is_superuser:
            return WeeklyCheckin.objects.none()
        qs = WeeklyCheckin.objects.filter(gym=gym) if gym else WeeklyCheckin.objects.all()
        if hasattr(user, "client_profile"):
            return qs.filter(client=user.client_profile)
        return qs
    def perform_create(self, serializer):
        gym = get_gym_for_user(self.request.user)
        client = getattr(self.request.user, "client_profile", None)
        if client is None and gym:
            client_id = self.request.data.get("client_id")
            if client_id:
                from acct.models import ClientProfile
                client = ClientProfile.objects.filter(id=client_id, gym=gym).first()
        serializer.save(gym=gym, client=client)
    @action(detail=True, methods=["post"])
    def feedback(self, request, pk=None):
        checkin = self.get_object()
        checkin.trainer_feedback = request.data.get("trainer_feedback", "")
        checkin.next_week_adjustments = request.data.get("next_week_adjustments", "")
        checkin.save(update_fields=["trainer_feedback", "next_week_adjustments"])
        return Response(WeeklyCheckinSerializer(checkin).data)
    @action(detail=False, methods=["get"])
    def stats(self, request):
        qs = self.get_queryset()
        agg = qs.aggregate(avg_weight=Avg("weight_kg"), avg_adherence=Avg("adherence"), total=Count("id"))
        return Response(agg)
