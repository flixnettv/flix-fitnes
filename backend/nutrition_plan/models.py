from django.db import models

# === ORIGINAL MODELS PRESERVED ===

class NutritionPlan(models.Model):
    name = models.CharField('اسم الخطة', max_length=200)
    coach = models.ForeignKey('acct.User', on_delete=models.CASCADE, related_name='nutrition_plans', verbose_name='المدرب')
    description = models.TextField('الوصف', blank=True)
    daily_calories = models.PositiveIntegerField('السعرات اليومية')
    protein_g = models.DecimalField('البروتين (غ)', max_digits=6, decimal_places=1)
    carbs_g = models.DecimalField('الكربوهيدرات (غ)', max_digits=6, decimal_places=1)
    fat_g = models.DecimalField('الدهون (غ)', max_digits=6, decimal_places=1)
    is_template = models.BooleanField('قالب', default=False)
    created_at = models.DateTimeField('تاريخ الإنشاء', auto_now_add=True)
    # === ADDITIVE from fitpro.nutrition.MealPlan ===
    gym = models.ForeignKey('gym_center.GymCenter', on_delete=models.CASCADE, null=True, blank=True)
    trainer_profile = models.ForeignKey('acct.ClientProfile', on_delete=models.SET_NULL, null=True, blank=True, related_name='+')
    # Actually trainer should be CoachProfile, but keep null for compat; we'll add client FK
    client_profile = models.ForeignKey('acct.ClientProfile', on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_meal_plans_via_nutrition')
    goal = models.CharField('الهدف', max_length=20, choices=[('weight_loss','Weight Loss'),('muscle_gain','Muscle Gain'),('maintenance','Maintenance'),('clean_bulk','Clean Bulk')], default='maintenance', blank=True)
    protein_target_g = models.PositiveIntegerField('هدف البروتين', default=150, blank=True, null=True)
    carbs_target_g = models.PositiveIntegerField('هدف الكربوهيدرات', default=200, blank=True, null=True)
    fat_target_g = models.PositiveIntegerField('هدف الدهون', default=60, blank=True, null=True)
    notes = models.TextField('ملاحظات', blank=True)

    class Meta:
        verbose_name = 'خطة تغذية'
        verbose_name_plural = 'خطط التغذية'
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class ClientNutritionPlan(models.Model):
    client = models.ForeignKey('acct.User', on_delete=models.CASCADE, related_name='client_nutrition_plans', verbose_name='العميل')
    plan = models.ForeignKey(NutritionPlan, on_delete=models.CASCADE, verbose_name='الخطة')
    coach = models.ForeignKey('acct.User', on_delete=models.CASCADE, related_name='assigned_nutrition_plans', verbose_name='المدرب')
    start_date = models.DateField('تاريخ البداية')
    end_date = models.DateField('تاريخ النهاية', blank=True, null=True)
    is_active = models.BooleanField('نشط', default=True)
    notes = models.TextField('ملاحظات', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    # additive
    gym = models.ForeignKey('gym_center.GymCenter', on_delete=models.CASCADE, null=True, blank=True)
    client_profile = models.ForeignKey('acct.ClientProfile', on_delete=models.CASCADE, null=True, blank=True, related_name='client_nutrition_profiles')

    class Meta:
        verbose_name = 'خطة تغذية للعميل'
        verbose_name_plural = 'خطط تغذية العملاء'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.client.get_full_name()} - {self.plan.name}'


class FoodCategory(models.Model):
    name = models.CharField('الاسم', max_length=100)

    class Meta:
        verbose_name = 'فئة طعام'
        verbose_name_plural = 'فئات الطعام'
        ordering = ['name']

    def __str__(self):
        return self.name


class FoodItem(models.Model):
    name = models.CharField('الاسم', max_length=200)
    name_ar = models.CharField('الاسم بالعربي', max_length=200, blank=True)
    category = models.ForeignKey(FoodCategory, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='الفئة')
    calories_per_100g = models.PositiveIntegerField('السعرات/100غ')
    protein_per_100g = models.DecimalField('البروتين/100غ', max_digits=5, decimal_places=1)
    carbs_per_100g = models.DecimalField('الكربوهيدرات/100غ', max_digits=5, decimal_places=1)
    fat_per_100g = models.DecimalField('الدهون/100غ', max_digits=5, decimal_places=1)
    fiber_per_100g = models.DecimalField('الألياف/100غ', max_digits=5, decimal_places=1, default=0)
    barcode = models.CharField('الباركود', max_length=50, blank=True)
    image = models.ImageField('الصورة', upload_to='foods/', blank=True, null=True)
    # additive from fitpro.nutrition.Food
    gym = models.ForeignKey('gym_center.GymCenter', on_delete=models.CASCADE, null=True, blank=True, related_name='food_items')
    protein_g = models.DecimalField('البروتين (جرام) - additive', max_digits=6, decimal_places=2, default=0, blank=True)
    carbs_g = models.DecimalField('الكربوهيدرات - additive', max_digits=6, decimal_places=2, default=0, blank=True)
    fat_g = models.DecimalField('الدهون - additive', max_digits=6, decimal_places=2, default=0, blank=True)
    fiber_g = models.DecimalField('الألياف - additive', max_digits=6, decimal_places=2, default=0, blank=True)
    is_custom = models.BooleanField('مخصص', default=False)
    category_choice = models.CharField('فئة اختيار', max_length=20, choices=[('protein','Protein'),('carbs','Carbs'),('fats','Fats'),('vegetables','Vegetables'),('fruits','Fruits'),('dairy','Dairy'),('supplements','Supplements'),('other','Other')], default='other', blank=True)

    class Meta:
        verbose_name = 'عنصر غذائي'
        verbose_name_plural = 'عناصر غذائية'
        ordering = ['name']

    def __str__(self):
        return self.name_ar or self.name


class DailyNutritionLog(models.Model):
    client = models.ForeignKey('acct.User', on_delete=models.CASCADE, related_name='nutrition_logs', verbose_name='العميل')
    date = models.DateField('التاريخ')
    meal_name = models.CharField('اسم الوجبة', max_length=100)
    food = models.ForeignKey(FoodItem, on_delete=models.CASCADE, verbose_name='الطعام')
    amount_g = models.PositiveIntegerField('الكمية (غ)')
    calories = models.PositiveIntegerField('السعرات', blank=True, null=True)
    protein = models.DecimalField('البروتين', max_digits=5, decimal_places=1, blank=True, null=True)
    carbs = models.DecimalField('الكربوهيدرات', max_digits=5, decimal_places=1, blank=True, null=True)
    fat = models.DecimalField('الدهون', max_digits=5, decimal_places=1, blank=True, null=True)
    notes = models.TextField('ملاحظات', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    # additive from fitpro.nutrition.NutritionLog
    gym = models.ForeignKey('gym_center.GymCenter', on_delete=models.CASCADE, null=True, blank=True)
    client_profile = models.ForeignKey('acct.ClientProfile', on_delete=models.CASCADE, null=True, blank=True, related_name='nutrition_logs_profile')
    plan = models.ForeignKey(NutritionPlan, on_delete=models.SET_NULL, null=True, blank=True, related_name='logs')
    quantity_g = models.DecimalField('الكمية (غ) - additive', max_digits=7, decimal_places=1, default=100, blank=True, null=True)
    protein_g = models.DecimalField('بروتين جرام', max_digits=6, decimal_places=2, default=0, blank=True, null=True)
    carbs_g = models.DecimalField('كربوهيدرات جرام', max_digits=6, decimal_places=2, default=0, blank=True, null=True)
    fat_g = models.DecimalField('دهون جرام', max_digits=6, decimal_places=2, default=0, blank=True, null=True)
    water_ml = models.PositiveIntegerField('ماء (مل)', default=0, blank=True, null=True)

    class Meta:
        verbose_name = 'سجل تغذية يومي'
        verbose_name_plural = 'سجلات التغذية اليومية'
        ordering = ['-date', 'meal_name']

    def save(self, *args, **kwargs):
        if not self.calories:
            try:
                self.calories = int(self.food.calories_per_100g * self.amount_g / 100)
            except Exception:
                pass
        if not self.protein:
            try:
                self.protein = self.food.protein_per_100g * self.amount_g / 100
            except Exception:
                pass
        if not self.carbs:
            try:
                self.carbs = self.food.carbs_per_100g * self.amount_g / 100
            except Exception:
                pass
        if not self.fat:
            try:
                self.fat = self.food.fat_per_100g * self.amount_g / 100
            except Exception:
                pass
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.client.get_full_name()} - {self.meal_name} - {self.food.name}'

# === ADDITIVE MODELS from fitpro.nutrition (Meal, MealFood) ===

class TenantMeal(models.Model):
    """Mirrored Meal model additive"""
    id = models.UUIDField(primary_key=True, default=__import__('uuid').uuid4, editable=False)
    plan = models.ForeignKey(NutritionPlan, on_delete=models.CASCADE, related_name='tenant_meals')
    name = models.CharField('اسم الوجبة', max_length=100)
    order = models.PositiveIntegerField(default=1)
    calories = models.PositiveIntegerField(default=0)
    protein_g = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    carbs_g = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    fat_g = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    instructions = models.TextField(blank=True)
    gym = models.ForeignKey('gym_center.GymCenter', on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ['order']
    def __str__(self):
        return f"{self.plan.name} - {self.name}"

class TenantMealFood(models.Model):
    id = models.UUIDField(primary_key=True, default=__import__('uuid').uuid4, editable=False)
    meal = models.ForeignKey(TenantMeal, on_delete=models.CASCADE, related_name='foods')
    food = models.ForeignKey(FoodItem, on_delete=models.CASCADE, related_name='tenant_meal_entries')
    quantity_g = models.DecimalField(max_digits=7, decimal_places=1, default=100)
    notes = models.TextField(blank=True)
    gym = models.ForeignKey('gym_center.GymCenter', on_delete=models.CASCADE, null=True, blank=True)
    def __str__(self):
        return f"{self.quantity_g}g {self.food}"
