from django.contrib import admin
from .models import ExerciseCategory, MuscleGroup, Equipment, Exercise, WorkoutPlan, WorkoutDay, WorkoutExercise

admin.site.register(ExerciseCategory)
admin.site.register(MuscleGroup)
admin.site.register(Equipment)
admin.site.register(Exercise)
admin.site.register(WorkoutPlan)
admin.site.register(WorkoutDay)
admin.site.register(WorkoutExercise)
