from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from workout_tracking.views import TenantScopedViewSet
from .models import BodyMeasurement
from .serializers import BodyMeasurementSerializer

class BodyMeasurementViewSet(TenantScopedViewSet):
    serializer_class = BodyMeasurementSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["client", "date"]
    ordering_fields = ["date", "weight_kg"]

    def get_queryset(self):
        user = self.request.user
        gym = user.get_gym()
        if gym is None:
            return BodyMeasurement.objects.none()
        qs = BodyMeasurement.objects.filter(gym=gym)
        if hasattr(user, "client_profile"):
            return qs.filter(client=user.client_profile)
        if hasattr(user, "trainer_profile"):
            return qs.filter(client__trainer=user.trainer_profile)
        return qs

    def perform_create(self, serializer):
        gym = self.get_gym()
        client = getattr(self.request.user, "client_profile", None)
        if client is None and gym:
            client_id = self.request.data.get("client")
            if client_id:
                from acct.models import ClientProfile
                client = ClientProfile.objects.filter(id=client_id, gym=gym).first()
        serializer.save(gym=gym, client=client)
