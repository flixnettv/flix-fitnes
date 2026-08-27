"""
Workout App Serializers
"""
from rest_framework import serializers
from workout_tracking.models import Exercise, WorkoutPlan, WorkoutDay, WorkoutExercise, WorkoutLog


class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = ["id", "name", "name_ar", "description", "muscle_group", "equipment",
                  "difficulty", "video_url", "gif_url", "instructions", "is_custom", "is_active"]
        read_only_fields = ["id", "is_custom"]


class WorkoutExerciseSerializer(serializers.ModelSerializer):
    exercise_name = serializers.CharField(source="exercise.name_ar", read_only=True)
    exercise_name_en = serializers.CharField(source="exercise.name", read_only=True)

    class Meta:
        model = WorkoutExercise
        fields = ["id", "exercise", "exercise_name", "exercise_name_en", "order",
                  "sets", "reps", "rest_seconds", "tempo", "notes"]


class WorkoutDaySerializer(serializers.ModelSerializer):
    exercises = WorkoutExerciseSerializer(many=True, read_only=True)

    class Meta:
        model = WorkoutDay
        fields = ["id", "day_number", "name", "notes", "exercises"]


class WorkoutPlanListSerializer(serializers.ModelSerializer):
    trainer_name = serializers.CharField(source="trainer.user.get_full_name", read_only=True)
    days_count = serializers.IntegerField(source="days.count", read_only=True)

    class Meta:
        model = WorkoutPlan
        fields = ["id", "name", "duration_weeks", "days_per_week", "level", "goal",
                  "is_template", "trainer_name", "days_count"]


class WorkoutPlanDetailSerializer(serializers.ModelSerializer):
    days = WorkoutDaySerializer(many=True, read_only=True)
    trainer_name = serializers.CharField(source="trainer.user.get_full_name", read_only=True)
    client_name = serializers.CharField(source="client.user.get_full_name", read_only=True)

    class Meta:
        model = WorkoutPlan
        fields = ["id", "name", "description", "duration_weeks", "days_per_week",
                  "level", "goal", "is_template", "trainer", "trainer_name",
                  "client", "client_name", "days"]


class WorkoutLogSerializer(serializers.ModelSerializer):
    day_name = serializers.CharField(source="day.name", read_only=True)

    class Meta:
        model = WorkoutLog
        fields = ["id", "plan", "day", "day_name", "started_at", "completed_at",
                  "duration_minutes", "status", "notes", "rating", "trainer_feedback"]
        read_only_fields = ["trainer_feedback"]
