"""
Nutrition App URLs
"""
from rest_framework.routers import DefaultRouter
from nutrition_plan.views import FoodViewSet, MealPlanViewSet, MealViewSet, NutritionLogViewSet

router = DefaultRouter()
router.register(r"foods", FoodViewSet, basename="food")
router.register(r"meal-plans", MealPlanViewSet, basename="meal-plan")
router.register(r"meals", MealViewSet, basename="meal")
router.register(r"logs", NutritionLogViewSet, basename="nutrition-log")

urlpatterns = router.urls
