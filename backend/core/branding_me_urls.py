from django.urls import path
from .branding import my_appearance, my_appearance_update
urlpatterns = [
    path("my-appearance/", my_appearance, name="my-appearance"),
    path("my-appearance/update/", my_appearance_update, name="my-appearance-update"),
]
