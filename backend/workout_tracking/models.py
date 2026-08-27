"""
Workout App Models - Exercise library and workout plans.
"""
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator
from core.models import TenantBaseModel


class Exercise(TenantBaseModel):
    """Exercise in the gym's library."""

    MUSCLE_GROUPS = [
        ("chest", _("Chest")),
        ("back", _("Back")),
        ("legs", _("Legs")),
        ("shoulders", _("Shoulders")),
        ("arms", _("Arms")),
        ("core", _("Core")),
        ("full_body", _("Full Body")),
        ("cardio", _("Cardio")),
    ]
    EQUIPMENT = [
        ("barbell", _("Barbell")),
        ("dumbbell", _("Dumbbell")),
        ("machine", _("Machine")),
        ("cable", _("Cable")),
        ("bodyweight", _("Bodyweight")),
        ("kettlebell", _("Kettlebell")),
        ("other", _("Other")),
    ]
    DIFFICULTY = [
        ("beginner", _("Beginner")),
        ("intermediate", _("Intermediate")),
        ("advanced", _("Advanced")),
    ]

    name = models.CharField(_("Name"), max_length=200)
    name_ar = models.CharField(_("Name (Arabic)"), max_length=200, blank=True)
    description = models.TextField(_("Description"), blank=True)
    muscle_group = models.CharField(_("Muscle Group"), max_length=20, choices=MUSCLE_GROUPS)
    equipment = models.CharField(_("Equipment"), max_length=20, choices=EQUIPMENT, default="bodyweight")
    difficulty = models.CharField(_("Difficulty"), max_length=20, choices=DIFFICULTY, default="beginner")
    video_url = models.URLField(_("Video URL"), blank=True)
    gif_url = models.URLField(_("GIF URL"), blank=True)
    instructions = models.JSONField(_("Instructions"), default=list, blank=True)
    is_custom = models.BooleanField(_("Custom Exercise"), default=False)

    class Meta:
        verbose_name = _("Exercise")
        verbose_name_plural = _("Exercises")
        ordering = ["name"]
        indexes = [models.Index(fields=["gym", "muscle_group"])]

    def __str__(self):
        return self.name_ar or self.name


class WorkoutPlan(TenantBaseModel):
    """Reusable workout plan template created by a trainer."""

    LEVELS = [
        ("beginner", _("Beginner")),
        ("intermediate", _("Intermediate")),
        ("advanced", _("Advanced")),
    ]
    GOALS = [
        ("weight_loss", _("Weight Loss")),
        ("muscle_gain", _("Muscle Gain")),
        ("strength", _("Strength")),
        ("endurance", _("Endurance")),
        ("flexibility", _("Flexibility")),
        ("general", _("General Fitness")),
    ]

    trainer = models.ForeignKey(
        "acct.TrainerProfile",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="workout_plans",
        verbose_name=_("Trainer"),
    )
    client = models.ForeignKey(
        "acct.ClientProfile",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_workout_plans",
        verbose_name=_("Assigned Client"),
        help_text=_("Set when the plan is assigned to a specific client."),
    )
    name = models.CharField(_("Plan Name"), max_length=200)
    description = models.TextField(_("Description"), blank=True)
    duration_weeks = models.PositiveIntegerField(_("Duration (weeks)"), default=4)
    days_per_week = models.PositiveIntegerField(
        _("Days Per Week"), default=3,
        validators=[MinValueValidator(1), MaxValueValidator(7)],
    )
    level = models.CharField(_("Level"), max_length=20, choices=LEVELS, default="beginner")
    goal = models.CharField(_("Goal"), max_length=20, choices=GOALS, default="general")
    is_template = models.BooleanField(_("Is Template"), default=True)

    class Meta:
        verbose_name = _("Workout Plan")
        verbose_name_plural = _("Workout Plans")
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class WorkoutDay(TenantBaseModel):
    """A single training day inside a workout plan."""

    plan = models.ForeignKey(
        WorkoutPlan, on_delete=models.CASCADE,
        related_name="days", verbose_name=_("Plan"),
    )
    day_number = models.PositiveIntegerField(
        _("Day Number"),
        validators=[MinValueValidator(1), MaxValueValidator(7)],
    )
    name = models.CharField(_("Day Name"), max_length=100, help_text=_('e.g. "Upper Body"'))
    notes = models.TextField(_("Notes"), blank=True)

    class Meta:
        verbose_name = _("Workout Day")
        verbose_name_plural = _("Workout Days")
        ordering = ["day_number"]
        unique_together = [("plan", "day_number")]

    def __str__(self):
        return f"{self.plan.name} - Day {self.day_number}: {self.name}"


class WorkoutExercise(TenantBaseModel):
    """An exercise entry within a workout day."""

    day = models.ForeignKey(
        WorkoutDay, on_delete=models.CASCADE,
        related_name="exercises", verbose_name=_("Day"),
    )
    exercise = models.ForeignKey(
        Exercise, on_delete=models.CASCADE,
        related_name="plan_entries", verbose_name=_("Exercise"),
    )
    order = models.PositiveIntegerField(_("Order"), default=1)
    sets = models.PositiveIntegerField(_("Sets"), default=3)
    reps = models.CharField(_("Reps"), max_length=20, default="10", help_text=_('e.g. "8-12" or "AMRAP"'))
    rest_seconds = models.PositiveIntegerField(_("Rest (seconds)"), default=90)
    tempo = models.CharField(_("Tempo"), max_length=20, blank=True, help_text=_('e.g. "3-0-1-0"'))
    notes = models.TextField(_("Notes"), blank=True)

    class Meta:
        verbose_name = _("Workout Exercise")
        verbose_name_plural = _("Workout Exercises")
        ordering = ["order"]

    def __str__(self):
        return f"{self.exercise} x{self.sets}x{self.reps}"


class WorkoutLog(TenantBaseModel):
    """An actual workout session logged by a client."""

    STATUS = [
        ("in_progress", _("In Progress")),
        ("completed", _("Completed")),
        ("skipped", _("Skipped")),
    ]

    client = models.ForeignKey(
        "acct.ClientProfile",
        on_delete=models.CASCADE,
        related_name="workout_logs",
        verbose_name=_("Client"),
        null=True,
        blank=True,
    )
    plan = models.ForeignKey(
        WorkoutPlan, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="logs", verbose_name=_("Plan"),
    )
    day = models.ForeignKey(
        WorkoutDay, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="logs", verbose_name=_("Day"),
    )
    started_at = models.DateTimeField(_("Started At"), null=True, blank=True)
    completed_at = models.DateTimeField(_("Completed At"), null=True, blank=True)
    duration_minutes = models.PositiveIntegerField(_("Duration (minutes)"), null=True, blank=True)
    status = models.CharField(_("Status"), max_length=20, choices=STATUS, default="in_progress")
    notes = models.TextField(_("Client Notes"), blank=True)
    rating = models.PositiveIntegerField(
        _("Rating (1-5)"), null=True, blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )
    trainer_feedback = models.TextField(_("Trainer Feedback"), blank=True)

    class Meta:
        verbose_name = _("Workout Log")
        verbose_name_plural = _("Workout Logs")
        ordering = ["-started_at"]
        indexes = [models.Index(fields=["client", "-started_at"])]
