"""
FitPro Core Models - Multi-tenancy Foundation (ported from fitpro.core.models)
Adapted: gym reference -> gym_center.GymCenter
Fixed related_name to avoid clashes across apps
"""
import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.db.models.signals import pre_save
from django.dispatch import receiver


class TenantBaseModel(models.Model):
    """
    Abstract base model for all tenant-scoped models.
    Automatically adds gym (FK) and tenant_id fields for RLS.
    Adapted from fitpro.core.models.TenantBaseModel
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    gym = models.ForeignKey(
        'gym_center.GymCenter',
        on_delete=models.CASCADE,
        related_name='%(app_label)s_%(class)s_set',
        verbose_name='Gym',
        null=True,
        blank=True,
    )
    tenant_id = models.UUIDField(
        editable=False,
        db_index=True,
        null=True,
        blank=True,
        verbose_name='Tenant ID'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Created At')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Updated At')
    is_active = models.BooleanField(default=True, verbose_name='Is Active')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='%(app_label)s_%(class)s_created',
        verbose_name='Created By'
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='%(app_label)s_%(class)s_updated',
        verbose_name='Updated By'
    )

    class Meta:
        abstract = True
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if self.gym_id and not self.tenant_id:
            self.tenant_id = self.gym_id
        super().save(*args, **kwargs)


class ActivationMixin(models.Model):
    """Mixin for models that require manual activation."""
    is_active = models.BooleanField(default=False, verbose_name='Is Active')
    activated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='%(app_label)s_%(class)s_activated',
        verbose_name='Activated By'
    )
    activated_at = models.DateTimeField(null=True, blank=True, verbose_name='Activated At')

    class Meta:
        abstract = True

    def activate(self, user):
        self.is_active = True
        self.activated_by = user
        self.activated_at = timezone.now()
        self.save(update_fields=['is_active', 'activated_by', 'activated_at'])

    def deactivate(self):
        self.is_active = False
        self.save(update_fields=['is_active'])

    @property
    def is_activated(self):
        return self.is_active and self.activated_at is not None


class TimeStampedMixin(models.Model):
    """Adds created_at and updated_at fields."""
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Created At')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Updated At')

    class Meta:
        abstract = True


class SoftDeleteMixin(models.Model):
    """Adds soft delete capability."""
    deleted_at = models.DateTimeField(null=True, blank=True, verbose_name='Deleted At')
    deleted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='%(app_label)s_%(class)s_deleted',
        verbose_name='Deleted By'
    )

    class Meta:
        abstract = True

    def soft_delete(self, user=None):
        self.deleted_at = timezone.now()
        self.deleted_by = user
        self.is_active = False
        self.save(update_fields=['deleted_at', 'deleted_by', 'is_active'])

    def restore(self):
        self.deleted_at = None
        self.deleted_by = None
        self.is_active = True
        self.save(update_fields=['deleted_at', 'deleted_by', 'is_active'])

    @property
    def is_deleted(self):
        return self.deleted_at is not None


@receiver(pre_save)
def set_tenant_id(sender, instance, **kwargs):
    if hasattr(instance, 'gym_id') and instance.gym_id and not getattr(instance, 'tenant_id', None):
        try:
            instance.tenant_id = instance.gym_id
        except Exception:
            pass
