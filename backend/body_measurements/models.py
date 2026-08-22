from django.db import models


class BodyMeasurement(models.Model):
    SOURCE_CHOICES = [
        ('manual', 'يدوي'),
        ('withings', 'Withings'),
        ('xiaomi', 'Xiaomi'),
        ('apple_health', 'Apple Health'),
        ('google_fit', 'Google Fit'),
        ('garmin', 'Garmin'),
        ('import', 'استيراد'),
    ]
    client = models.ForeignKey('acct.User', on_delete=models.CASCADE, related_name='body_measurements', verbose_name='العميل')
    date = models.DateField('التاريخ')
    weight_kg = models.DecimalField('الوزن (كجم)', max_digits=5, decimal_places=2)
    body_fat_percent = models.DecimalField('نسبة الدهون (%)', max_digits=4, decimal_places=1, blank=True, null=True)
    muscle_mass_kg = models.DecimalField('الكتلة العضلية (كجم)', max_digits=5, decimal_places=2, blank=True, null=True)
    water_percent = models.DecimalField('نسبة الماء (%)', max_digits=4, decimal_places=1, blank=True, null=True)
    bone_mass_kg = models.DecimalField('الكتلة العظمية (كجم)', max_digits=4, decimal_places=2, blank=True, null=True)
    notes = models.TextField('ملاحظات', blank=True)
    source = models.CharField('المصدر', max_length=20, choices=SOURCE_CHOICES, default='manual')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'قياس جسم'
        verbose_name_plural = 'قياسات الجسم'
        ordering = ['-date']

    def __str__(self):
        return f'{self.client.get_full_name()} - {self.weight_kg}kg - {self.date}'


class ProgressPhoto(models.Model):
    PHOTO_CHOICES = [
        ('front', 'أمامي'), ('back', 'خلفي'), ('side', 'جانبي'), ('other', 'أخرى'),
    ]
    client = models.ForeignKey('acct.User', on_delete=models.CASCADE, related_name='progress_photos', verbose_name='العميل')
    date = models.DateField('التاريخ')
    image = models.ImageField('الصورة', upload_to='progress/')
    photo_type = models.CharField('نوع الصورة', max_length=10, choices=PHOTO_CHOICES, default='front')
    weight_at_time = models.DecimalField('الوزن وقتها (كجم)', max_digits=5, decimal_places=2, blank=True, null=True)
    notes = models.TextField('ملاحظات', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'صورة تقدم'
        verbose_name_plural = 'صور التقدم'
        ordering = ['-date']

    def __str__(self):
        return f'{self.client.get_full_name()} - {self.date}'


class Device(models.Model):
    TYPE_CHOICES = [
        ('scale', 'ميزان'), ('watch', 'ساعة'), ('band', 'سوار'), ('strap', 'حزام'),
    ]
    user = models.ForeignKey('acct.User', on_delete=models.CASCADE, related_name='devices', verbose_name='المستخدم')
    name = models.CharField('الاسم', max_length=100)
    device_type = models.CharField('النوع', max_length=10, choices=TYPE_CHOICES)
    brand = models.CharField('العلامة التجارية', max_length=50)
    model_name = models.CharField('الموديل', max_length=100, blank=True)
    is_active = models.BooleanField('نشط', default=True)
    oauth_data = models.JSONField('بيانات OAuth', blank=True, null=True)
    last_sync = models.DateTimeField('آخر مزامنة', blank=True, null=True)
    created_at = models.DateTimeField('تاريخ الإنشاء', auto_now_add=True)

    class Meta:
        verbose_name = 'جهاز'
        verbose_name_plural = 'أجهزة'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.brand} {self.name}'


class DeviceMeasurement(models.Model):
    TYPE_CHOICES = [
        ('weight', 'الوزن'), ('body_fat', 'نسبة الدهون'), ('muscle_mass', 'الكتلة العضلية'),
        ('heart_rate', 'النبض'), ('steps', 'الخطوات'), ('sleep', 'النوم'), ('calories', 'السعرات'),
    ]
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name='measurements', verbose_name='الجهاز')
    user = models.ForeignKey('acct.User', on_delete=models.CASCADE, related_name='device_measurements', verbose_name='المستخدم')
    measurement_type = models.CharField('نوع القياس', max_length=20, choices=TYPE_CHOICES)
    value = models.DecimalField('القيمة', max_digits=10, decimal_places=3)
    unit = models.CharField('الوحدة', max_length=10)
    measured_at = models.DateTimeField('وقت القياس')
    raw_data = models.JSONField('البيانات الأولية', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'قياس جهاز'
        verbose_name_plural = 'قياسات الأجهزة'
        ordering = ['-measured_at']

    def __str__(self):
        return f'{self.user.get_full_name()} - {self.measurement_type}: {self.value} {self.unit}'
