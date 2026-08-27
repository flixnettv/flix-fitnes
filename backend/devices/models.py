"""
Devices app - migrated from source devices.
Tracks wearable / scale / gym hardware paired to a client.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import TenantBaseModel

class Device(TenantBaseModel):
    DEVICE_TYPES = [
        ("watch", _("Smart Watch")),
        ("scale", _("Smart Scale")),
        ("band", _("Fitness Band")),
        ("machine", _("Gym Machine")),
        ("other", _("Other")),
    ]
    STATUS = [
        ("paired", _("Paired")),
        ("pending", _("Pending")),
        ("disconnected", _("Disconnected")),
    ]
    client = models.ForeignKey("acct.ClientProfile", on_delete=models.CASCADE, related_name="devices", verbose_name=_("Client"))
    name = models.CharField(_("Device Name"), max_length=120)
    device_type = models.CharField(_("Type"), max_length=20, choices=DEVICE_TYPES, default="watch")
    identifier = models.CharField(_("Identifier / MAC"), max_length=100, blank=True)
    status = models.CharField(_("Status"), max_length=20, choices=STATUS, default="pending")
    last_sync = models.DateTimeField(_("Last Sync"), null=True, blank=True)
    metadata = models.JSONField(_("Metadata"), default=dict, blank=True)

    class Meta:
        verbose_name = _("Device")
        verbose_name_plural = _("Devices")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.client})"

class DeviceData(TenantBaseModel):
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name="data_points")
    kind = models.CharField(_("Kind"), max_length=30, help_text=_("steps, heart_rate, weight, etc."))
    value = models.FloatField(_("Value"))
    recorded_at = models.DateTimeField(_("Recorded At"))
    raw = models.JSONField(_("Raw Payload"), default=dict, blank=True)

    class Meta:
        ordering = ["-recorded_at"]
        indexes = [models.Index(fields=["device", "-recorded_at"])]
