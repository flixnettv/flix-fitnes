from rest_framework import serializers
from .models import ExerciseCatalog
class ExerciseCatalogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExerciseCatalog
        fields = ["id", "name", "name_ar", "description", "muscle_group", "equipment", "difficulty", "video_url", "gif_url", "instructions", "is_verified"]
        read_only_fields = ["id"]
