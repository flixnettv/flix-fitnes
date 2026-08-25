"""
Progress App Models - Progress photos, goals, weekly check-ins (ported)
Adapted: fitpro.core -> core, gym -> gym_center
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator
try:
    from core.models import TenantBaseModel
    HAS_TENANT = True
except ImportError:
    HAS_TENANT = False
    TenantBaseModel = models.Model

if HAS_TENANT:
    class ProgressPhoto(TenantBaseModel):
        PHOTO_TYPES = [("front", _("Front")), ("side", _("Side")), ("back", _("Back")), ("custom", _("Custom"))]
        client = models.ForeignKey('acct.ClientProfile', on_delete=models.CASCADE, related_name="progress_photos", verbose_name=_("Client"))
        photo = models.ImageField(_("Photo"), upload_to="progress/%Y/%m/")
        photo_type = models.CharField(_("Photo Type"), max_length=20, choices=PHOTO_TYPES, default="front")
        weight_kg = models.DecimalField(_("Weight at Photo (kg)"), max_digits=5, decimal_places=2, null=True, blank=True)
        body_fat_percent = models.DecimalField(_("Body Fat (%)"), max_digits=4, decimal_places=1, null=True, blank=True)
        notes = models.TextField(_("Notes"), blank=True)
        is_private = models.BooleanField(_("Private (trainer only)"), default=False)
        class Meta:
            verbose_name = _("Progress Photo")
            verbose_name_plural = _("Progress Photos")
            ordering = ["-created_at"]
            indexes = [models.Index(fields=["client", "-created_at"])]
        def __str__(self):
            return f"{self.client} - {self.get_photo_type_display()} ({self.created_at.date()})"

    class Goal(TenantBaseModel):
        GOAL_TYPES = [("weight", _("Weight")), ("body_fat", _("Body Fat %")), ("muscle_mass", _("Muscle Mass")), ("waist", _("Waist Circumference")), ("performance", _("Performance")), ("custom", _("Custom"))]
        STATUS = [("active", _("Active")), ("achieved", _("Achieved")), ("behind", _("Behind")), ("cancelled", _("Cancelled"))]
        client = models.ForeignKey('acct.ClientProfile', on_delete=models.CASCADE, related_name="progress_goals", verbose_name=_("Client"))
        title = models.CharField(_("Goal Title"), max_length=200)
        goal_type = models.CharField(_("Goal Type"), max_length=20, choices=GOAL_TYPES, default="weight")
        target_value = models.DecimalField(_("Target Value"), max_digits=7, decimal_places=2)
        current_value = models.DecimalField(_("Current Value"), max_digits=7, decimal_places=2, null=True, blank=True)
        unit = models.CharField(_("Unit"), max_length=20, default="kg")
        start_date = models.DateField(_("Start Date"))
        target_date = models.DateField(_("Target Date"))
        status = models.CharField(_("Status"), max_length=20, choices=STATUS, default="active")
        trainer_notes = models.TextField(_("Trainer Notes"), blank=True)
        class Meta:
            verbose_name = _("Goal")
            verbose_name_plural = _("Goals")
            ordering = ["-created_at"]
        def __str__(self):
            return f"{self.client} - {self.title}"
        @property
        def progress_percent(self):
            if not self.current_value or not self.target_value:
                return 0
            try:
                return min(100, round(float(self.current_value) / float(self.target_value) * 100))
            except (ZeroDivisionError, ValueError):
                return 0

    class WeeklyCheckin(TenantBaseModel):
        client = models.ForeignKey('acct.ClientProfile', on_delete=models.CASCADE, related_name="checkins", verbose_name=_("Client"))
        week_start = models.DateField(_("Week Start"))
        weight_kg = models.DecimalField(_("Weight (kg)"), max_digits=5, decimal_places=2)
        body_fat_percent = models.DecimalField(_("Body Fat (%)"), max_digits=4, decimal_places=1, null=True, blank=True)
        measurements = models.JSONField(_("Measurements"), default=dict, blank=True, help_text='{"chest": 100, "waist": 85}')
        energy_level = models.PositiveIntegerField(_("Energy Level (1-5)"), null=True, blank=True, validators=[MinValueValidator(1), MaxValueValidator(5)])
        sleep_quality = models.PositiveIntegerField(_("Sleep Quality (1-5)"), null=True, blank=True, validators=[MinValueValidator(1), MaxValueValidator(5)])
        stress_level = models.PositiveIntegerField(_("Stress Level (1-5)"), null=True, blank=True, validators=[MinValueValidator(1), MaxValueValidator(5)])
        adherence = models.PositiveIntegerField(_("Plan Adherence (1-5)"), null=True, blank=True, validators=[MinValueValidator(1), MaxValueValidator(5)])
        client_notes = models.TextField(_("Client Notes"), blank=True)
        trainer_feedback = models.TextField(_("Trainer Feedback"), blank=True)
        next_week_adjustments = models.TextField(_("Next Week Adjustments"), blank=True)
        class Meta:
            verbose_name = _("Weekly Check-in")
            verbose_name_plural = _("Weekly Check-ins")
            ordering = ["-week_start"]
            unique_together = [("client", "week_start")]
            indexes = [models.Index(fields=["client", "-week_start"])]
        def __str__(self):
            return f"{self.client} - Week of {self.week_start}"
else:
    import uuid
    class ProgressPhoto(models.Model):
        id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
        gym = models.ForeignKey('gym_center.GymCenter', on_delete=models.CASCADE, null=True, blank=True)
        client = models.ForeignKey('acct.ClientProfile', on_delete=models.CASCADE, related_name="progress_photos")
        photo = models.ImageField(upload_to="progress/%Y/%m/")
        photo_type = models.CharField(max_length=20, choices=[("front","Front"),("side","Side"),("back","Back"),("custom","Custom")], default="front")
        weight_kg = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
        body_fat_percent = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
        notes = models.TextField(blank=True)
        is_private = models.BooleanField(default=False)
        created_at = models.DateTimeField(auto_now_add=True)
        updated_at = models.DateTimeField(auto_now=True)
    class Goal(models.Model):
        id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
        gym = models.ForeignKey('gym_center.GymCenter', on_delete=models.CASCADE, null=True, blank=True)
        client = models.ForeignKey('acct.ClientProfile', on_delete=models.CASCADE, related_name="progress_goals")
        title = models.CharField(max_length=200)
        goal_type = models.CharField(max_length=20, default="weight")
        target_value = models.DecimalField(max_digits=7, decimal_places=2)
        current_value = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
        unit = models.CharField(max_length=20, default="kg")
        start_date = models.DateField()
        target_date = models.DateField()
        status = models.CharField(max_length=20, default="active")
        trainer_notes = models.TextField(blank=True)
        created_at = models.DateTimeField(auto_now_add=True)
    class WeeklyCheckin(models.Model):
        id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
        gym = models.ForeignKey('gym_center.GymCenter', on_delete=models.CASCADE, null=True, blank=True)
        client = models.ForeignKey('acct.ClientProfile', on_delete=models.CASCADE, related_name="checkins")
        week_start = models.DateField()
        weight_kg = models.DecimalField(max_digits=5, decimal_places=2)
        body_fat_percent = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
        measurements = models.JSONField(default=dict, blank=True)
        energy_level = models.PositiveIntegerField(null=True, blank=True)
        sleep_quality = models.PositiveIntegerField(null=True, blank=True)
        stress_level = models.PositiveIntegerField(null=True, blank=True)
        adherence = models.PositiveIntegerField(null=True, blank=True)
        client_notes = models.TextField(blank=True)
        trainer_feedback = models.TextField(blank=True)
        next_week_adjustments = models.TextField(blank=True)
        created_at = models.DateTimeField(auto_now_add=True)
