"""
Workout App URLs
"""
from rest_framework.routers import DefaultRouter
from workout_tracking.views import (
    ExerciseViewSet, WorkoutPlanViewSet, WorkoutLogViewSet,
    WorkoutDayViewSet, WorkoutExerciseViewSet,
)

router = DefaultRouter()
router.register(r"exercises", ExerciseViewSet, basename="exercise")
router.register(r"plans", WorkoutPlanViewSet, basename="workout-plan")
router.register(r"logs", WorkoutLogViewSet, basename="workout-log")
router.register(r"days", WorkoutDayViewSet, basename="workout-day")
router.register(r"plan-exercises", WorkoutExerciseViewSet, basename="workout-exercise")

urlpatterns = router.urls
