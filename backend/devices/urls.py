from rest_framework.routers import DefaultRouter
from .views import DeviceViewSet, DeviceDataViewSet
router = DefaultRouter()
router.register(r"", DeviceViewSet, basename="device")
router.register(r"data", DeviceDataViewSet, basename="device-data")
urlpatterns = router.urls
