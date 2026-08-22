from rest_framework import viewsets
from .models import NutritionPlan, ClientNutritionPlan, FoodCategory, FoodItem, DailyNutritionLog
from .serializers import (
    NutritionPlanSerializer, ClientNutritionPlanSerializer,
    FoodCategorySerializer, FoodItemSerializer, DailyNutritionLogSerializer,
)


class NutritionPlanViewSet(viewsets.ModelViewSet):
    serializer_class = NutritionPlanSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'owner':
            return NutritionPlan.objects.all()
        return NutritionPlan.objects.filter(coach=user)

    def perform_create(self, serializer):
        serializer.save(coach=self.request.user)


class ClientNutritionPlanViewSet(viewsets.ModelViewSet):
    serializer_class = ClientNutritionPlanSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role in ('owner', 'coach'):
            return ClientNutritionPlan.objects.all()
        return ClientNutritionPlan.objects.filter(client=user)


class FoodCategoryViewSet(viewsets.ModelViewSet):
    queryset = FoodCategory.objects.all()
    serializer_class = FoodCategorySerializer


class FoodItemViewSet(viewsets.ModelViewSet):
    queryset = FoodItem.objects.select_related('category')
    serializer_class = FoodItemSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(name__icontains=search) | qs.filter(name_ar__icontains=search)
        return qs


class DailyNutritionLogViewSet(viewsets.ModelViewSet):
    serializer_class = DailyNutritionLogSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role in ('owner', 'coach'):
            qs = DailyNutritionLog.objects.all()
        else:
            qs = DailyNutritionLog.objects.filter(client=user)
        date = self.request.query_params.get('date')
        if date:
            qs = qs.filter(date=date)
        return qs

    def perform_create(self, serializer):
        serializer.save(client=self.request.user)
