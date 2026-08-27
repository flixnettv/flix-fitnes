from django.urls import path
from .branding import branding
urlpatterns = [
    path("", branding, name="public-branding"),
]
