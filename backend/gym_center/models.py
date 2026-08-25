from django.db import models
import uuid

class GymCenter(models.Model):
    # Original fields preserved
    name = models.CharField('اسم المركز', max_length=200)
    phone = models.CharField('الهاتف', max_length=20, blank=True)
    email = models.EmailField('البريد الإلكتروني', blank=True)
    address = models.TextField('العنوان', blank=True)
    logo = models.ImageField('الشعار', upload_to='gym_logos/', blank=True, null=True)
    owner = models.ForeignKey('acct.User', on_delete=models.CASCADE, related_name='owned_gyms', verbose_name='المالك')
    created_at = models.DateTimeField('تاريخ الإنشاء', auto_now_add=True)

    # === ADDITIVE: identity & branding from fitpro.gym.Gym ===
    slug = models.SlugField('المعرف الفريد', max_length=100, blank=True, null=True, unique=False, help_text='URL-friendly identifier')
    subdomain = models.CharField('الدومين الفرعي', max_length=100, blank=True, help_text='Auto-generated from slug')
    custom_domain = models.CharField('الدومين المخصص', max_length=255, blank=True, help_text='Custom domain')
    primary_color = models.CharField('اللون الأساسي', max_length=7, default='#1E3A8A', blank=True)
    secondary_color = models.CharField('اللون الثانوي', max_length=7, default='#3B82F6', blank=True)
    accent_color = models.CharField('لون التمييز', max_length=7, default='#10B981', blank=True)
    background_color = models.CharField('لون الخلفية', max_length=7, default='#F8FAFC', blank=True)
    surface_color = models.CharField('لون السطح', max_length=7, default='#FFFFFF', blank=True)
    font_family = models.CharField('الخط', max_length=100, default='Cairo', blank=True)
    font_weight_regular = models.PositiveIntegerField('وزن الخط العادي', default=400, blank=True, null=True)
    font_weight_medium = models.PositiveIntegerField('وزن الخط المتوسط', default=500, blank=True, null=True)
    font_weight_bold = models.PositiveIntegerField('وزن الخط العريض', default=700, blank=True, null=True)
    # favicon etc optional
    favicon = models.ImageField('الأيقونة', upload_to='gyms/favicons/', blank=True, null=True)

    # Limits & settings additive
    max_trainers = models.PositiveIntegerField('الحد الأقصى للمدربين', default=10, blank=True, null=True)
    max_members_per_trainer = models.PositiveIntegerField('الحد الأقصى للأعضاء لكل مدرب', default=200, blank=True, null=True)
    timezone = models.CharField('المنطقة الزمنية', max_length=50, default='Asia/Riyadh', blank=True)
    language = models.CharField('اللغة', max_length=10, default='ar', blank=True)
    currency = models.CharField('العملة', max_length=3, default='SAR', blank=True)

    # Features
    enable_nutrition = models.BooleanField('تفعيل التغذية', default=True)
    enable_measurements = models.BooleanField('تفعيل القياسات', default=True)
    enable_booking = models.BooleanField('تفعيل الحجز', default=True)
    enable_chat = models.BooleanField('تفعيل الدردشة', default=False)
    enable_video_calls = models.BooleanField('تفعيل الفيديو', default=False)
    enable_wearables = models.BooleanField('تفعيل الأجهزة القابلة للارتداء', default=False)

    # Notifications
    email_notifications = models.BooleanField('إشعارات البريد', default=True)
    sms_notifications = models.BooleanField('إشعارات الرسائل', default=False)
    push_notifications = models.BooleanField('إشعارات الدفع', default=True)

    # === ADDITIVE: tasks الأخيرة (kind, theme, banner, splash) ===
    KINDS = [("gym", "Gym"), ("personal", "Personal Trainer App")]
    kind = models.CharField("Account Kind", max_length=10, choices=KINDS, default="gym", blank=True)
    THEMES = [("dark", "Dark"), ("light", "Light")]
    default_theme = models.CharField("Default Theme", max_length=5, choices=THEMES, default="dark", blank=True)
    banner = models.ImageField("Banner", upload_to="gyms/banners/", blank=True, null=True)
    background_image = models.ImageField("Background Image", upload_to="gyms/backgrounds/", blank=True, null=True)
    SPLASH_STYLES = [("gradient", "Brand Gradient"), ("solid", "Solid Brand"), ("minimal", "Minimal Dark")]
    splash_title = models.CharField("Splash Title", max_length=120, blank=True)
    splash_tagline = models.CharField("Splash Tagline", max_length=200, blank=True)
    splash_style = models.CharField("Splash Style", max_length=12, choices=SPLASH_STYLES, default="gradient", blank=True)
    splash_image = models.ImageField("Splash Background", upload_to="gyms/splash/", blank=True, null=True)

    # SEO & Marketing
    meta_title = models.CharField('Meta Title', max_length=60, blank=True)
    meta_description = models.TextField('Meta Description', max_length=160, blank=True)
    og_image = models.ImageField('Open Graph Image', upload_to='gyms/og/', blank=True, null=True)

    # Contact extended
    contact_email = models.EmailField('بريد التواصل', blank=True)
    contact_phone = models.CharField('هاتف التواصل', max_length=20, blank=True)
    city = models.CharField('المدينة', max_length=100, blank=True)
    country = models.CharField('الدولة', max_length=100, default='Saudi Arabia', blank=True)

    # Social
    instagram_url = models.URLField('Instagram URL', blank=True)
    twitter_url = models.URLField('Twitter URL', blank=True)
    snapchat_url = models.URLField('Snapchat URL', blank=True)
    youtube_url = models.URLField('YouTube URL', blank=True)
    website_url = models.URLField('Website URL', blank=True)

    # Legal
    terms_of_service = models.TextField('شروط الخدمة', blank=True)
    privacy_policy = models.TextField('سياسة الخصوصية', blank=True)
    refund_policy = models.TextField('سياسة الاسترجاع', blank=True)

    # Activation & tenant compatibility
    is_active = models.BooleanField('نشط', default=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)
    tenant_id = models.UUIDField(blank=True, null=True, editable=False, db_index=True)

    class Meta:
        verbose_name = 'مركز رياضي'
        verbose_name_plural = 'مراكز رياضية'
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Auto slug logic additive (if slug empty)
        if not self.slug and self.name:
            from django.utils.text import slugify
            base = slugify(self.name, allow_unicode=True) or "gym"
            slug = base
            counter = 1
            # avoid infinite loop if no DB yet; just ensure slug unique when possible
            try:
                while GymCenter.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                    slug = f"{base}-{counter}"
                    counter += 1
            except Exception:
                pass
            self.slug = slug
        if not self.subdomain and self.slug:
            self.subdomain = self.slug
        if self.custom_domain:
            self.custom_domain = self.custom_domain.lower().strip()
            if self.custom_domain.startswith('http://') or self.custom_domain.startswith('https://'):
                from urllib.parse import urlparse
                parsed = urlparse(self.custom_domain)
                self.custom_domain = parsed.netloc
            self.custom_domain = self.custom_domain.replace('www.', '')
        super().save(*args, **kwargs)

    def get_full_domain(self):
        if self.custom_domain:
            return self.custom_domain
        try:
            from django.conf import settings
            domain = getattr(settings, 'PLATFORM_DOMAIN', 'fitpro.hftv.qzz.io')
        except Exception:
            domain = 'fitpro.hftv.qzz.io'
        return f"{self.subdomain}.{domain}" if self.subdomain else self.name

    @property
    def active_trainers_count(self):
        try:
            return self.members.filter(is_active=True).count()
        except Exception:
            return 0


