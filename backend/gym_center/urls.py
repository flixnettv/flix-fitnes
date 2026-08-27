from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    GymViewSet, GymInvitationViewSet, GymPublicViewSet, TrainerAdminViewSet,
    my_branding, my_branding_update,
    gym_branding_public, gym_members_list, gym_trainers_list, gym_stats, gym_member_create,
    gym_member_update, gym_settings_get, gym_settings_update,
)

router = DefaultRouter()
router.register(r'', GymViewSet, basename='gym')
router.register(r'invitations', GymInvitationViewSet, basename='gym-invitation')
router.register(r'public', GymPublicViewSet, basename='gym-public')
router.register(r'trainers-admin', TrainerAdminViewSet, basename='trainer-admin')

urlpatterns = [
    # Frontend sync endpoints (must be before router to avoid pk conflict)
    path("branding/", gym_branding_public, name="gym-branding-public"),
    path("members/", gym_members_list, name="gym-members-list"),
    path("members/create/", gym_member_create, name="gym-member-create"),
    path("members/<uuid:member_id>/", gym_member_update, name="gym-member-update"),
    path("trainers/", gym_trainers_list, name="gym-trainers-list"),
    path("stats/", gym_stats, name="gym-stats"),
    path("my-settings/", gym_settings_get, name="gym-settings-get"),
    path("my-settings/update/", gym_settings_update, name="gym-settings-update"),
    # Gym admin branding
    path("my-branding/", my_branding, name="my-branding"),
    path("my-branding/update/", my_branding_update, name="my-branding-update"),
    # Router (CRUD)
    path("", include(router.urls)),
]
