from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import PermissionDenied as DRFPermissionDenied
from django.contrib.auth import get_user_model, authenticate
from rest_framework_simplejwt.tokens import RefreshToken

from .models import TrainerProfile, ClientProfile
from .serializers import UserSerializer, MeSerializer

User = get_user_model()

PROTECTED_USER_FIELDS = {"role", "username", "first_name", "last_name"}

class AuthViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    @action(detail=False, methods=["post"], url_path="login")
    def login(self, request):
        email = (request.data.get("email") or "").strip().lower()
        password = request.data.get("password") or ""
        user = authenticate(request, username=email, password=password) or authenticate(request, email=email, password=password)
        # Fallback: get by email manually
        if user is None:
            try:
                u = User.objects.get(email=email)
                if u.check_password(password):
                    if not u.is_active:
                        return Response({"detail": "الحساب معطل"}, status=401)
                    user = u
                else:
                    return Response({"detail": "بيانات الدخول غير صحيحة"}, status=401)
            except User.DoesNotExist:
                return Response({"detail": "بيانات الدخول غير صحيحة"}, status=401)
        if not user.is_active:
            return Response({"detail": "الحساب معطل"}, status=401)
        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": MeSerializer(user).data,
        })

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated], url_path="me")
    def me(self, request):
        return Response(MeSerializer(request.user).data)

    @action(detail=False, methods=["post"], permission_classes=[IsAuthenticated], url_path="logout")
    def logout(self, request):
        try:
            token = RefreshToken(request.data.get("refresh"))
            token.blacklist()
        except Exception:
            pass
        return Response({"ok": True})

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("-date_joined")
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        u = self.request.user
        if u.is_superuser:
            return User.objects.all().order_by("-date_joined")
        # gym admin sees his gym users
        gym = u.get_gym()
        if gym:
            ids = list(TrainerProfile.objects.filter(gym=gym).values_list("user_id", flat=True)) + \
                  list(ClientProfile.objects.filter(gym=gym).values_list("user_id", flat=True))
            # add gym admin himself
            if hasattr(u, "gym_admin_profile"):
                ids.append(u.id)
            return User.objects.filter(id__in=ids)
        return User.objects.none()

    def perform_update(self, serializer):
        if not self.request.user.is_superuser:
            for f in PROTECTED_USER_FIELDS & set(self.request.data.keys()):
                raise DRFPermissionDenied("تعديل الاسم أو الدور محصور بإدارة المنصة.")
        # handle password
        pwd = self.request.data.get("password")
        user = serializer.save()
        if pwd:
            user.set_password(pwd)
            user.save(update_fields=["password"])

    @action(detail=True, methods=["post"], url_path="reset-password")
    def reset_password(self, request, pk=None):
        if not request.user.is_superuser:
            return Response({"error": "للمنصة فقط"}, status=403)
        user = self.get_object()
        pwd = request.data.get("password") or ""
        if len(pwd) < 8:
            return Response({"error": "كلمة المرور 8+ أحرف"}, status=400)
        user.set_password(pwd)
        user.save(update_fields=["password"])
        return Response({"ok": True})

    @action(detail=True, methods=["post"])
    def toggle_active(self, request, pk=None):
        user = self.get_object()
        if not request.user.is_superuser:
            return Response({"error": "للمنصة فقط"}, status=403)
        user.is_active = not user.is_active
        user.save(update_fields=["is_active"])
        return Response({"is_active": user.is_active})
