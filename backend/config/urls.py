"""
FitPro URL Configuration - merged.
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve as static_serve
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from core.views import HealthCheckView, ReadinessCheckView

urlpatterns = [
    path("", HealthCheckView.as_view(), name="root"),
    # Health checks (no auth, no tenant middleware)
    path("health/", HealthCheckView.as_view(), name="health-check"),
    path("ready/", ReadinessCheckView.as_view(), name="readiness-check"),
    path("admin/", admin.site.urls),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    # Branding public (no auth)
    path("api/v1/branding/", include("core.branding_urls")),
    # API v1
    path("api/v1/", include([
        path("auth/", include("acct.urls")),
        path("gyms/", include("gym_center.urls")),
        path("workouts/", include("workout_tracking.urls")),
        path("nutrition/", include("nutrition_plan.urls")),
        path("progress/", include("progress.urls")),
        path("measurements/", include("body_measurements.urls")),
        path("exercise-db/", include("exercise_db.urls")),
        path("devices/", include("devices.urls")),
        path("notifications/", include("notif.urls")),
        # Directory + trainer personal tenant + appearance
        path("directory/", include("core.directory_urls")),
        path("branding/", include("core.branding_me_urls")),
    ])),
    # Uploaded media (logos/banners/splash) — also served by nginx in prod
    re_path(r"^media/(?P<path>.*)$", static_serve, {"document_root": settings.MEDIA_ROOT}),
]

if settings.DEBUG:
    import debug_toolbar
    urlpatterns = [
        path("__debug__/", include(debug_toolbar.urls)),
    ] + urlpatterns
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
