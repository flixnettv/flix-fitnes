"""
Nutrition App Models - Food database and meal plans.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator
from core.models import TenantBaseModel


class Food(TenantBaseModel):
    """Food item with per-100g nutrition facts."""

    CATEGORIES = [
        ("protein", _("Protein")),
        ("carbs", _("Carbohydrates")),
        ("fats", _("Fats")),
        ("vegetables", _("Vegetables")),
        ("fruits", _("Fruits")),
        ("dairy", _("Dairy")),
        ("supplements", _("Supplements")),
        ("other", _("Other")),
    ]

    name = models.CharField(_("Name"), max_length=200)
    name_ar = models.CharField(_("Name (Arabic)"), max_length=200, blank=True)
    calories_per_100g = models.PositiveIntegerField(_("Calories / 100g"), default=0)
    protein_g = models.DecimalField(_("Protein (g)"), max_digits=6, decimal_places=2, default=0)
    carbs_g = models.DecimalField(_("Carbs (g)"), max_digits=6, decimal_places=2, default=0)
    fat_g = models.DecimalField(_("Fat (g)"), max_digits=6, decimal_places=2, default=0)
    fiber_g = models.DecimalField(_("Fiber (g)"), max_digits=6, decimal_places=2, default=0)
    category = models.CharField(_("Category"), max_length=20, choices=CATEGORIES, default="other")
    is_custom = models.BooleanField(_("Custom Food"), default=False)

    class Meta:
        verbose_name = _("Food")
        verbose_name_plural = _("Foods")
        ordering = ["name"]
        indexes = [models.Index(fields=["gym", "category"])]

    def __str__(self):
        return self.name_ar or self.name


class MealPlan(TenantBaseModel):
    """Nutrition plan created by a trainer."""

    GOALS = [
        ("weight_loss", _("Weight Loss")),
        ("muscle_gain", _("Muscle Gain")),
        ("maintenance", _("Maintenance")),
        ("clean_bulk", _("Clean Bulk")),
    ]

    trainer = models.ForeignKey(
        "acct.TrainerProfile",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="meal_plans",
        verbose_name=_("Trainer"),
    )
    client = models.ForeignKey(
        "acct.ClientProfile",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_meal_plans",
        verbose_name=_("Assigned Client"),
    )
    name = models.CharField(_("Plan Name"), max_length=200)
    goal = models.CharField(_("Goal"), max_length=20, choices=GOALS, default="maintenance")
    daily_calories = models.PositiveIntegerField(_("Daily Calories"), default=2000)
    protein_target_g = models.PositiveIntegerField(_("Protein Target (g)"), default=150)
    carbs_target_g = models.PositiveIntegerField(_("Carbs Target (g)"), default=200)
    fat_target_g = models.PositiveIntegerField(_("Fat Target (g)"), default=60)
    notes = models.TextField(_("Notes"), blank=True)
    is_template = models.BooleanField(_("Is Template"), default=True)

    class Meta:
        verbose_name = _("Meal Plan")
        verbose_name_plural = _("Meal Plans")
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class Meal(TenantBaseModel):
    """A meal within a meal plan."""

    plan = models.ForeignKey(
        MealPlan, on_delete=models.CASCADE,
        related_name="meals", verbose_name=_("Plan"),
    )
    name = models.CharField(_("Meal Name"), max_length=100, help_text=_('e.g. "Breakfast"'))
    order = models.PositiveIntegerField(_("Order"), default=1)
    calories = models.PositiveIntegerField(_("Calories"), default=0)
    protein_g = models.DecimalField(_("Protein (g)"), max_digits=6, decimal_places=2, default=0)
    carbs_g = models.DecimalField(_("Carbs (g)"), max_digits=6, decimal_places=2, default=0)
    fat_g = models.DecimalField(_("Fat (g)"), max_digits=6, decimal_places=2, default=0)
    instructions = models.TextField(_("Preparation Instructions"), blank=True)

    class Meta:
        verbose_name = _("Meal")
        verbose_name_plural = _("Meals")
        ordering = ["order"]

    def __str__(self):
        return f"{self.plan.name} - {self.name}"


class MealFood(TenantBaseModel):
    """A food quantity within a meal."""

    meal = models.ForeignKey(
        Meal, on_delete=models.CASCADE,
        related_name="foods", verbose_name=_("Meal"),
    )
    food = models.ForeignKey(
        Food, on_delete=models.CASCADE,
        related_name="meal_entries", verbose_name=_("Food"),
    )
    quantity_g = models.DecimalField(
        _("Quantity (g)"), max_digits=7, decimal_places=1, default=100,
        validators=[MinValueValidator(1)],
    )
    notes = models.TextField(_("Notes"), blank=True)

    class Meta:
        verbose_name = _("Meal Food")
        verbose_name_plural = _("Meal Foods")

    def __str__(self):
        return f"{self.quantity_g}g {self.food}"


class NutritionLog(TenantBaseModel):
    """Daily nutrition diary entry for a client."""

    client = models.ForeignKey(
        "acct.ClientProfile",
        on_delete=models.CASCADE,
        related_name="nutrition_logs",
        verbose_name=_("Client"),
    )
    plan = models.ForeignKey(
        MealPlan, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="logs", verbose_name=_("Plan"),
    )
    date = models.DateField(_("Date"))
    food = models.ForeignKey(
        Food, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="+", verbose_name=_("Food"),
    )
    quantity_g = models.DecimalField(
        _("Quantity (g)"), max_digits=7, decimal_places=1, default=100,
        validators=[MinValueValidator(1)],
    )
    calories = models.PositiveIntegerField(_("Calories"), default=0)
    protein_g = models.DecimalField(_("Protein (g)"), max_digits=6, decimal_places=2, default=0)
    carbs_g = models.DecimalField(_("Carbs (g)"), max_digits=6, decimal_places=2, default=0)
    fat_g = models.DecimalField(_("Fat (g)"), max_digits=6, decimal_places=2, default=0)
    water_ml = models.PositiveIntegerField(_("Water (ml)"), default=0)
    notes = models.TextField(_("Notes"), blank=True)

    class Meta:
        verbose_name = _("Nutrition Log")
        verbose_name_plural = _("Nutrition Logs")
        ordering = ["-date"]
        indexes = [models.Index(fields=["client", "-date"])]
