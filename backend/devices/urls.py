from django.urls import path
from . import views
urlpatterns = [
    path("pair/start/", views.pair_start),
    path("mine/", views.mine),
    path("<uuid:device_id>/", views.unpair),
    path("metrics/", views.metrics),
    path("confirm/<str:code>/", views.confirm),
    path("ingest/<str:token>/", views.ingest),
]
