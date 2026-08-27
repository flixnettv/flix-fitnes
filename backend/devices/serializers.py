from rest_framework import serializers
from .models import Device, DeviceData

class DeviceSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source="client.user.get_full_name", read_only=True)
    class Meta:
        model = Device
        fields = ["id", "client", "client_name", "name", "device_type", "identifier", "status", "last_sync", "metadata", "created_at"]
        read_only_fields = ["id", "created_at"]

class DeviceDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceData
        fields = ["id", "device", "kind", "value", "recorded_at", "raw", "created_at"]
        read_only_fields = ["id", "created_at"]
