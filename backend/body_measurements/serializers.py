from rest_framework import serializers
from .models import BodyMeasurement, ProgressPhoto, Device, DeviceMeasurement


class BodyMeasurementSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.get_full_name', read_only=True)

    class Meta:
        model = BodyMeasurement
        fields = '__all__'


class ProgressPhotoSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.get_full_name', read_only=True)

    class Meta:
        model = ProgressPhoto
        fields = '__all__'


class DeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = '__all__'


class DeviceMeasurementSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceMeasurement
        fields = '__all__'
