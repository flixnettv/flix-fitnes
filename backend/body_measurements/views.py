from rest_framework import viewsets
from .models import BodyMeasurement, ProgressPhoto, Device, DeviceMeasurement
from .serializers import BodyMeasurementSerializer, ProgressPhotoSerializer, DeviceSerializer, DeviceMeasurementSerializer


class BodyMeasurementViewSet(viewsets.ModelViewSet):
    serializer_class = BodyMeasurementSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role in ('owner', 'coach'):
            return BodyMeasurement.objects.all()
        return BodyMeasurement.objects.filter(client=user)

    def perform_create(self, serializer):
        serializer.save(client=self.request.user)


class ProgressPhotoViewSet(viewsets.ModelViewSet):
    serializer_class = ProgressPhotoSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role in ('owner', 'coach'):
            return ProgressPhoto.objects.all()
        return ProgressPhoto.objects.filter(client=user)

    def perform_create(self, serializer):
        serializer.save(client=self.request.user)


class DeviceViewSet(viewsets.ModelViewSet):
    serializer_class = DeviceSerializer

    def get_queryset(self):
        return Device.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class DeviceMeasurementViewSet(viewsets.ModelViewSet):
    serializer_class = DeviceMeasurementSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role in ('owner', 'coach'):
            return DeviceMeasurement.objects.all()
        return DeviceMeasurement.objects.filter(user=user)
