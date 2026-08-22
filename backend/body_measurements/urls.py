from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BodyMeasurementViewSet, ProgressPhotoViewSet, DeviceViewSet, DeviceMeasurementViewSet

router = DefaultRouter()
router.register('body', BodyMeasurementViewSet, basename='body_measurements')
router.register('photos', ProgressPhotoViewSet, basename='progress_photos')
router.register('devices', DeviceViewSet, basename='devices')
router.register('device-measurements', DeviceMeasurementViewSet, basename='device_measurements')

urlpatterns = [
    path('', include(router.urls)),
]
