from django.contrib import admin
from .models import ClientPlan, WorkoutSession, WorkoutLog

admin.site.register(ClientPlan)
admin.site.register(WorkoutSession)
admin.site.register(WorkoutLog)
