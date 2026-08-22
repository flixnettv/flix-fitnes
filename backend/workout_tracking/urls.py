from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClientPlanViewSet, WorkoutSessionViewSet, WorkoutLogViewSet

router = DefaultRouter()
router.register('client-plans', ClientPlanViewSet, basename='client_plans')
router.register('sessions', WorkoutSessionViewSet, basename='sessions')
router.register('logs', WorkoutLogViewSet, basename='logs')

urlpatterns = [
    path('', include(router.urls)),
]
