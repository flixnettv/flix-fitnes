from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    RegisterView, UserProfileView, UserListView,
    OwnerCoachViewSet, OwnerStatsView,
    CoachPublicView, CoachClientRegisterView, CoachStatsView,
)

router = DefaultRouter()
router.register('users', UserListView, basename='users')

owner_router = DefaultRouter()
owner_router.register('coaches', OwnerCoachViewSet, basename='owner_coaches')

urlpatterns = [
    # Auth
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', UserProfileView.as_view(), name='user_profile'),

    # Owner admin
    path('owner/', include(owner_router.urls)),
    path('owner/stats/', OwnerStatsView.as_view(), name='owner_stats'),

    # Coach stats
    path('coach/stats/', CoachStatsView.as_view(), name='coach_stats'),

    # Public
    path('public/coach/<slug:slug>/', CoachPublicView.as_view(), name='coach_public'),
    path('public/coach/<slug:slug>/register/', CoachClientRegisterView.as_view(), name='coach_client_register'),

    # Users (default)
    path('', include(router.urls)),
]
