from rest_framework import serializers
from .models import ExerciseCategory, MuscleGroup, Equipment, Exercise, WorkoutPlan, WorkoutDay, WorkoutExercise


class ExerciseCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExerciseCategory
        fields = '__all__'


class MuscleGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = MuscleGroup
        fields = '__all__'


class EquipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Equipment
        fields = '__all__'


class ExerciseSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.__str__', read_only=True)
    primary_muscles_names = serializers.SerializerMethodField()
    secondary_muscles_names = serializers.SerializerMethodField()

    class Meta:
        model = Exercise
        fields = '__all__'

    def get_primary_muscles_names(self, obj):
        return [m.name for m in obj.primary_muscles.all()]

    def get_secondary_muscles_names(self, obj):
        return [m.name for m in obj.secondary_muscles.all()]


class ExerciseListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.__str__', read_only=True)

    class Meta:
        model = Exercise
        fields = ['id', 'name', 'name_ar', 'category', 'category_name', 'difficulty', 'image', 'video_url']


class WorkoutExerciseSerializer(serializers.ModelSerializer):
    exercise_name = serializers.CharField(source='exercise.__str__', read_only=True)

    class Meta:
        model = WorkoutExercise
        fields = '__all__'


class WorkoutDaySerializer(serializers.ModelSerializer):
    exercises = WorkoutExerciseSerializer(many=True, read_only=True)

    class Meta:
        model = WorkoutDay
        fields = '__all__'


class WorkoutPlanSerializer(serializers.ModelSerializer):
    days = WorkoutDaySerializer(many=True, read_only=True)
    coach_name = serializers.CharField(source='coach.get_full_name', read_only=True)

    class Meta:
        model = WorkoutPlan
        fields = '__all__'


class WorkoutPlanListSerializer(serializers.ModelSerializer):
    coach_name = serializers.CharField(source='coach.get_full_name', read_only=True)
    days_count = serializers.SerializerMethodField()

    class Meta:
        model = WorkoutPlan
        fields = ['id', 'name', 'coach', 'coach_name', 'difficulty', 'duration_weeks', 'is_template', 'days_count', 'created_at']

    def get_days_count(self, obj):
        return obj.days.count()
