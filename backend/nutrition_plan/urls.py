from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    NutritionPlanViewSet, ClientNutritionPlanViewSet,
    FoodCategoryViewSet, FoodItemViewSet, DailyNutritionLogViewSet,
)

router = DefaultRouter()
router.register('plans', NutritionPlanViewSet, basename='nutrition_plans')
router.register('client-plans', ClientNutritionPlanViewSet, basename='client_nutrition_plans')
router.register('categories', FoodCategoryViewSet, basename='food_categories')
router.register('foods', FoodItemViewSet, basename='foods')
router.register('daily-logs', DailyNutritionLogViewSet, basename='daily_nutrition_logs')

urlpatterns = [
    path('', include(router.urls)),
]
