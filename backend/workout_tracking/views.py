from rest_framework import viewsets
from .models import ClientPlan, WorkoutSession, WorkoutLog
from .serializers import ClientPlanSerializer, WorkoutSessionSerializer, WorkoutSessionListSerializer, WorkoutLogSerializer


class ClientPlanViewSet(viewsets.ModelViewSet):
    serializer_class = ClientPlanSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'owner':
            return ClientPlan.objects.all()
        elif user.role == 'coach':
            return ClientPlan.objects.filter(coach=user)
        return ClientPlan.objects.filter(client=user)

    def perform_create(self, serializer):
        serializer.save(coach=self.request.user)


class WorkoutSessionViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        user = self.request.user
        if user.role in ('owner', 'coach'):
            return WorkoutSession.objects.all()
        return WorkoutSession.objects.filter(client=user)

    def get_serializer_class(self):
        if self.action == 'list':
            return WorkoutSessionListSerializer
        return WorkoutSessionSerializer

    def perform_create(self, serializer):
        serializer.save(client=self.request.user)


class WorkoutLogViewSet(viewsets.ModelViewSet):
    queryset = WorkoutLog.objects.all()
    serializer_class = WorkoutLogSerializer
