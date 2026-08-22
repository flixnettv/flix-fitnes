from django.contrib import admin
from .models import NutritionPlan, ClientNutritionPlan, FoodCategory, FoodItem, DailyNutritionLog

admin.site.register(NutritionPlan)
admin.site.register(ClientNutritionPlan)
admin.site.register(FoodCategory)
admin.site.register(FoodItem)
admin.site.register(DailyNutritionLog)
