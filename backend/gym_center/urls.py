from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GymCenterViewSet, MembershipViewSet, AttendanceViewSet

router = DefaultRouter()
router.register('centers', GymCenterViewSet, basename='gyms')
router.register('memberships', MembershipViewSet, basename='memberships')
router.register('attendance', AttendanceViewSet, basename='attendance')

urlpatterns = [
    path('', include(router.urls)),
]
