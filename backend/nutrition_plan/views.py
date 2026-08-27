"""
Nutrition App Views
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from core.permissions import IsGymAdminOrTrainer
from nutrition_plan.models import Food, MealPlan, Meal, MealFood, NutritionLog
from nutrition_plan.serializers import (
    FoodSerializer, MealPlanListSerializer, MealPlanDetailSerializer,
    MealSerializer, MealFoodSerializer, NutritionLogSerializer,
)
from workout_tracking.views import TenantScopedViewSet


class FoodViewSet(TenantScopedViewSet):
    serializer_class = FoodSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["category"]
    search_fields = ["name", "name_ar"]

    def get_queryset(self):
        gym = self.get_gym()
        if gym is None:
            return Food.objects.none()
        return Food.objects.filter(gym=gym)

    def perform_create(self, serializer):
        serializer.save(gym=self.get_gym(), is_custom=True)


class MealPlanViewSet(TenantScopedViewSet):
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["goal", "is_template", "client"]
    search_fields = ["name"]

    def get_serializer_class(self):
        if self.action == "list":
            return MealPlanListSerializer
        return MealPlanDetailSerializer

    def get_queryset(self):
        user = self.request.user
        gym = user.get_gym()
        if gym is None:
            return MealPlan.objects.none()
        qs = MealPlan.objects.filter(gym=gym).select_related("trainer__user", "client__user")
        if hasattr(user, "client_profile"):
            qs = qs.filter(client=user.client_profile) | qs.filter(is_template=True)
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
        self._sync_meals(serializer.instance)

    def _sync_meals(self, plan):
        """Replace meals (and foods) from payload['meals'] when provided."""
        meals_data = self.request.data.get("meals")
        if not isinstance(meals_data, list):
            return
        plan.meals.all().delete()
        for i, m in enumerate(meals_data, start=1):
            meal = Meal.objects.create(
                gym=plan.gym, plan=plan,
                name=m.get("name") or f"وجبة {i}",
                order=int(m.get("order", i)),
                calories=int(m.get("calories", 0)),
                protein_g=m.get("protein_g") or 0,
                carbs_g=m.get("carbs_g") or 0,
                fat_g=m.get("fat_g") or 0,
                instructions=m.get("instructions") or "",
            )
            for f in m.get("foods") or []:
                fid = f.get("food")
                if not fid:
                    continue
                try:
                    qty = float(f.get("quantity_g", 100))
                except (TypeError, ValueError):
                    qty = 100
                MealFood.objects.create(gym=plan.gym, meal=meal, food_id=str(fid), quantity_g=qty)

    def perform_update(self, serializer):
        serializer.save()
        self._sync_meals(serializer.instance)

    @action(detail=True, methods=["post"], permission_classes=[IsGymAdminOrTrainer])
    def assign(self, request, pk=None):
        """Assign this meal plan to a client."""
        plan = self.get_object()
        client_id = request.data.get("client_id")
        if not client_id:
            return Response({"error": "client_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        from acct.models import ClientProfile
        try:
            client = ClientProfile.objects.get(id=client_id, gym=plan.gym)
        except ClientProfile.DoesNotExist:
            return Response({"error": "Client not found in this gym"}, status=status.HTTP_404_NOT_FOUND)
        plan.pk = None
        plan.is_template = False
        plan.client = client
        plan.save()
        return Response(MealPlanDetailSerializer(plan).data, status=status.HTTP_201_CREATED)


class MealViewSet(TenantScopedViewSet):
    queryset = Meal.objects.all()
    serializer_class = MealSerializer

    def get_queryset(self):
        gym = self.get_gym()
        if gym is None:
            return Meal.objects.none()
        return Meal.objects.filter(gym=gym).prefetch_related("foods")


class NutritionLogViewSet(TenantScopedViewSet):
    serializer_class = NutritionLogSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["date"]

    def get_queryset(self):
        user = self.request.user
        gym = user.get_gym()
        if gym is None:
            return NutritionLog.objects.none()
        qs = NutritionLog.objects.filter(gym=gym).select_related("food")
        if hasattr(user, "client_profile"):
            return qs.filter(client=user.client_profile)
        if hasattr(user, "trainer_profile"):
            return qs.filter(client__trainer=user.trainer_profile)
        return qs

    def perform_create(self, serializer):
        client = getattr(self.request.user, "client_profile", None)
        gym = self.get_gym()
        if client is None and gym:
            client_id = self.request.data.get("client_id")
            if client_id:
                from acct.models import ClientProfile
                client = ClientProfile.objects.filter(id=client_id, gym=gym).first()
        serializer.save(gym=gym, client=client)
