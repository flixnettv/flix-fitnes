import uuid
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

class Gym(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant_id = models.UUIDField(default=uuid.uuid4, unique=True, help_text="Tenant sharding id")
    slug = models.SlugField(_("Slug / Subdomain"), max_length=50, unique=True, help_text=_("Used for subdomain: slug.fitpro.hftv.qzz.io"))
    name = models.CharField(_("Gym Name"), max_length=120)
    description = models.TextField(_("Description"), blank=True)
    city = models.CharField(_("City"), max_length=100, blank=True)
    custom_domain = models.CharField(_("Custom Domain"), max_length=255, blank=True, help_text=_("Optional full domain"))

    # Account kind: full gym OR independent trainer personal app
    KINDS = [
        ("gym", _("Gym")),
        ("personal", _("Personal Trainer App")),
    ]
    kind = models.CharField(_("Account Kind"), max_length=10, choices=KINDS, default="gym")

    # Theme / branding colors (keep legacy)
    primary_color = models.CharField(_("Primary Color"), max_length=7, default="#38BDF8")
    secondary_color = models.CharField(_("Secondary Color"), max_length=7, default="#22D3EE")
    accent_color = models.CharField(_("Accent Color"), max_length=7, default="#4ADE80")
    background_color = models.CharField(_("Background Color"), max_length=7, default="#0F172A")
    surface_color = models.CharField(_("Surface Color"), max_length=7, default="#1E293B")

    # Owner-adjustable appearance (limited set) - NEW
    THEMES = [
        ("dark", _("Dark")),
        ("light", _("Light")),
    ]
    default_theme = models.CharField(_("Default Theme"), max_length=5, choices=THEMES, default="dark")
    banner = models.ImageField(_("Banner"), upload_to="gyms/banners/", blank=True, null=True)
    background_image = models.ImageField(_("Background Image"), upload_to="gyms/backgrounds/", blank=True, null=True)

    # Splash / start screen customization - NEW
    SPLASH_STYLES = [
        ("gradient", _("Brand Gradient")),
        ("solid", _("Solid Brand")),
        ("minimal", _("Minimal Dark")),
    ]
    splash_title = models.CharField(_("Splash Title"), max_length=120, blank=True)
    splash_tagline = models.CharField(_("Splash Tagline"), max_length=200, blank=True)
    splash_style = models.CharField(_("Splash Style"), max_length=12, choices=SPLASH_STYLES, default="gradient")
    splash_image = models.ImageField(_("Splash Background"), upload_to="gyms/splash/", blank=True, null=True)

    # Legacy fonts & SEO
    font_family = models.CharField(_("Font Family"), max_length=50, default="Cairo")
    font_weight_regular = models.PositiveSmallIntegerField(default=400)
    font_weight_medium = models.PositiveSmallIntegerField(default=600)
    font_weight_bold = models.PositiveSmallIntegerField(default=700)
    logo = models.ImageField(_("Logo"), upload_to="gyms/logos/", blank=True, null=True)
    favicon = models.ImageField(_("Favicon"), upload_to="gyms/favicons/", blank=True, null=True)
    contact_email = models.EmailField(_("Contact Email"), blank=True)
    contact_phone = models.CharField(_("Contact Phone"), max_length=50, blank=True)
    instagram_url = models.URLField(_("Instagram"), blank=True)
    twitter_url = models.URLField(_("Twitter"), blank=True)
    website_url = models.URLField(_("Website"), blank=True)
    meta_title = models.CharField(_("Meta Title"), max_length=120, blank=True)
    meta_description = models.TextField(_("Meta Description"), blank=True)

    # General settings (gym admin managed)
    address = models.CharField(_("Address"), max_length=255, blank=True)
    opening_hours = models.JSONField(_("Opening Hours"), default=dict, blank=True,
        help_text=_('{"sat": "9:00-23:00", "fri": "closed"}'))
    currency = models.CharField(_("Currency"), max_length=10, default="EGP")
    notification_config = models.JSONField(_("Notification Config"), default=dict, blank=True,
        help_text=_('{"channels": {"email": true, "sms": false, "push": true}, "events": {...}, "expiry_reminder_days": 3}'))

    is_active = models.BooleanField(_("Is Active"), default=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Gym")
        verbose_name_plural = _("Gyms")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.slug})"


class GymInvitation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    gym = models.ForeignKey(Gym, on_delete=models.CASCADE, related_name="invitations")
    email = models.EmailField()
    role = models.CharField(max_length=20, choices=[("trainer", "Trainer"), ("client", "Client"), ("gym_admin", "Gym Admin")], default="client")
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    is_accepted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Invite {self.email} -> {self.gym.slug}"


class GymCenter(models.Model):
    """
    Legacy Gym Center model (from migrations).
    """
    name = models.CharField(_("Gym Name"), max_length=200)
    phone = models.CharField(_("Phone"), max_length=20, blank=True)
    email = models.EmailField(_("Email"), max_length=254, blank=True)
    address = models.TextField(_("Address"), blank=True)
    logo = models.ImageField(_("Logo"), upload_to="gym_logos/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="owned_gyms",
        verbose_name=_("Owner")
    )
    
    class Meta:
        verbose_name = _("Gym Center")
        verbose_name_plural = _("Gym Centers")
        ordering = ["name"]
    
    def __str__(self):
        return self.name


class Membership(models.Model):
    """
    Legacy Membership model (from migrations).
    """
    MEMBERSHIP_TYPES = [
        ("monthly", _("Monthly")),
        ("quarterly", _("Quarterly")),
        ("yearly", _("Yearly")),
        ("lifetime", _("Lifetime")),
    ]
    
    start_date = models.DateField(_("Start Date"))
    end_date = models.DateField(_("End Date"), blank=True, null=True)
    is_active = models.BooleanField(_("Is Active"), default=True)
    membership_type = models.CharField(
        _("Membership Type"),
        max_length=15,
        choices=MEMBERSHIP_TYPES,
        default="monthly"
    )
    notes = models.TextField(_("Notes"), blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    activated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="activated_memberships",
        verbose_name=_("Activated By")
    )
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="memberships",
        verbose_name=_("Client")
    )
    coach = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="coached_memberships",
        verbose_name=_("Coach")
    )
    gym = models.ForeignKey(
        "GymCenter",
        on_delete=models.CASCADE,
        verbose_name=_("Gym")
    )
    
    class Meta:
        verbose_name = _("Membership")
        verbose_name_plural = _("Memberships")
        ordering = ["-created_at"]
    
    def __str__(self):
        return f"{self.client} - {self.gym} ({self.membership_type})"


class Attendance(models.Model):
    """
    Legacy Attendance model (from migrations).
    """
    check_in = models.DateTimeField(_("Check In"))
    check_out = models.DateTimeField(_("Check Out"), blank=True, null=True)
    qr_code = models.CharField(_("QR Code"), max_length=100, blank=True)
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="attendances",
        verbose_name=_("Client")
    )
    gym = models.ForeignKey(
        "GymCenter",
        on_delete=models.CASCADE,
        verbose_name=_("Gym")
    )
    
    class Meta:
        verbose_name = _("Attendance")
        verbose_name_plural = _("Attendances")
        ordering = ["-check_in"]
    
    def __str__(self):
        return f"{self.client} @ {self.gym} - {self.check_in}"
