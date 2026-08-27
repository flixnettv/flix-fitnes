import re
from datetime import date
from django.utils.translation import gettext_lazy as _
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend

from .models import Gym, GymInvitation
from .serializers import GymSerializer, GymInvitationSerializer, GymPublicSerializer, TrainerAdminSerializer
from acct.models import TrainerProfile, ClientProfile
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
    for img in ["logo", "banner", "background_image", "splash_image", "favicon"]:
        if img in request.FILES:
            setattr(gym, img, request.FILES[img])
            changed.append(img)
        elif img in request.data and request.data.get(img) in [None, "", "null"]:
            setattr(gym, img, None)
            changed.append(img+":cleared")
    gym.save()
    return Response({"ok": True, "changed": changed})


# Trainer admin ViewSet
from .serializers import TrainerAdminSerializer

class TrainerAdminViewSet(viewsets.ModelViewSet):
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

    @action(detail=True, methods=["post"], url_path="reset-password")
    def reset_password(self, request, pk=None):
        trainer = self.get_object()
        pwd = request.data.get("password") or ""
        if len(pwd) < 8:
            return Response({"error": "كلمة المرور 8+ أحرف"}, status=400)
        trainer.user.set_password(pwd)
        trainer.user.save(update_fields=["password"])
        return Response({"ok": True})


# ============================================================
#  Frontend sync endpoints
# ============================================================

def _get_user_gym(user):
    """Resolve the gym for the current user."""
    if hasattr(user, "gym_admin_profile"):
        return user.gym_admin_profile.gym
    if hasattr(user, "client_profile"):
        return user.client_profile.gym
    if hasattr(user, "trainer_profile"):
        return user.trainer_profile.gym
    if user.is_superuser:
        return Gym.objects.first()
    return None


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def gym_branding_public(request):
    """Public branding for the current user's gym.
    Returns {name, primary_color, secondary_color, accent_color, logo}."""
    gym = _get_user_gym(request.user)
    if gym is None:
        return Response({
            "name": "FitPro Center",
            "primary_color": "#38BDF8",
            "secondary_color": "#22D3EE",
            "accent_color": "#4ADE80",
            "logo": None,
        })
    return Response({
        "name": gym.name,
        "primary_color": gym.primary_color,
        "secondary_color": gym.secondary_color,
        "accent_color": gym.accent_color,
        "logo": request.build_absolute_uri(gym.logo.url) if gym.logo else None,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def gym_members_list(request):
    """List members for the current user's gym.
    Returns flat array matching frontend ApiMember interface."""
    gym = _get_user_gym(request.user)
    if gym is None:
        return Response([], status=200)

    clients = ClientProfile.objects.filter(gym=gym, is_active=True).select_related("user", "trainer")
    result = []
    for c in clients:
        joined_days = (date.today() - c.membership_start).days if c.membership_start else 0
        joined_weeks = joined_days // 7
        result.append({
            "id": str(c.id),
            "name": c.user.get_full_name() or c.user.username,
            "gymId": str(gym.id),
            "trainerId": str(c.trainer.id) if c.trainer else "",
            "membership": c.membership_type,
            "membershipEnd": str(c.membership_end) if c.membership_end else "",
            "goals": c.goals or [],
            "weight": float(getattr(c, "weight", 0) or 0),
            "startWeight": float(getattr(c, "weight", 0) or 0),
            "targetWeight": float(getattr(c, "weight", 0) or 0) - 5,
            "adherence": 85,
            "joinedWeeks": joined_weeks,
        })
    return Response(result)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def gym_trainers_list(request):
    """List trainers for the current user's gym.
    Returns flat array matching frontend ApiTrainer interface."""
    gym = _get_user_gym(request.user)
    if gym is None:
        return Response([], status=200)

    trainers = TrainerProfile.objects.filter(gym=gym, is_active=True).select_related("user")
    result = []
    for t in trainers:
        result.append({
            "id": str(t.id),
            "name": t.user.get_full_name() or t.user.username,
            "gymId": str(gym.id),
            "employeeId": t.employee_id or "",
            "spec": t.specialization or [],
            "certs": t.certifications or [],
            "clients": t.clients.filter(is_active=True).count(),
            "maxClients": t.max_clients or 50,
            "sessionsMonth": 0,
            "rating": 4.8,
            "hireDate": str(t.hire_date) if t.hire_date else "",
            "rate": float(t.hourly_rate or 0),
            "active": t.is_active,
        })
    return Response(result)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def gym_stats(request):
    """Gym statistics for the dashboard."""
    gym = _get_user_gym(request.user)
    if gym is None:
        return Response({}, status=200)

    members = ClientProfile.objects.filter(gym=gym, is_active=True)
    trainers = TrainerProfile.objects.filter(gym=gym, is_active=True)
    return Response({
        "totalMembers": members.count(),
        "activeMembers": members.count(),
        "totalTrainers": trainers.count(),
        "activeTrainers": trainers.count(),
        "newThisMonth": members.filter(membership_start__month=date.today().month).count(),
        "expiringThisMonth": members.filter(membership_end__month=date.today().month).count(),
        "totalRevenue": 0,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def gym_member_create(request):
    """Create a new member for the current user's gym."""
    gym = _get_user_gym(request.user)
    if gym is None:
        return Response({"error": "لا توجد صالة مربوطة بحسابك"}, status=400)

    from django.contrib.auth import get_user_model
    U = get_user_model()

    email = (request.data.get("email") or "").strip().lower()
    name = (request.data.get("name") or "").strip()
    password = request.data.get("password") or "Member2026!"
    phone = request.data.get("phone") or ""
    membership_type = request.data.get("membership_type") or "basic"
    goals = request.data.get("goals") or []
    trainer_id = request.data.get("trainer_id") or None

    if not email:
        return Response({"error": "البريد مطلوب"}, status=400)
    if U.objects.filter(email=email).exists():
        return Response({"error": "البريد مستخدم مسبقاً"}, status=400)

    parts = name.split(" ", 1) if name else [email.split("@")[0], ""]
    username = re.sub(r"[^a-z0-9_]", "", email.split("@")[0]) or ("mem" + re.sub(r"[^a-z0-9]", "", email.split("@")[0]))
    while U.objects.filter(username=username).exists():
        import uuid as _uuid
        username += _uuid.uuid4().hex[:2]

    user = U.objects.create_user(
        username=username, email=email, password=password,
        first_name=parts[0], last_name=parts[1] if len(parts) > 1 else "",
        phone=phone, role="client",
    )

    trainer = None
    if trainer_id:
        trainer = TrainerProfile.objects.filter(id=trainer_id, gym=gym).first()

    client = ClientProfile.objects.create(
        user=user, gym=gym, trainer=trainer,
        membership_type=membership_type,
        membership_start=date.today(),
        membership_end=date(date.today().year + 1, date.today().month, date.today().day),
        goals=goals if isinstance(goals, list) else [],
        is_active=True,
    )

    return Response({
        "id": str(client.id),
        "name": user.get_full_name(),
        "password_set": True,
    }, status=201)
