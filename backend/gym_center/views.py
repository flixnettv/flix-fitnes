import re
from django.utils.translation import gettext_lazy as _
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend

from .models import Gym, GymInvitation
from .serializers import GymSerializer, GymInvitationSerializer, GymPublicSerializer
from core.permissions import IsSuperAdmin

PROTECTED_GYM_FIELDS = {"name", "slug", "kind"}

class GymViewSet(viewsets.ModelViewSet):
    queryset = Gym.objects.all()
    serializer_class = GymSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["kind", "is_active", "city"]
    search_fields = ["name", "slug", "city"]

    def get_queryset(self):
        u = self.request.user
        if u.is_superuser:
            return Gym.objects.all()
        gym = u.get_gym()
        if gym:
            return Gym.objects.filter(id=gym.id)
        return Gym.objects.none()

    def perform_create(self, serializer):
        gym = serializer.save(created_by=self.request.user)
        # Auto-create the gym's admin account when credentials provided
        admin_email = (self.request.data.get("admin_email") or "").strip().lower()
        admin_password = self.request.data.get("admin_password") or ""
        if admin_email:
            import uuid as _uuid
            from django.contrib.auth import get_user_model
            from acct.models import GymAdminProfile
            U = get_user_model()
            if U.objects.filter(email=admin_email).exists():
                raise ValidationError({"admin_email": "البريد مستخدم مسبقاً"})
            username = re.sub(r"[^a-z0-9_]", "", admin_email.split("@")[0]) or ("adm" + _uuid.uuid4().hex[:6])
            while U.objects.filter(username=username).exists():
                username += _uuid.uuid4().hex[:2]
            admin = U.objects.create_user(
                username=username, email=admin_email,
                password=admin_password or "GymAdmin2026!",
                first_name=gym.name[:30], role="gym_admin",
            )
            GymAdminProfile.objects.create(user=admin, gym=gym)
        # sync branding cache stub
        # from core.branding import sync_dynamic_entries
        # sync_dynamic_entries()

    def perform_update(self, serializer):
        if not self.request.user.is_superuser:
            data = self.request.data
            for f in PROTECTED_GYM_FIELDS.intersection(data.keys()):
                return Response(
                    {'detail': _('تغيير الاسم/الدومين محصور بإدارة المنصة.')},
                    status=status.HTTP_403_FORBIDDEN
                )
        serializer.save()

    @action(detail=True, methods=['post'], permission_classes=[IsSuperAdmin])
    def activate(self, request, pk=None):
        gym = self.get_object()
        gym.is_active = True
        gym.save(update_fields=["is_active"])
        return Response({"is_active": True})

    @action(detail=True, methods=['post'], permission_classes=[IsSuperAdmin])
    def deactivate(self, request, pk=None):
        gym = self.get_object()
        gym.is_active = False
        gym.save(update_fields=["is_active"])
        return Response({"is_active": False})

class GymInvitationViewSet(viewsets.ModelViewSet):
    queryset = GymInvitation.objects.all()
    serializer_class = GymInvitationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        gym = self.request.user.get_gym()
        if gym:
            return GymInvitation.objects.filter(gym=gym)
        return GymInvitation.objects.none()

    def perform_create(self, serializer):
        serializer.save(gym=self.request.user.get_gym())

class GymPublicViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Gym.objects.filter(is_active=True)
    serializer_class = GymPublicSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "slug"

# ---------------- gym-admin self branding editor ----------------
BRANDABLE_FIELDS = [
    "name", "description",
    "primary_color", "secondary_color", "accent_color",
    "background_color", "surface_color",
    "font_family", "font_weight_regular", "font_weight_medium", "font_weight_bold",
    "splash_title", "splash_tagline", "splash_style",
    "meta_title", "meta_description",
    "contact_email", "contact_phone", "city",
    "instagram_url", "twitter_url", "website_url",
]

