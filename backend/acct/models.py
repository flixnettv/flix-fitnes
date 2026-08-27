"""
Account App Models

Defines the custom User model and related profiles.
"""
import uuid
from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from django.utils.text import slugify
from django.core.validators import MinValueValidator, MaxValueValidator
from core.models import TenantBaseModel, ActivationMixin, TimeStampedMixin


class User(AbstractUser):
    """
    Custom User model with role-based access.
    
    Extends AbstractUser to add:
    - UUID primary key
    - Role field (super_admin, gym_admin, trainer, client)
    - Email as unique identifier (optional)
    - Phone number
    - Profile completion tracking
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(_("Email"), unique=True)
    phone = models.CharField(_("Phone"), max_length=20, blank=True)
    date_of_birth = models.DateField(_("Date of Birth"), null=True, blank=True)
    gender = models.CharField(
        _("Gender"),
        max_length=10,
        choices=[("M", _("Male")), ("F", _("Female")), ("O", _("Other"))],
        blank=True
    )
    avatar = models.ImageField(
        _("Avatar"),
        upload_to="users/avatars/",
        blank=True,
        null=True,
        help_text=_("Profile picture, max 2MB")
    )
    bio = models.TextField(_("Bio"), blank=True, max_length=500)
    
    # Role
    ROLE_CHOICES = [
        ("super_admin", _("Super Admin")),
        ("gym_admin", _("Gym Admin")),
        ("trainer", _("Trainer")),
        ("client", _("Client")),
    ]
    role = models.CharField(
        _("Role"),
        max_length=20,
        choices=ROLE_CHOICES,
        default="client"
    )
    
    # Profile completion
    profile_completion = models.PositiveIntegerField(
        _("Profile Completion %"),
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    is_profile_complete = models.BooleanField(_("Profile Complete"), default=False)
    
    # Preferences
    language = models.CharField(
        _("Language"),
        max_length=10,
        choices=[("ar", _("Arabic")), ("en", _("English"))],
        default="ar"
    )
    timezone = models.CharField(_("Timezone"), max_length=50, default="Asia/Riyadh")
    notifications_enabled = models.BooleanField(_("Notifications Enabled"), default=True)
    email_notifications = models.BooleanField(_("Email Notifications"), default=True)
    push_notifications = models.BooleanField(_("Push Notifications"), default=True)
    sms_notifications = models.BooleanField(_("SMS Notifications"), default=False)
    
    # Security
    last_login_ip = models.GenericIPAddressField(_("Last Login IP"), null=True, blank=True)
    last_login_at = models.DateTimeField(_("Last Login At"), null=True, blank=True)
    failed_login_attempts = models.PositiveIntegerField(_("Failed Login Attempts"), default=0)
    locked_until = models.DateTimeField(_("Locked Until"), null=True, blank=True)
    
    # Verification
    email_verified = models.BooleanField(_("Email Verified"), default=False)
    email_verification_token = models.UUIDField(null=True, blank=True)
    email_verification_sent_at = models.DateTimeField(null=True, blank=True)
    phone_verified = models.BooleanField(_("Phone Verified"), default=False)
    phone_verification_code = models.CharField(_("Phone Verification Code"), max_length=6, blank=True)
    phone_verification_sent_at = models.DateTimeField(null=True, blank=True)
    
    # Settings
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]
    
    class Meta:
        verbose_name = _("User")
        verbose_name_plural = _("Users")
        ordering = ["-date_joined"]
        indexes = [
            models.Index(fields=["email"]),
            models.Index(fields=["role"]),
            models.Index(fields=["is_active"]),
            models.Index(fields=["date_joined"]),
        ]

    def __str__(self):
        return f"{self.get_full_name()} ({self.email})"

    def get_full_name(self):
        """Return full name or username if names not set."""
        full_name = super().get_full_name().strip()
        return full_name if full_name else self.username

    def get_short_name(self):
        return self.first_name or self.username

    @property
    def is_super_admin(self):
        return self.is_superuser or self.role == "super_admin"

    @property
    def is_gym_admin(self):
        return hasattr(self, "gym_admin_profile")

    @property
    def is_trainer(self):
        return hasattr(self, "trainer_profile") and self.trainer_profile.is_active

    @property
    def is_client(self):
        return hasattr(self, "client_profile")

    def get_gym(self):
        """Get user's associated gym."""
        if hasattr(self, "gym_admin_profile"):
            return self.gym_admin_profile.gym
        if hasattr(self, "trainer_profile") and self.trainer_profile.is_active:
            return self.trainer_profile.gym
        if hasattr(self, "client_profile"):
            return self.client_profile.gym
        return None

    def update_profile_completion(self):
        """Calculate and update profile completion percentage."""
        fields = [
            ("first_name", self.first_name),
            ("last_name", self.last_name),
            ("email", self.email),
            ("phone", self.phone),
            ("date_of_birth", self.date_of_birth),
            ("avatar", self.avatar),
            ("bio", self.bio),
        ]
        
        completed = sum(1 for _, value in fields if value)
        total = len(fields)
        self.profile_completion = int((completed / total) * 100)
        self.is_profile_complete = self.profile_completion >= 80
        self.save(update_fields=["profile_completion", "is_profile_complete"])
        return self.profile_completion

    def record_login(self, request):
        """Record successful login."""
        self.last_login_ip = self.get_client_ip(request)
        self.last_login_at = timezone.now()
        self.failed_login_attempts = 0
        self.locked_until = None
        self.save(update_fields=["last_login_ip", "last_login_at", "failed_login_attempts", "locked_until"])

    def record_failed_login(self):
        """Record failed login attempt."""
        self.failed_login_attempts += 1
        if self.failed_login_attempts >= 5:
            self.locked_until = timezone.now() + timezone.timedelta(minutes=30)
        self.save(update_fields=["failed_login_attempts", "locked_until"])

    def is_locked(self):
        if self.locked_until and timezone.now() < self.locked_until:
            return True
        return False

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            return x_forwarded_for.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR")


