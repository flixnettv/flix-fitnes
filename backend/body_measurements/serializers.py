from rest_framework import serializers
from .models import BodyMeasurement

class BodyMeasurementSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source="client.user.get_full_name", read_only=True)
    class Meta:
        model = BodyMeasurement
        fields = ["id", "client", "client_name", "date", "weight_kg", "body_fat_percent", "muscle_mass_kg",
                  "measurements", "chest_cm", "waist_cm", "hips_cm", "arm_cm", "thigh_cm", "notes", "created_at"]
        read_only_fields = ["id", "created_at"]
