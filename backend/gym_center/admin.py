from django.contrib import admin
from .models import GymCenter, Membership, Attendance

admin.site.register(GymCenter)
admin.site.register(Membership)
admin.site.register(Attendance)
