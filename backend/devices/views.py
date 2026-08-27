from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from workout_tracking.views import TenantScopedViewSet
from .models import Device, DeviceData
from .serializers import DeviceSerializer, DeviceDataSerializer

class DeviceViewSet(TenantScopedViewSet):
    serializer_class = DeviceSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["client", "device_type", "status"]
    def get_queryset(self):
        user = self.request.user
        gym = user.get_gym()
        if gym is None:
            return Device.objects.none()
        qs = Device.objects.filter(gym=gym)
        if hasattr(user, "client_profile"):
            return qs.filter(client=user.client_profile)
        if hasattr(user, "trainer_profile"):
            return qs.filter(client__trainer=user.trainer_profile)
        return qs
    def perform_create(self, serializer):
        gym = self.get_gym()
        client_id = self.request.data.get("client")
        from acct.models import ClientProfile
        client = None
        if hasattr(self.request.user, "client_profile"):
            client = self.request.user.client_profile
        elif client_id:
            client = ClientProfile.objects.filter(id=client_id, gym=gym).first()
        serializer.save(gym=gym, client=client)

class DeviceDataViewSet(TenantScopedViewSet):
    serializer_class = DeviceDataSerializer
    def get_queryset(self):
        gym = self.get_gym()
        if gym is None:
            return DeviceData.objects.none()
        qs = DeviceData.objects.filter(gym=gym)
        if hasattr(self.request.user, "client_profile"):
            return qs.filter(device__client=self.request.user.client_profile)
        return qs