COLOR_RE = re.compile(r"^#[0-9a-fA-F]{6}$")


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_branding(request):
    """Full branding of the caller's gym (gym admin sees own; others read-only)."""
    gym = request.user.get_gym()
    if gym is None:
        return Response({"error": "no gym"}, status=400)
    data = {f: getattr(gym, f) for f in BRANDABLE_FIELDS}
    data.update({
        "slug": gym.slug,
        "subdomain": f"{gym.slug}.fitpro.hftv.qzz.io" if gym.slug else "",
        "logo": request.build_absolute_uri(gym.logo.url) if gym.logo else None,
        "favicon": request.build_absolute_uri(gym.favicon.url) if gym.favicon else None,
        "is_owner": hasattr(request.user, "gym_admin_profile") or request.user.is_superuser,
    })
    return Response(data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def my_branding_update(request):
    """Gym admin updates ONLY branding/splash fields of his own gym."""
    if not (hasattr(request.user, "gym_admin_profile") or request.user.is_superuser):
        return Response({"error": "صلاحيات مدير الصالة مطلوبة"}, status=403)
    gym = request.user.get_gym()
    if gym is None:
        return Response({"error": "no gym"}, status=400)

    changed = []
    for f in BRANDABLE_FIELDS:
        if f not in request.data:
            continue
        val = request.data[f]
        if f.endswith("_color"):
            if not (isinstance(val, str) and COLOR_RE.match(val)):
                return Response({"error": f"{f}: لون غير صالح"}, status=400)
        if f == "font_family":
            allowed = {"Cairo", "Tajawal", "Changa", "IBM Plex Sans Arabic", "Space Grotesk"}
            if val not in allowed:
                return Response({"error": "خط غير مدعوم"}, status=400)
        if isinstance(val, str):
            val = val.strip()
        setattr(gym, f, val)
        changed.append(f)
    # handle image uploads
    for img in ["logo", "banner", "background_image", "splash_image", "favicon"]:
        if img in request.FILES:
            setattr(gym, img, request.FILES[img])
            changed.append(img)
        elif img in request.data and request.data.get(img) in [None, "", "null"]:
            setattr(gym, img, None)
            changed.append(img+":cleared")
    gym.save()
    return Response({"ok": True, "changed": changed})


# Trainer admin ViewSet (platform admin + gym admin scoped)
from rest_framework.decorators import action as _action
from .serializers import TrainerAdminSerializer
from acct.models import TrainerProfile

class TrainerAdminViewSet(viewsets.ModelViewSet):
    """Manage trainer accounts. Platform admin: all. Gym admin: his gym."""
    queryset = TrainerProfile.objects.select_related("user", "gym")
    serializer_class = TrainerAdminSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        u = self.request.user
        if u.is_superuser:
            return self.queryset
        if hasattr(u, "gym_admin_profile"):
            return self.queryset.filter(gym=u.gym_admin_profile.gym)
        return self.queryset.none()

    def perform_create(self, serializer):
        import uuid as _uuid
        import re as _re
        from django.contrib.auth import get_user_model
        U = get_user_model()
        data = self.request.data
        email = (data.get("email") or "").strip().lower()
        if not email:
            raise ValidationError({"email": "مطلوب"})
        if U.objects.filter(email=email).exists():
            raise ValidationError({"email": "مستخدم مسبقاً"})
        gym = self.request.user.get_gym()
        if gym is None and self.request.user.is_superuser:
            gid = data.get("gym")
            gym = Gym.objects.filter(id=gid).first() if gid else None
        if gym is None:
            raise ValidationError({"gym": "اختر صالة"})
        username = _re.sub(r"[^a-z0-9_]", "", email.split("@")[0]) or ("tr" + _uuid.uuid4().hex[:6])
        while U.objects.filter(username=username).exists():
            username += _uuid.uuid4().hex[:2]
        user = U.objects.create_user(
            username=username, email=email,
            password=data.get("password") or "Trainer2026!",
            first_name=data.get("first_name") or data.get("name") or "",
            last_name=data.get("last_name") or "", role="trainer",
        )
        serializer.save(
            user=user, gym=gym,
            employee_id=data.get("employee_id") or ("TR-" + _uuid.uuid4().hex[:6].upper()),
        )

    def perform_destroy(self, instance):
        if not self.request.user.is_superuser:
            raise ValidationError({"error": "الحذف النهائي لإدارة المنصة"})
        user = instance.user
        instance.delete()
        user.delete()

    @_action(detail=True, methods=["post"], url_path="reset-password")
    def reset_password(self, request, pk=None):
        trainer = self.get_object()
        pwd = request.data.get("password") or ""
        if len(pwd) < 8:
            return Response({"error": "كلمة المرور 8+ أحرف"}, status=400)
        trainer.user.set_password(pwd)
        trainer.user.save(update_fields=["password"])
        return Response({"ok": True})
