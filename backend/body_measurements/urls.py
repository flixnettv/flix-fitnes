from rest_framework.routers import DefaultRouter
from .views import BodyMeasurementViewSet
router = DefaultRouter()
router.register(r"", BodyMeasurementViewSet, basename="body-measurement")
urlpatterns = router.urls
