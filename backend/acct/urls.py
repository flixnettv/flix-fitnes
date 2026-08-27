from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuthViewSet, UserViewSet

router = DefaultRouter()
router.register(r"users", UserViewSet, basename="user")

auth = AuthViewSet.as_view({"post": "login", "get": "me"})

urlpatterns = [
    path("login/", AuthViewSet.as_view({"post": "login"}), name="auth-login"),
    path("me/", AuthViewSet.as_view({"get": "me"}), name="auth-me"),
    path("logout/", AuthViewSet.as_view({"post": "logout"}), name="auth-logout"),
    path("", include(router.urls)),
]
