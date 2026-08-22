from rest_framework import viewsets, permissions
from .models import ExerciseCategory, MuscleGroup, Equipment, Exercise, WorkoutPlan, WorkoutDay, WorkoutExercise
from .serializers import (
    ExerciseCategorySerializer, MuscleGroupSerializer, EquipmentSerializer,
    ExerciseSerializer, ExerciseListSerializer, WorkoutPlanSerializer,
    WorkoutPlanListSerializer, WorkoutDaySerializer, WorkoutExerciseSerializer,
)


class ExerciseCategoryViewSet(viewsets.ModelViewSet):
    queryset = ExerciseCategory.objects.all()
    serializer_class = ExerciseCategorySerializer


class MuscleGroupViewSet(viewsets.ModelViewSet):
    queryset = MuscleGroup.objects.all()
    serializer_class = MuscleGroupSerializer


class EquipmentViewSet(viewsets.ModelViewSet):
    queryset = Equipment.objects.all()
    serializer_class = EquipmentSerializer


class ExerciseViewSet(viewsets.ModelViewSet):
    queryset = Exercise.objects.select_related('category').prefetch_related('primary_muscles', 'secondary_muscles', 'equipment')

    def get_serializer_class(self):
        if self.action == 'list':
            return ExerciseListSerializer
        return ExerciseSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        category = self.request.query_params.get('category')
        muscle = self.request.query_params.get('muscle')
        difficulty = self.request.query_params.get('difficulty')
        equipment = self.request.query_params.get('equipment')
        search = self.request.query_params.get('search')

        if category:
            qs = qs.filter(category_id=category)
        if muscle:
            qs = qs.filter(primary_muscles__id=muscle)
        if difficulty:
            qs = qs.filter(difficulty=difficulty)
        if equipment:
            qs = qs.filter(equipment__id=equipment)
        if search:
            qs = qs.filter(name__icontains=search) | qs.filter(name_ar__icontains=search)
        return qs.distinct()


class WorkoutPlanViewSet(viewsets.ModelViewSet):
    serializer_class = WorkoutPlanSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'owner':
            return WorkoutPlan.objects.all()
        elif user.role == 'coach':
            return WorkoutPlan.objects.filter(coach=user)
        return WorkoutPlan.objects.none()

    def get_serializer_class(self):
        if self.action == 'list':
            return WorkoutPlanListSerializer
        return WorkoutPlanSerializer

    def perform_create(self, serializer):
        serializer.save(coach=self.request.user)


class WorkoutDayViewSet(viewsets.ModelViewSet):
    queryset = WorkoutDay.objects.all()
    serializer_class = WorkoutDaySerializer

    def get_queryset(self):
        qs = super().get_queryset()
        plan_id = self.request.query_params.get('plan')
        if plan_id:
            qs = qs.filter(plan_id=plan_id)
        return qs


class WorkoutExerciseViewSet(viewsets.ModelViewSet):
    queryset = WorkoutExercise.objects.all()
    serializer_class = WorkoutExerciseSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        day_id = self.request.query_params.get('day')
        if day_id:
            qs = qs.filter(day_id=day_id)
        return qs
