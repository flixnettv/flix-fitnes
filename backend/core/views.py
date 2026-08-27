from django.http import JsonResponse
from django.views import View
from django.db import connection

class HealthCheckView(View):
    def get(self, request):
        return JsonResponse({"status": "ok", "service": "fitpro"}, status=200)

class ReadinessCheckView(View):
    def get(self, request):
        try:
            connection.ensure_connection()
            db_ok = True
        except Exception:
            db_ok = False
        status = 200 if db_ok else 503
        return JsonResponse({"ready": db_ok, "db": db_ok}, status=status)