class UserProfile(models.Model):
    """
    Extended user profile for additional info.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
        verbose_name=_("User")
    )
    
    # Social
    instagram = models.URLField(_("Instagram"), blank=True)
    twitter = models.URLField(_("Twitter"), blank=True)
    linkedin = models.URLField(_("LinkedIn"), blank=True)
    website = models.URLField(_("Website"), blank=True)
    
    # Professional
    occupation = models.CharField(_("Occupation"), max_length=100, blank=True)
    company = models.CharField(_("Company"), max_length=100, blank=True)
    skills = models.JSONField(_("Skills"), default=list, blank=True)
    certifications = models.JSONField(_("Certifications"), default=list, blank=True)
    
    # Emergency contact
    emergency_contact_name = models.CharField(_("Emergency Contact Name"), max_length=200, blank=True)
    emergency_contact_phone = models.CharField(_("Emergency Contact Phone"), max_length=20, blank=True)
    emergency_contact_relation = models.CharField(_("Relation"), max_length=50, blank=True)
    
    # Medical
    blood_type = models.CharField(_("Blood Type"), max_length=5, blank=True)
    allergies = models.TextField(_("Allergies"), blank=True)
    medications = models.TextField(_("Medications"), blank=True)
    medical_conditions = models.TextField(_("Medical Conditions"), blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _("User Profile")
        verbose_name_plural = _("User Profiles")

    def __str__(self):
        return f"Profile for {self.user.get_full_name()}"


class TrainerProfile(TenantBaseModel, ActivationMixin, TimeStampedMixin):
    """
    Trainer profile - linked to a gym.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="trainer_profile",
        verbose_name=_("User")
    )
    gym = models.ForeignKey(
        "gym_center.Gym",
        on_delete=models.CASCADE,
        related_name="trainers",
        verbose_name=_("Gym")
    )
    employee_id = models.CharField(
        _("Employee ID"),
        max_length=50,
        unique=True,
        help_text=_("Unique employee code")
    )
    specialization = models.JSONField(
        _("Specializations"),
        default=list,
        blank=True,
        help_text=_("List of specializations: [\"Strength\", \"Cardio\", \"Rehab\"]")
    )
    certifications = models.JSONField(
        _("Certifications"),
        default=list,
        blank=True,
        help_text=_("List of certifications")
    )
    hire_date = models.DateField(_("Hire Date"))
    max_clients = models.PositiveIntegerField(
        _("Max Clients"),
        default=50,
        validators=[MinValueValidator(1), MaxValueValidator(500)]
    )
    hourly_rate = models.DecimalField(
        _("Hourly Rate"),
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text=_("Hourly rate for payroll")
    )
    bio = models.TextField(_("Bio"), blank=True)
    is_active = models.BooleanField(_("Is Active"), default=True)
    
    class Meta:
        verbose_name = _("Trainer Profile")
        verbose_name_plural = _("Trainer Profiles")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["gym", "is_active"]),
            models.Index(fields=["employee_id"]),
        ]

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.gym.name}"

    @property
    def active_clients_count(self):
        return self.clients.filter(is_active=True).count()

    @property
    def is_at_capacity(self):
        return self.active_clients_count >= self.max_clients


