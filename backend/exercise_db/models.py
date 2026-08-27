"""
Exercise DB - global exercise catalog (shared across gyms) plus gym overrides.
Preserved as requested.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _

class ExerciseCatalog(models.Model):
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(_("Name"), max_length=200)
    name_ar = models.CharField(_("Name (Arabic)"), max_length=200, blank=True)
    description = models.TextField(_("Description"), blank=True)
    muscle_group = models.CharField(_("Muscle Group"), max_length=20, choices=[
        ("chest", "Chest"), ("back", "Back"), ("legs", "Legs"), ("shoulders", "Shoulders"),
        ("arms", "Arms"), ("core", "Core"), ("full_body", "Full Body"), ("cardio", "Cardio"),
    ])
    equipment = models.CharField(_("Equipment"), max_length=20, default="bodyweight")
    difficulty = models.CharField(_("Difficulty"), max_length=20, default="beginner")
    video_url = models.URLField(blank=True)
    gif_url = models.URLField(blank=True)
    instructions = models.JSONField(default=list, blank=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("Exercise Catalog")
        verbose_name_plural = _("Exercise Catalog")
        ordering = ["name"]

    def __str__(self):
        return self.name_ar or self.name
