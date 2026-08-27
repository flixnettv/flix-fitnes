from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GymViewSet, GymInvitationViewSet, GymPublicViewSet, TrainerAdminViewSet, my_branding, my_branding_update

router = DefaultRouter()
router.register(r'', GymViewSet, basename='gym')
router.register(r'invitations', GymInvitationViewSet, basename='gym-invitation')
router.register(r'public', GymPublicViewSet, basename='gym-public')
router.register(r'trainers-admin', TrainerAdminViewSet, basename='trainer-admin')

urlpatterns = [
    path("my-branding/", my_branding, name="my-branding"),
    path("my-branding/update/", my_branding_update, name="my-branding-update"),
    path("", include(router.urls)),
]
