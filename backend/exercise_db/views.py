from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAuthenticated
from .models import ExerciseCatalog
from .serializers import ExerciseCatalogSerializer

class ExerciseCatalogViewSet(viewsets.ModelViewSet):
    queryset = ExerciseCatalog.objects.all()
    serializer_class = ExerciseCatalogSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["muscle_group", "equipment", "difficulty"]
    search_fields = ["name", "name_ar"]
