from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, CoachProfile


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'assigned_coach', 'is_active')
    list_filter = ('role', 'is_active', 'gender')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('معلومات إضافية', {
            'fields': ('role', 'phone', 'avatar', 'birthdate', 'gender', 'height_cm', 'bio')
        }),
        ('المدرب', {
            'fields': ('specializations', 'experience_years'),
        }),
        ('العميل', {
            'fields': ('assigned_coach', 'medical_notes', 'goals'),
        }),
    )


@admin.register(CoachProfile)
class CoachProfileAdmin(admin.ModelAdmin):
    list_display = ('display_name', 'slug', 'user', 'primary_color', 'is_active')
    list_filter = ('is_active',)
    prepopulated_fields = {'slug': ('display_name',)}
