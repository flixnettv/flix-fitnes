from rest_framework.routers import DefaultRouter
from .views import ExerciseCatalogViewSet
router = DefaultRouter()
router.register(r"", ExerciseCatalogViewSet, basename="exercise-catalog")
urlpatterns = router.urls
