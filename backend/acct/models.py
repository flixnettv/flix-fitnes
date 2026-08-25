from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
import uuid


class User(AbstractUser):
    # Additive ROLE_CHOICES: keep original owner/coach/client and add super_admin, gym_admin, trainer
    ROLE_CHOICES = [
        ('owner', 'المالك'),
        ('coach', 'المدرب'),
        ('client', 'العميل'),
        ('super_admin', 'Super Admin'),
        ('gym_admin', 'Gym Admin'),
        ('trainer', 'Trainer'),
    ]

    role = models.CharField('الدور', max_length=20, choices=ROLE_CHOICES, default='client')
    phone = models.CharField('الهاتف', max_length=20, blank=True)
    avatar = models.ImageField('الصورة', upload_to='avatars/', blank=True, null=True)
    birthdate = models.DateField('تاريخ الميلاد', blank=True, null=True)
    gender = models.CharField('الجنس', max_length=1, choices=[('M', 'ذكر'), ('F', 'أنثى')], blank=True)
    height_cm = models.PositiveIntegerField('الطول (سم)', blank=True, null=True)
    bio = models.TextField('نبذة', blank=True)

    # Coach fields (original)
    specializations = models.CharField('التخصصات', max_length=255, blank=True)
    experience_years = models.PositiveIntegerField('سنوات الخبرة', blank=True, null=True)

    # Client fields (original)
    assigned_coach = models.ForeignKey(
        'self', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='clients', verbose_name='المدرب المسؤول'
    )
    medical_notes = models.TextField('ملاحظات طبية', blank=True)
    goals = models.TextField('الأهداف', blank=True)

    # === ADDITIVE FIELDS from fitpro.acct.User (kept optional for migrations compatibility) ===
    # Use different names where conflict exists to preserve migrations
    date_of_birth = models.DateField('تاريخ الميلاد (إضافي)', blank=True, null=True)
    language = models.CharField('اللغة', max_length=10, choices=[('ar', 'Arabic'), ('en', 'English')], default='ar', blank=True)
    timezone = models.CharField('المنطقة الزمنية', max_length=50, default='Asia/Riyadh', blank=True)
    notifications_enabled = models.BooleanField('الإشعارات مفعلة', default=True)
    email_notifications = models.BooleanField('إشعارات البريد', default=True)
    push_notifications = models.BooleanField('إشعارات الدفع', default=True)
    sms_notifications = models.BooleanField('إشعارات الرسائل', default=False)
    profile_completion = models.PositiveIntegerField('اكتمال الملف %', default=0, validators=[MinValueValidator(0), MaxValueValidator(100)])
    is_profile_complete = models.BooleanField('الملف مكتمل', default=False)
    last_login_ip = models.GenericIPAddressField('آخر IP تسجيل دخول', null=True, blank=True)
    last_login_at = models.DateTimeField('آخر تسجيل دخول', null=True, blank=True)
    failed_login_attempts = models.PositiveIntegerField('محاولات فاشلة', default=0)
    locked_until = models.DateTimeField('مقفل حتى', null=True, blank=True)
    email_verified = models.BooleanField('البريد مؤكد', default=False)
    email_verification_token = models.UUIDField(null=True, blank=True)
    email_verification_sent_at = models.DateTimeField(null=True, blank=True)
    phone_verified = models.BooleanField('الهاتف مؤكد', default=False)
    phone_verification_code = models.CharField('كود تأكيد الهاتف', max_length=6, blank=True)
    phone_verification_sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField('تاريخ الإنشاء', auto_now_add=True, null=True)
    updated_at = models.DateTimeField('تاريخ التعديل', auto_now=True, null=True)
    deleted_at = models.DateTimeField('تاريخ الحذف', null=True, blank=True)

    class Meta:
        verbose_name = 'المستخدم'
        verbose_name_plural = 'المستخدمون'

    def __str__(self):
        return f'{self.get_full_name()} ({self.get_role_display()})'

    @property
    def is_owner(self):
        return self.role == 'owner'

    @property
    def is_coach(self):
        return self.role == 'coach'

    @property
    def is_client(self):
        return self.role == 'client'

    @property
    def is_super_admin(self):
        return self.is_superuser or self.role == 'super_admin'

    @property
    def is_gym_admin(self):
        return hasattr(self, 'gym_admin_profile') or self.role == 'gym_admin'

    @property
    def is_trainer(self):
        return self.role in ('trainer', 'coach') or hasattr(self, 'trainer_profile') or hasattr(self, 'coach_profile')

    def get_gym(self):
        """Get user's associated gym (additive helper for core branding/directory)."""
        if hasattr(self, 'gym_admin_profile'):
            try:
                return self.gym_admin_profile.gym
            except Exception:
                pass
        # coach_profile may have gym? fallback to owned_gyms
        if hasattr(self, 'coach_profile'):
            # CoachProfile in target has no gym FK, try owned_gyms
            try:
                owned = self.owned_gyms.first()
                if owned:
                    return owned
            except Exception:
                pass
        if hasattr(self, 'client_profile'):
            try:
                return self.client_profile.gym
            except Exception:
                pass
        # fallback trainer_profile alias
        if hasattr(self, 'trainer_profile'):
            try:
                return self.trainer_profile.gym
            except Exception:
                pass
        return None


class CoachProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='coach_profile', verbose_name='المدرب')
    slug = models.SlugField('الرابط الفريد', unique=True, allow_unicode=True, help_text='يُستخدم في الرابط: /coach/{slug}/')
    display_name = models.CharField('اسم العرض', max_length=100)
    logo = models.ImageField('اللوجو', upload_to='coach_logos/', blank=True, null=True)
    tagline = models.CharField('الشعار', max_length=255, blank=True, help_text='جملة قصيرة تحت الاسم')
    description = models.TextField('الوصف', blank=True)

    # Branding colors (original)
    primary_color = models.CharField('اللون الرئيسي', max_length=7, default='#22c55e', help_text='hex color like #22c55e')
    secondary_color = models.CharField('اللون الثانوي', max_length=7, default='#16a34a')
    background_color = models.CharField('لون الخلفية', max_length=7, default='#f0fdf4')
    text_color = models.CharField('لون النص', max_length=7, default='#14532d')
    font_family = models.CharField('الخط', max_length=100, default='Tajawal', help_text='اسم الخط من Google Fonts')

    # Contact
    contact_phone = models.CharField('هاتف التواصل', max_length=20, blank=True)
    contact_email = models.EmailField('بريد التواصل', blank=True)

    # Social links
    social_instagram = models.URLField('Instagram', blank=True)
    social_twitter = models.URLField('Twitter/X', blank=True)
    social_tiktok = models.URLField('TikTok', blank=True)
    social_youtube = models.URLField('YouTube', blank=True)

    is_active = models.BooleanField('مفعل', default=True)
    created_at = models.DateTimeField('تاريخ الإنشاء', auto_now_add=True)
    updated_at = models.DateTimeField('تاريخ التعديل', auto_now=True)

    # === ADDITIVE FIELDS from TrainerProfile (fitpro) ===
    employee_id = models.CharField('رقم الموظف', max_length=50, blank=True, null=True, unique=False, help_text='Unique employee code (additive)')
    specialization = models.JSONField('التخصصات (JSON)', default=list, blank=True, help_text='List of specializations')
    certifications = models.JSONField('الشهادات', default=list, blank=True, help_text='List of certifications')
    hire_date = models.DateField('تاريخ التوظيف', null=True, blank=True)
    max_clients = models.PositiveIntegerField('الحد الأقصى للعملاء', default=50, validators=[MinValueValidator(1), MaxValueValidator(500)])
    hourly_rate = models.DecimalField('سعر الساعة', max_digits=10, decimal_places=2, default=0, help_text='Hourly rate for payroll')
    bio = models.TextField('سيرة المدرب', blank=True)

    class Meta:
        verbose_name = 'بروفايل المدرب'
        verbose_name_plural = 'بروفايلات المدربين'

    def __str__(self):
        return f'{self.display_name} ({self.slug})'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = uuid.uuid4().hex[:8]
        super().save(*args, **kwargs)

    @property
    def active_clients_count(self):
        try:
            return self.supervised_clients.filter(is_active=True).count()
        except Exception:
            try:
                return self.clients.filter(is_active=True).count()
            except Exception:
                return 0

    @property
    def is_at_capacity(self):
        try:
            return self.active_clients_count >= self.max_clients
        except Exception:
            return False


# === ADDITIVE PROFILES from fitpro.acct (ClientProfile, GymAdminProfile) ===

class ClientProfile(models.Model):
    """
    Client/Member profile - linked to a gym and optionally a trainer (CoachProfile).
    Ported from fitpro.acct.ClientProfile, adapted FK to gym_center.GymCenter
    """
    MEMBERSHIP_TYPES = [
        ("basic", "Basic"),
        ("premium", "Premium"),
        ("vip", "VIP"),
        ("trial", "Trial"),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='client_profile', verbose_name='المستخدم')
    gym = models.ForeignKey('gym_center.GymCenter', on_delete=models.CASCADE, related_name='members', verbose_name='الصالة', null=True, blank=True)
    trainer = models.ForeignKey(CoachProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name='supervised_clients', verbose_name='المدرب المسؤول')
    membership_type = models.CharField('نوع العضوية', max_length=20, choices=MEMBERSHIP_TYPES, default='basic')
    membership_start = models.DateField('بداية العضوية', null=True, blank=True)
    membership_end = models.DateField('نهاية العضوية', null=True, blank=True)
    goals = models.JSONField('الأهداف', default=list, blank=True)
    medical_notes = models.TextField('ملاحظات طبية', blank=True)
    emergency_contact = models.JSONField('جهة الاتصال للطوارئ', default=dict, blank=True)
    is_active = models.BooleanField('نشط', default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'بروفايل العميل'
        verbose_name_plural = 'بروفايلات العملاء'
        ordering = ['-created_at']

    def __str__(self):
        try:
            return f"{self.user.get_full_name()} - {self.gym.name if self.gym else 'No Gym'}"
        except Exception:
            return f"Client {self.id}"

    @property
    def is_membership_active(self):
        if not self.is_active or not self.membership_end:
            return False
        return self.membership_end >= timezone.now().date()

    @property
    def days_remaining(self):
        if not self.membership_end:
            return 0
        delta = self.membership_end - timezone.now().date()
        return max(0, delta.days)


class GymAdminProfile(models.Model):
    """
    Gym Admin profile - one per gym. Ported from fitpro.acct.GymAdminProfile
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='gym_admin_profile', verbose_name='المستخدم')
    gym = models.OneToOneField('gym_center.GymCenter', on_delete=models.CASCADE, related_name='admin_profile', verbose_name='الصالة')
    permissions = models.JSONField('صلاحيات مخصصة', default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'بروفايل مدير الصالة'
        verbose_name_plural = 'بروفايلات مدراء الصالات'

    def __str__(self):
        try:
            return f"Admin: {self.user.get_full_name()} - {self.gym.name}"
        except Exception:
            return f"GymAdmin {self.id}"

    def has_perm(self, perm):
        return self.permissions.get(perm, False)
