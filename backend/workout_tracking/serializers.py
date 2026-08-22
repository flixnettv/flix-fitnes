from rest_framework import serializers
from .models import ClientPlan, WorkoutSession, WorkoutLog


class WorkoutLogSerializer(serializers.ModelSerializer):
    exercise_name = serializers.CharField(source='exercise.__str__', read_only=True)

    class Meta:
        model = WorkoutLog
        fields = '__all__'


class WorkoutSessionSerializer(serializers.ModelSerializer):
    logs = WorkoutLogSerializer(many=True, read_only=True)
    client_name = serializers.CharField(source='client.get_full_name', read_only=True)
    day_name = serializers.CharField(source='day.name', read_only=True, default='')

    class Meta:
        model = WorkoutSession
        fields = '__all__'


class WorkoutSessionListSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.get_full_name', read_only=True)

    class Meta:
        model = WorkoutSession
        fields = ['id', 'client', 'client_name', 'date', 'start_time', 'end_time', 'rating', 'notes']


class ClientPlanSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.get_full_name', read_only=True)
    coach_name = serializers.CharField(source='coach.get_full_name', read_only=True)
    plan_name = serializers.CharField(source='plan.__str__', read_only=True)

    class Meta:
        model = ClientPlan
        fields = '__all__'
