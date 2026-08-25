"""
Devices App Models - Wearables & smart-scale integrations (ported)
Adapted: fitpro.core -> core, fitpro.gym -> gym_center, fitpro.acct -> acct
"""
import secrets
from datetime import timedelta
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

try:
    from core.models import TenantBaseModel
    HAS_TENANT = True
except ImportError:
    HAS_TENANT = False
    TenantBaseModel = models.Model

def gen_pair_code() -> str:
    return f"{secrets.randbelow(1000000):06d}"

def gen_ingest_token() -> str:
    return secrets.token_urlsafe(32)

if HAS_TENANT:
    class Device(TenantBaseModel):
        KINDS = [("scale", _("Smart Scale")), ("watch", _("Smart Watch")), ("band", _("Fitness Band"))]
        STATUS = [("pending", _("Pending pairing")), ("active", _("Active")), ("revoked", _("Revoked"))]
        client = models.ForeignKey('acct.ClientProfile', on_delete=models.CASCADE, related_name="devices", verbose_name=_("Client"))
        kind = models.CharField(_("Kind"), max_length=10, choices=KINDS, default="scale")
        name = models.CharField(_("Device Name"), max_length=100)
        brand = models.CharField(_("Brand"), max_length=60, blank=True)
        status = models.CharField(_("Status"), max_length=10, choices=STATUS, default="pending")
        pairing_code = models.CharField(_("Pairing Code"), max_length=6, unique=True, default=gen_pair_code)
        code_expires_at = models.DateTimeField(null=True, blank=True)
        ingest_token = models.CharField(_("Ingest Token"), max_length=64, unique=True, default=gen_ingest_token)
        last_sync = models.DateTimeField(_("Last Sync"), null=True, blank=True)

        class Meta:
            verbose_name = _("Device")
            verbose_name_plural = _("Devices")
            ordering = ["-created_at"]
            indexes = [models.Index(fields=["client", "status"])]

        def __str__(self):
            return f"{self.name} ({self.kind}) - {self.status}"

        def issue_code(self):
            self.pairing_code = gen_pair_code()
            self.code_expires_at = timezone.now() + timedelta(minutes=15)
            self.status = "pending"
            self.save(update_fields=["pairing_code", "code_expires_at", "status"])
            return self.pairing_code

        @property
        def code_valid(self):
            return bool(self.code_expires_at and timezone.now() < self.code_expires_at)
else:
    class Device(models.Model):
        id = models.UUIDField(primary_key=True, default=__import__('uuid').uuid4, editable=False)
        gym = models.ForeignKey('gym_center.GymCenter', on_delete=models.CASCADE, null=True, blank=True)
        client = models.ForeignKey('acct.ClientProfile', on_delete=models.CASCADE, related_name="devices")
        kind = models.CharField(max_length=10, choices=[("scale","Scale"),("watch","Watch"),("band","Band")], default="scale")
        name = models.CharField(max_length=100)
        brand = models.CharField(max_length=60, blank=True)
        status = models.CharField(max_length=10, choices=[("pending","Pending"),("active","Active"),("revoked","Revoked")], default="pending")
        pairing_code = models.CharField(max_length=6, unique=True, default=gen_pair_code)
        code_expires_at = models.DateTimeField(null=True, blank=True)
        ingest_token = models.CharField(max_length=64, unique=True, default=gen_ingest_token)
        last_sync = models.DateTimeField(null=True, blank=True)
        created_at = models.DateTimeField(auto_now_add=True)
        updated_at = models.DateTimeField(auto_now=True)
        def issue_code(self):
            self.pairing_code = gen_pair_code()
            self.code_expires_at = timezone.now() + timedelta(minutes=15)
            self.status = "pending"
            self.save(update_fields=["pairing_code", "code_expires_at", "status"])
            return self.pairing_code
        @property
        def code_valid(self):
            return bool(self.code_expires_at and timezone.now() < self.code_expires_at)

class DeviceReading(models.Model):
    METRICS = [("weight_kg", _("Weight (kg)")), ("body_fat", _("Body Fat (%)")), ("bpm", _("Heart Rate")), ("steps", _("Steps")), ("sleep_h", _("Sleep (hours)"))]
    id = models.BigAutoField(primary_key=True)
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name="readings")
    gym_id = models.UUIDField(db_index=True, editable=False, null=True)
    client_id = models.UUIDField(db_index=True, editable=False, null=True)
    metric = models.CharField(_("Metric"), max_length=20, choices=METRICS)
    value = models.DecimalField(_("Value"), max_digits=8, decimal_places=2)
    recorded_at = models.DateTimeField(default=timezone.now, db_index=True)
    class Meta:
        verbose_name = _("Device Reading")
        verbose_name_plural = _("Device Readings")
        ordering = ["-recorded_at"]
        indexes = [models.Index(fields=["device", "metric", "-recorded_at"])]
    def __str__(self):
        return f"{self.device.name} {self.metric}={self.value}"
    def save(self, *args, **kwargs):
        if self.device_id and not self.gym_id:
            try:
                self.gym_id = self.device.gym_id
                self.client_id = self.device.client_id
            except Exception:
                pass
        super().save(*args, **kwargs)
