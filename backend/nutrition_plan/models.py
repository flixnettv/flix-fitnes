from django.db import models


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

    class Meta:
        verbose_name = 'سجل تغذية يومي'
        verbose_name_plural = 'سجلات التغذية اليومية'
        ordering = ['-date', 'meal_name']

    def save(self, *args, **kwargs):
        if not self.calories:
            self.calories = int(self.food.calories_per_100g * self.amount_g / 100)
        if not self.protein:
            self.protein = self.food.protein_per_100g * self.amount_g / 100
        if not self.carbs:
            self.carbs = self.food.carbs_per_100g * self.amount_g / 100
        if not self.fat:
            self.fat = self.food.fat_per_100g * self.amount_g / 100
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.client.get_full_name()} - {self.meal_name} - {self.food.name}'