class Membership(models.Model):
    TYPE_CHOICES = [
        ('monthly', 'شهري'),
        ('quarterly', '3 أشهر'),
        ('yearly', 'سنوي'),
        ('lifetime', ' مدى الحياة'),
    ]
    client = models.ForeignKey('acct.User', on_delete=models.CASCADE, related_name='memberships', verbose_name='العميل')
    gym = models.ForeignKey(GymCenter, on_delete=models.CASCADE, verbose_name='المركز')
    coach = models.ForeignKey('acct.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='coached_memberships', verbose_name='المدرب')
    start_date = models.DateField('تاريخ البداية')
    end_date = models.DateField('تاريخ النهاية', blank=True, null=True)
    is_active = models.BooleanField('نشط', default=True)
    membership_type = models.CharField('نوع العضوية', max_length=15, choices=TYPE_CHOICES, default='monthly')
    activated_by = models.ForeignKey('acct.User', on_delete=models.SET_NULL, null=True, related_name='activated_memberships', verbose_name='فعّلها')
    notes = models.TextField('ملاحظات', blank=True)
    created_at = models.DateTimeField('تاريخ الإنشاء', auto_now_add=True)

    class Meta:
        verbose_name = 'عضوية'
        verbose_name_plural = 'عضويات'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.client.get_full_name()} - {self.gym.name} ({self.get_membership_type_display()})'


class Attendance(models.Model):
    client = models.ForeignKey('acct.User', on_delete=models.CASCADE, related_name='attendances', verbose_name='العميل')
    gym = models.ForeignKey(GymCenter, on_delete=models.CASCADE, verbose_name='المركز')
    check_in = models.DateTimeField('وقت الدخول')
    check_out = models.DateTimeField('وقت الخروج', blank=True, null=True)
    qr_code = models.CharField('رمز QR', max_length=100, blank=True)

    class Meta:
        verbose_name = 'حضور'
        verbose_name_plural = 'حضور'
        ordering = ['-check_in']

    def __str__(self):
        return f'{self.client.get_full_name()} - {self.check_in}'
