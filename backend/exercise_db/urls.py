from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ExerciseCategoryViewSet, MuscleGroupViewSet, EquipmentViewSet,
    ExerciseViewSet, WorkoutPlanViewSet, WorkoutDayViewSet, WorkoutExerciseViewSet,
)

router = DefaultRouter()
router.register('categories', ExerciseCategoryViewSet, basename='categories')
router.register('muscles', MuscleGroupViewSet, basename='muscles')
router.register('equipment', EquipmentViewSet, basename='equipment')
router.register('exercises', ExerciseViewSet, basename='exercises')
router.register('plans', WorkoutPlanViewSet, basename='plans')
router.register('days', WorkoutDayViewSet, basename='days')
router.register('workout-exercises', WorkoutExerciseViewSet, basename='workout_exercises')

urlpatterns = [
    path('', include(router.urls)),
]
