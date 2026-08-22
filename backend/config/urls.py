from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from django.http import JsonResponse

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('acct.urls')),
    path('api/exercises/', include('exercise_db.urls')),
    path('api/workouts/', include('workout_tracking.urls')),
    path('api/nutrition/', include('nutrition_plan.urls')),
    path('api/measurements/', include('body_measurements.urls')),
    path('api/gym/', include('gym_center.urls')),
    path('api/notifications/', include('notif.urls')),
    # API docs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    # Health check
    path('health/', lambda request: JsonResponse({'status': 'ok'}), name='health'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
