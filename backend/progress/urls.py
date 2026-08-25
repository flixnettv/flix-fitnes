from rest_framework.routers import DefaultRouter
from .views import ProgressPhotoViewSet, GoalViewSet, WeeklyCheckinViewSet
router = DefaultRouter()
router.register(r"photos", ProgressPhotoViewSet, basename="progress-photo")
router.register(r"goals", GoalViewSet, basename="goal")
router.register(r"checkins", WeeklyCheckinViewSet, basename="checkin")
urlpatterns = router.urls
