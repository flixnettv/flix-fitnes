"""
Body Measurements - migrated from measurements app.
Provides historical body metrics (weight, circumferences, body fat).
Kept separate from progress.WeeklyCheckin for fine-grained logs.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator
from core.models import TenantBaseModel

class BodyMeasurement(TenantBaseModel):
    client = models.ForeignKey(
        "acct.ClientProfile",
        on_delete=models.CASCADE,
        related_name="body_measurements",
        verbose_name=_("Client"),
    )
    date = models.DateField(_("Date"))
    weight_kg = models.DecimalField(_("Weight (kg)"), max_digits=5, decimal_places=2, null=True, blank=True)
    body_fat_percent = models.DecimalField(_("Body Fat (%)"), max_digits=4, decimal_places=1, null=True, blank=True)
    muscle_mass_kg = models.DecimalField(_("Muscle Mass (kg)"), max_digits=5, decimal_places=2, null=True, blank=True)
    # JSON for circumferences: chest, waist, hips, arm, thigh etc.
    measurements = models.JSONField(_("Measurements"), default=dict, blank=True)
    # individual fields for query
    chest_cm = models.DecimalField(_("Chest (cm)"), max_digits=5, decimal_places=1, null=True, blank=True)
    waist_cm = models.DecimalField(_("Waist (cm)"), max_digits=5, decimal_places=1, null=True, blank=True)
    hips_cm = models.DecimalField(_("Hips (cm)"), max_digits=5, decimal_places=1, null=True, blank=True)
    arm_cm = models.DecimalField(_("Arm (cm)"), max_digits=5, decimal_places=1, null=True, blank=True)
    thigh_cm = models.DecimalField(_("Thigh (cm)"), max_digits=5, decimal_places=1, null=True, blank=True)
    notes = models.TextField(_("Notes"), blank=True)

    class Meta:
        verbose_name = _("Body Measurement")
        verbose_name_plural = _("Body Measurements")
        ordering = ["-date"]
        indexes = [models.Index(fields=["client", "-date"])]

    def __str__(self):
        return f"{self.client} - {self.date} ({self.weight_kg}kg)"
