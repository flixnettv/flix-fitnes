from django.contrib import admin
from .models import Food, MealPlan, Meal, MealFood, NutritionLog

admin.site.register(Food)
admin.site.register(MealPlan)
admin.site.register(Meal)
admin.site.register(MealFood)
admin.site.register(NutritionLog)
