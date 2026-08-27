"""
Workout App Views
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from core.permissions import IsTrainer, IsGymAdminOrTrainer
from workout_tracking.models import Exercise, WorkoutPlan, WorkoutDay, WorkoutExercise, WorkoutLog
from workout_tracking.serializers import (
    ExerciseSerializer, WorkoutPlanListSerializer, WorkoutPlanDetailSerializer,
    WorkoutDaySerializer, WorkoutExerciseSerializer, WorkoutLogSerializer,
)


class TenantScopedViewSet(viewsets.ModelViewSet):
    """Base ViewSet that scopes all queries to the user's gym."""
    permission_classes = [IsAuthenticated]

    def get_gym(self):
        return self.request.user.get_gym()


class ExerciseViewSet(TenantScopedViewSet):
    serializer_class = ExerciseSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["muscle_group", "equipment", "difficulty"]
    search_fields = ["name", "name_ar"]

    def get_queryset(self):
        gym = self.get_gym()
        if gym is None:
            return Exercise.objects.none()
        return Exercise.objects.filter(gym=gym)

    def perform_create(self, serializer):
        serializer.save(gym=self.get_gym(), created_by=self.request.user, is_custom=True)


class WorkoutPlanViewSet(TenantScopedViewSet):
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["level", "goal", "is_template", "client", "trainer"]
    search_fields = ["name"]

    def get_serializer_class(self):
        if self.action == "list":
            return WorkoutPlanListSerializer
        return WorkoutPlanDetailSerializer

    def get_queryset(self):
        user = self.request.user
        gym = user.get_gym()
        if gym is None:
            return WorkoutPlan.objects.none()
        qs = WorkoutPlan.objects.filter(gym=gym).select_related("trainer__user", "client__user")
        # Clients only see plans assigned to them
        if hasattr(user, "client_profile"):
            qs = qs.filter(client=user.client_profile) | qs.filter(is_template=True)
        elif hasattr(user, "trainer_profile"):
            pass  # trainers see all gym plans
        return qs.distinct()

    def perform_create(self, serializer):
        trainer = getattr(self.request.user, "trainer_profile", None)
        client = None
        client_id = self.request.data.get("client_id")
        if client_id:
            from acct.models import ClientProfile
            client = ClientProfile.objects.filter(id=client_id, gym=self.get_gym()).first()
        is_tpl = not bool(client)
        serializer.save(
            gym=self.get_gym(), trainer=trainer, created_by=self.request.user,
            client=client, is_template=is_tpl,
        )
        self._sync_days(serializer.instance)

    def _sync_days(self, plan):
        """Replace all days/exercises from payload['days'] if provided."""
        days_data = self.request.data.get("days")
        if not isinstance(days_data, list):
            return
        plan.days.all().delete()
        for i, d in enumerate(days_data, start=1):
            wd = WorkoutDay.objects.create(
                gym=plan.gym, plan=plan,
                day_number=int(d.get("day_number", i)),
                name=d.get("name") or f"Day {i}",
                notes=d.get("notes") or "",
            )
            for order, ex in enumerate(d.get("exercises") or [], start=1):
                ex_id = ex.get("exercise")
                if not ex_id:
                    continue
                WorkoutExercise.objects.create(
                    gym=plan.gym, day=wd,
                    exercise_id=str(ex_id),
                    order=order,
                    sets=int(ex.get("sets", 3)),
                    reps=str(ex.get("reps", "10")),
                    rest_seconds=int(ex.get("rest_seconds", 90)),
                )

    def perform_update(self, serializer):
        serializer.save()
        self._sync_days(serializer.instance)

    @action(detail=True, methods=["post"], permission_classes=[IsGymAdminOrTrainer])
    def assign(self, request, pk=None):
        """Assign this plan to a client."""
        plan = self.get_object()
        client_id = request.data.get("client_id")
        if not client_id:
            return Response({"error": "client_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        from acct.models import ClientProfile
        try:
            client = ClientProfile.objects.get(id=client_id, gym=plan.gym)
        except ClientProfile.DoesNotExist:
            return Response({"error": "Client not found in this gym"}, status=status.HTTP_404_NOT_FOUND)
        plan.pk = None  # duplicate as assigned plan
        plan.is_template = False
        plan.client = client
        plan.save()
        return Response(WorkoutPlanDetailSerializer(plan).data, status=status.HTTP_201_CREATED)


class WorkoutLogViewSet(TenantScopedViewSet):
    serializer_class = WorkoutLogSerializer

    def get_queryset(self):
        user = self.request.user
        gym = user.get_gym()
        if gym is None:
            return WorkoutLog.objects.none()
        qs = WorkoutLog.objects.filter(gym=gym).select_related("day")
        if hasattr(user, "client_profile"):
            return qs.filter(client=user.client_profile)
        if hasattr(user, "trainer_profile"):
            return qs.filter(client__trainer=user.trainer_profile)
        return qs

    def perform_create(self, serializer):
        client = getattr(self.request.user, "client_profile", None)
        gym = self.get_gym()
        if client is None and gym:
            # Trainer logging on behalf of a client
            client_id = self.request.data.get("client_id")
            if client_id:
                from acct.models import ClientProfile
                client = ClientProfile.objects.filter(id=client_id, gym=gym).first()
        serializer.save(gym=gym, client=client)

    @action(detail=True, methods=["post"])
    def feedback(self, request, pk=None):
        """Trainer adds feedback to a client's workout log."""
        log = self.get_object()
        feedback = request.data.get("feedback", "")
        log.trainer_feedback = feedback
        log.save(update_fields=["trainer_feedback"])
        return Response(WorkoutLogSerializer(log).data)


class WorkoutDayViewSet(TenantScopedViewSet):
    queryset = WorkoutDay.objects.all()
    serializer_class = WorkoutDaySerializer

    def get_queryset(self):
        gym = self.get_gym()
        if gym is None:
            return WorkoutDay.objects.none()
        return WorkoutDay.objects.filter(gym=gym).prefetch_related("exercises")


class WorkoutExerciseViewSet(TenantScopedViewSet):
    queryset = WorkoutExercise.objects.all()
    serializer_class = WorkoutExerciseSerializer

    def get_queryset(self):
        gym = self.get_gym()
        if gym is None:
            return WorkoutExercise.objects.none()
        return WorkoutExercise.objects.filter(gym=gym)
