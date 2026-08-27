"""
Progress App Serializers
"""
from rest_framework import serializers
from progress.models import ProgressPhoto, Goal, WeeklyCheckin


class ProgressPhotoSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source="client.user.get_full_name", read_only=True)

    class Meta:
        model = ProgressPhoto
        fields = ["id", "photo", "photo_type", "weight_kg", "body_fat_percent",
                  "notes", "is_private", "client_name", "created_at"]
        read_only_fields = ["id", "created_at"]


class GoalSerializer(serializers.ModelSerializer):
    progress_percent = serializers.IntegerField(read_only=True)

    class Meta:
        model = Goal
        fields = ["id", "title", "goal_type", "target_value", "current_value",
                  "unit", "start_date", "target_date", "status",
                  "progress_percent", "trainer_notes"]

    def update(self, instance, validated_data):
        # Only trainers can set status/notes; clients update current_value
        user = self.context["request"].user
        if hasattr(user, "trainer_profile") or user.is_superuser:
            return super().update(instance, validated_data)
        allowed = {"current_value"}
        for field in list(validated_data.keys()):
            if field not in allowed:
                validated_data.pop(field)
        return super().update(instance, validated_data)


class WeeklyCheckinSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source="client.user.get_full_name", read_only=True)

    class Meta:
        model = WeeklyCheckin
        fields = ["id", "week_start", "weight_kg", "body_fat_percent", "measurements",
                  "energy_level", "sleep_quality", "stress_level", "adherence",
                  "client_notes", "trainer_feedback", "next_week_adjustments", "client_name"]
        read_only_fields = ["trainer_feedback", "next_week_adjustments"]
