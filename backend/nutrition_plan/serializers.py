"""
Nutrition App Serializers
"""
from rest_framework import serializers
from nutrition_plan.models import Food, MealPlan, Meal, MealFood, NutritionLog


class FoodSerializer(serializers.ModelSerializer):
    class Meta:
        model = Food
        fields = ["id", "name", "name_ar", "calories_per_100g", "protein_g", "carbs_g",
                  "fat_g", "fiber_g", "category", "is_custom"]
        read_only_fields = ["id", "is_custom"]


class MealFoodSerializer(serializers.ModelSerializer):
    food_name = serializers.CharField(source="food.name_ar", read_only=True)

    class Meta:
        model = MealFood
        fields = ["id", "food", "food_name", "quantity_g", "notes"]


class MealSerializer(serializers.ModelSerializer):
    foods = MealFoodSerializer(many=True, read_only=True)

    class Meta:
        model = Meal
        fields = ["id", "name", "order", "calories", "protein_g", "carbs_g",
                  "fat_g", "instructions", "foods"]


class MealPlanListSerializer(serializers.ModelSerializer):
    trainer_name = serializers.CharField(source="trainer.user.get_full_name", read_only=True)
    meals_count = serializers.IntegerField(source="meals.count", read_only=True)

    class Meta:
        model = MealPlan
        fields = ["id", "name", "goal", "daily_calories", "protein_target_g",
                  "carbs_target_g", "fat_target_g", "trainer_name", "meals_count"]


class MealPlanDetailSerializer(serializers.ModelSerializer):
    meals = MealSerializer(many=True, read_only=True)
    client_name = serializers.CharField(source="client.user.get_full_name", read_only=True)

    class Meta:
        model = MealPlan
        fields = ["id", "name", "goal", "daily_calories", "protein_target_g",
                  "carbs_target_g", "fat_target_g", "notes", "is_template",
                  "client", "client_name", "meals"]


class NutritionLogSerializer(serializers.ModelSerializer):
    food_name = serializers.CharField(source="food.name_ar", read_only=True)

    class Meta:
        model = NutritionLog
        fields = ["id", "date", "food", "food_name", "quantity_g", "calories",
                  "protein_g", "carbs_g", "fat_g", "water_ml", "notes"]
