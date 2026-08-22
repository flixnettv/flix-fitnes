from rest_framework import serializers
from .models import NutritionPlan, ClientNutritionPlan, FoodCategory, FoodItem, DailyNutritionLog


class NutritionPlanSerializer(serializers.ModelSerializer):
    coach_name = serializers.CharField(source='coach.get_full_name', read_only=True)

    class Meta:
        model = NutritionPlan
        fields = '__all__'


class ClientNutritionPlanSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.get_full_name', read_only=True)
    plan_name = serializers.CharField(source='plan.__str__', read_only=True)

    class Meta:
        model = ClientNutritionPlan
        fields = '__all__'


class FoodCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodCategory
        fields = '__all__'


class FoodItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.__str__', read_only=True, default='')

    class Meta:
        model = FoodItem
        fields = '__all__'


class DailyNutritionLogSerializer(serializers.ModelSerializer):
    food_name = serializers.CharField(source='food.__str__', read_only=True)

    class Meta:
        model = DailyNutritionLog
        fields = '__all__'
