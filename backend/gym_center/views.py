from rest_framework import viewsets
from .models import GymCenter, Membership, Attendance
from .serializers import GymCenterSerializer, MembershipSerializer, AttendanceSerializer


class GymCenterViewSet(viewsets.ModelViewSet):
    serializer_class = GymCenterSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'owner':
            return GymCenter.objects.filter(owner=user)
        return GymCenter.objects.all()

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class MembershipViewSet(viewsets.ModelViewSet):
    serializer_class = MembershipSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'owner':
            return Membership.objects.all()
        elif user.role == 'coach':
            return Membership.objects.filter(coach=user)
        return Membership.objects.filter(client=user)

    def perform_create(self, serializer):
        serializer.save(activated_by=self.request.user)


class AttendanceViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role in ('owner', 'coach'):
            return Attendance.objects.all()
        return Attendance.objects.filter(client=user)
