from django.db import models

# === ORIGINAL MODELS PRESERVED ===

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
    # === ADDITIVE from fitpro.measurements.Measurement ===
    height_cm = models.PositiveIntegerField('الطول (سم) - additive', blank=True, null=True)
    measurement_date = models.DateField('تاريخ القياس - additive', blank=True, null=True)
    gym = models.ForeignKey('gym_center.GymCenter', on_delete=models.CASCADE, null=True, blank=True, verbose_name='الصالة')
    client_profile = models.ForeignKey('acct.ClientProfile', on_delete=models.SET_NULL, null=True, blank=True, related_name='body_measurements_profile')
    tenant_id = models.UUIDField(null=True, blank=True, editable=False, db_index=True)

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
    # additive from fitpro.progress.ProgressPhoto
    gym = models.ForeignKey('gym_center.GymCenter', on_delete=models.CASCADE, null=True, blank=True)
    client_profile = models.ForeignKey('acct.ClientProfile', on_delete=models.CASCADE, null=True, blank=True, related_name='progress_photos_body')
    photo_field = models.ImageField('صورة تقدم - additive', upload_to='progress/%Y/%m/', blank=True, null=True)
    body_fat_percent = models.DecimalField('نسبة الدهون - additive', max_digits=4, decimal_places=1, null=True, blank=True)
    is_private = models.BooleanField('خاص', default=False)

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
    # additive from fitpro.devices.Device
    gym = models.ForeignKey('gym_center.GymCenter', on_delete=models.CASCADE, null=True, blank=True)
    client_profile = models.ForeignKey('acct.ClientProfile', on_delete=models.CASCADE, null=True, blank=True, related_name='devices_body')
    kind = models.CharField('النوع - additive', max_length=10, default='scale', blank=True)
    status = models.CharField('الحالة', max_length=10, default='active', blank=True)
    pairing_code = models.CharField('كود الاقتران', max_length=6, blank=True, null=True)
    code_expires_at = models.DateTimeField(null=True, blank=True)
    ingest_token = models.CharField('رمز الإدخال', max_length=64, blank=True, null=True)

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
    # additive from fitpro.devices.DeviceReading
    gym_id = models.UUIDField(null=True, blank=True, editable=False, db_index=True)
    client_id = models.UUIDField(null=True, blank=True, editable=False, db_index=True)
    metric = models.CharField('المقياس - additive', max_length=20, blank=True, null=True)
    recorded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'قياس جهاز'
        verbose_name_plural = 'قياسات الأجهزة'
        ordering = ['-measured_at']

    def __str__(self):
        return f'{self.user.get_full_name()} - {self.measurement_type}: {self.value} {self.unit}'

# === ADDITIVE: TenantMeasurement from fitpro.measurements ===
class TenantMeasurement(models.Model):
    id = models.UUIDField(primary_key=True, default=__import__('uuid').uuid4, editable=False)
    gym = models.ForeignKey('gym_center.GymCenter', on_delete=models.CASCADE, null=True, blank=True)
    client = models.ForeignKey('acct.User', on_delete=models.CASCADE, related_name='tenant_measurements')
    client_profile = models.ForeignKey('acct.ClientProfile', on_delete=models.CASCADE, null=True, blank=True, related_name='tenant_measurements_profile')
    weight_kg = models.DecimalField(max_digits=5, decimal_places=2)
    height_cm = models.PositiveIntegerField()
    body_fat_percent = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    muscle_mass_kg = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    measurement_date = models.DateField()
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    tenant_id = models.UUIDField(null=True, blank=True, editable=False, db_index=True)
    class Meta:
        ordering = ['-measurement_date']
    def __str__(self):
        return f"{self.client} - {self.weight_kg}kg"

# === ADDITIVE: Goal & WeeklyCheckin mirrors for body side (optional) ===
class GoalMirror(models.Model):
    id = models.UUIDField(primary_key=True, default=__import__('uuid').uuid4, editable=False)
    gym = models.ForeignKey('gym_center.GymCenter', on_delete=models.CASCADE, null=True, blank=True)
    client = models.ForeignKey('acct.User', on_delete=models.CASCADE, null=True, blank=True)
    client_profile = models.ForeignKey('acct.ClientProfile', on_delete=models.CASCADE, null=True, blank=True, related_name='goal_mirrors')
    title = models.CharField(max_length=200)
    target_value = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    current_value = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return self.title

class WeeklyCheckinMirror(models.Model):
    id = models.UUIDField(primary_key=True, default=__import__('uuid').uuid4, editable=False)
    gym = models.ForeignKey('gym_center.GymCenter', on_delete=models.CASCADE, null=True, blank=True)
    client_profile = models.ForeignKey('acct.ClientProfile', on_delete=models.CASCADE, null=True, blank=True)
    week_start = models.DateField(null=True, blank=True)
    weight_kg = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
