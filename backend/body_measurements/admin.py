from django.contrib import admin
from .models import BodyMeasurement, ProgressPhoto, Device, DeviceMeasurement

admin.site.register(BodyMeasurement)
admin.site.register(ProgressPhoto)
admin.site.register(Device)
admin.site.register(DeviceMeasurement)