class ClientProfile(TenantBaseModel, ActivationMixin, TimeStampedMixin):
    """
    Client/Member profile - linked to a gym and optionally a trainer.
    """
    MEMBERSHIP_TYPES = [
        ("basic", _("Basic")),
        ("premium", _("Premium")),
        ("vip", _("VIP")),
        ("trial", _("Trial")),
    ]
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="client_profile",
        verbose_name=_("User")
    )
    gym = models.ForeignKey(
        "gym_center.Gym",
        on_delete=models.CASCADE,
        related_name="members",
        verbose_name=_("Gym")
    )
    trainer = models.ForeignKey(
        TrainerProfile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="clients",
        verbose_name=_("Assigned Trainer")
    )
    membership_type = models.CharField(
        _("Membership Type"),
        max_length=20,
        choices=MEMBERSHIP_TYPES,
        default="basic"
    )
    membership_start = models.DateField(_("Membership Start"))
    membership_end = models.DateField(_("Membership End"))
    goals = models.JSONField(
        _("Goals"),
        default=list,
        blank=True,
        help_text=_("Fitness goals: [\"Weight Loss\", \"Muscle Gain\"]")
    )
    medical_notes = models.TextField(_("Medical Notes"), blank=True)
    emergency_contact = models.JSONField(
        _("Emergency Contact"),
        default=dict,
        blank=True,
        help_text=_("{\"name\": \"\", \"phone\": \"\", \"relation\": \"\"}")
    )
    is_active = models.BooleanField(_("Is Active"), default=True)
    
    class Meta:
        verbose_name = _("Client Profile")
        verbose_name_plural = _("Client Profiles")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["gym", "is_active"]),
            models.Index(fields=["trainer", "is_active"]),
            models.Index(fields=["membership_end"]),
        ]

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.gym.name}"

    @property
    def is_membership_active(self):
        from django.utils import timezone
        return self.is_active and self.membership_end >= timezone.now().date()

    @property
    def days_remaining(self):
        from django.utils import timezone
        delta = self.membership_end - timezone.now().date()
        return max(0, delta.days)


class GymAdminProfile(TenantBaseModel, TimeStampedMixin):
    """
    Gym Admin profile - one per gym.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="gym_admin_profile",
        verbose_name=_("User")
    )
    gym = models.OneToOneField(
        "gym_center.Gym",
        on_delete=models.CASCADE,
        related_name="admin_profile",
        verbose_name=_("Gym")
    )
    permissions = models.JSONField(
        _("Custom Permissions"),
        default=dict,
        blank=True,
        help_text=_("Custom permissions override: {\"manage_trainers\": true, \"view_analytics\": true}")
    )
    
    class Meta:
        verbose_name = _("Gym Admin Profile")
        verbose_name_plural = _("Gym Admin Profiles")

    def __str__(self):
        return f"Admin: {self.user.get_full_name()} - {self.gym.name}"

    def has_perm(self, perm):
        """Check if admin has specific permission."""
        return self.permissions.get(perm, False)


class CoachProfile(TimeStampedMixin):
    """
    Coach profile for personal branding.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="coach_profile",
        verbose_name=_("User")
    )
    slug = models.SlugField(
        _("Slug"),
        allow_unicode=True,
        unique=True,
        help_text=_("Used in URL: /coach/{slug}/")
    )
    display_name = models.CharField(
        _("Display Name"),
        max_length=100
    )
    logo = models.ImageField(
        _("Logo"),
        upload_to="coach_logos/",
        blank=True,
        null=True
    )
    tagline = models.CharField(
        _("Tagline"),
        max_length=255,
        blank=True,
        help_text=_("Short phrase under the name")
    )
    description = models.TextField(
        _("Description"),
        blank=True
    )
    primary_color = models.CharField(
        _("Primary Color"),
        max_length=7,
        default="#22c55e",
        help_text=_("hex color like #22c55e")
    )
    secondary_color = models.CharField(
        _("Secondary Color"),
        max_length=7,
        default="#16a34a"
    )
    background_color = models.CharField(
        _("Background Color"),
        max_length=7,
        default="#f0fdf4"
    )
    text_color = models.CharField(
        _("Text Color"),
        max_length=7,
        default="#14532d"
    )
    font_family = models.CharField(
        _("Font Family"),
        max_length=100,
        default="Tajawal",
        help_text=_("Google Fonts name")
    )
    contact_phone = models.CharField(
        _("Contact Phone"),
        max_length=20,
        blank=True
    )
    contact_email = models.EmailField(
        _("Contact Email"),
        max_length=254,
        blank=True
    )
    social_instagram = models.URLField(
        _("Instagram"),
        blank=True
    )
    social_twitter = models.URLField(
        _("Twitter/X"),
        blank=True
    )
    social_tiktok = models.URLField(
        _("TikTok"),
        blank=True
    )
    social_youtube = models.URLField(
        _("YouTube"),
        blank=True
    )
    is_active = models.BooleanField(
        _("Is Active"),
        default=True
    )
    
    class Meta:
        verbose_name = _("Coach Profile")
        verbose_name_plural = _("Coach Profiles")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.display_name} ({self.user.email})"