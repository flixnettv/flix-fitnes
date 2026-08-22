from rest_framework import serializers
from .models import GymCenter, Membership, Attendance


class GymCenterSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)

    class Meta:
        model = GymCenter
        fields = '__all__'


class MembershipSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.get_full_name', read_only=True)
    coach_name = serializers.CharField(source='coach.get_full_name', read_only=True, default='')
    gym_name = serializers.CharField(source='gym.__str__', read_only=True)

    class Meta:
        model = Membership
        fields = '__all__'


class AttendanceSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.get_full_name', read_only=True)

    class Meta:
        model = Attendance
        fields = '__all__'
