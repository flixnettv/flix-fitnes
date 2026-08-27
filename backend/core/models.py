"""
Core TenantBase and mixins - nullable gym (multi-tenant safe).
"""
import uuid
from django.db import models
from django.conf import settings


class TimeStampedMixin(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class ActivationMixin(models.Model):
    is_active = models.BooleanField(default=True)

    class Meta:
        abstract = True


class TenantBaseModel(TimeStampedMixin, models.Model):
    """
    Base for all tenant-scoped models.
    - gym FK is nullable to allow makemigrations without breaking existing data
      and to support platform-level objects (e.g. templates) that may not yet be assigned.
    - created_by tracks creator.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # gym nullable -> requirement #6
    gym = models.ForeignKey(
        "gym_center.Gym",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="%(class)s_set",
    )
    tenant_id = models.UUIDField(null=True, blank=True, help_text="Tenant copy of gym id for sharding")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="%(class)s_created",
    )

    class Meta:
        abstract = True
