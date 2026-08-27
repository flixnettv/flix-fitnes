import re
import uuid
from datetime import date, timedelta
from django.utils.translation import gettext_lazy as _
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError, PermissionDenied
from django_filters.rest_framework import DjangoFilterBackend

from .models import Gym, GymInvitation
from .serializers import GymSerializer, GymInvitationSerializer, GymPublicSerializer, TrainerAdminSerializer
from acct.models import TrainerProfile, ClientProfile, GymAdminProfile
from core.permissions import IsSuperAdmin, IsGymStaff, IsGymAdminOrSuperAdmin, HasGymPerm

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
            from django.contrib.auth import get_user_model
            U = get_user_model()
            if U.objects.filter(email=admin_email).exists():
                raise ValidationError({"admin_email": "البريد مستخدم مسبقاً"})
            username = re.sub(r"[^a-z0-9_]", "", admin_email.split("@")[0]) or ("adm" + uuid.uuid4().hex[:6])
            while U.objects.filter(username=username).exists():
                username += uuid.uuid4().hex[:2]
            admin = U.objects.create_user(
                username=username, email=admin_email,
                password=admin_password or "GymAdmin2026!",
                first_name=gym.name[:30], role="gym_admin",
            )
            GymAdminProfile.objects.create(user=admin, gym=gym, is_primary=True)

    def perform_update(self, serializer):
        if not self.request.user.is_superuser:
            data = self.request.data
            protected = PROTECTED_GYM_FIELDS.intersection(data.keys())
            if protected:
                raise PermissionDenied(_('تغيير الاسم/الدومين محصور بإدارة المنصة.'))
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

    @action(detail=True, methods=["get"], permission_classes=[IsSuperAdmin], url_path="admins")
    def admins(self, request, pk=None):
        gym = self.get_object()
        out = []
        for p in GymAdminProfile.objects.filter(gym=gym).select_related("user"):
            out.append({
                "id": str(p.id), "user_id": str(p.user.id),
                "email": p.user.email, "name": p.user.get_full_name() or p.user.username,
                "is_primary": p.is_primary, "permissions": p.permissions or {},
            })
        return Response(out)

    @action(detail=True, methods=["post"], permission_classes=[IsSuperAdmin], url_path="admins/add")
    def admins_add(self, request, pk=None):
        gym = self.get_object()
        email = (request.data.get("email") or "").strip().lower()
        password = request.data.get("password") or ""
        if not email:
            return Response({"error": "البريد مطلوب"}, status=400)
        from django.contrib.auth import get_user_model
        U = get_user_model()
        user = U.objects.filter(email=email).first()
        if user is None:
            if len(password) < 8:
                return Response({"error": "كلمة المرور 8+ أحرف"}, status=400)
            username = re.sub(r"[^a-z0-9_]", "", email.split("@")[0]) or ("adm" + uuid.uuid4().hex[:6])
            while U.objects.filter(username=username).exists():
                username += uuid.uuid4().hex[:2]
            user = U.objects.create_user(username=username, email=email, password=password, role="gym_admin")
        if GymAdminProfile.objects.filter(user=user, gym=gym).exists():
            return Response({"error": "هذا الحساب مدير للصالة بالفعل"}, status=409)
        uuid_is_primary = not GymAdminProfile.objects.filter(gym=gym).exists()
        GymAdminProfile.objects.create(user=user, gym=gym, is_primary=uuid_is_primary)
        return Response({"ok": True, "user_id": str(user.id)}, status=201)

    @action(detail=True, methods=["post"], permission_classes=[IsSuperAdmin], url_path="admins/(?P<pid>[^/.]+)/remove")
    def admins_remove(self, request, pk=None, pid=None):
        gym = self.get_object()
        profile = GymAdminProfile.objects.filter(id=pid, gym=gym).first()
        if profile is None:
            return Response({"error": "غير موجود"}, status=404)
        if profile.is_primary and GymAdminProfile.objects.filter(gym=gym).count() == 1:
            return Response({"error": "لا يمكن إزالة المدير الوحيد — عيّن مديراً آخر أولاً"}, status=400)
        user = profile.user
        if hasattr(user, "client_profile") or hasattr(user, "trainer_profile"):
            user.role = "client"
        elif profile.is_primary:
            # downgrade to a plain user to avoid locking the gym
            user.role = "client"
        profile.delete()
        if user.role == "gym_admin":
            user.role = "client"
            user.save(update_fields=["role"])
        return Response({"ok": True})

    @action(detail=True, methods=["patch"], permission_classes=[IsSuperAdmin], url_path="admins/(?P<pid>[^/.]+)/permissions")
    def admins_permissions(self, request, pk=None, pid=None):
        gym = self.get_object()
        profile = GymAdminProfile.objects.filter(id=pid, gym=gym).first()
        if profile is None:
            return Response({"error": "غير موجود"}, status=404)
        perms = request.data.get("permissions")
        if not isinstance(perms, dict):
            return Response({"error": "permissions object مطلوب"}, status=400)
        clean = {k: bool(v) for k, v in perms.items()}
        profile.permissions = clean
        profile.save(update_fields=["permissions"])
        return Response({"ok": True, "permissions": clean})


class GymInvitationViewSet(viewsets.ModelViewSet):
    queryset = GymInvitation.objects.all()
    serializer_class = GymInvitationSerializer
    permission_classes = [IsGymAdminOrSuperAdmin]

    def get_queryset(self):
        if self.request.user.is_superuser:
            return self.queryset
        if hasattr(self.request.user, "gym_admin_profile"):
            return self.queryset.filter(gym=self.request.user.gym_admin_profile.gym)
        return self.queryset.none()

    def perform_create(self, serializer):
        if self.request.user.is_superuser:
            gid = self.request.data.get("gym")
            gym = Gym.objects.filter(id=gid).first() if gid else None
        else:
            gym = self.request.user.gym_admin_profile.gym
        if gym is None:
            raise ValidationError({"gym": "اختر صالة"})
        serializer.save(gym=gym)


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
    permission_classes = [IsGymAdminOrSuperAdmin]

    def get_queryset(self):
        u = self.request.user
        if u.is_superuser:
            return self.queryset
        if hasattr(u, "gym_admin_profile"):
            return self.queryset.filter(gym=u.gym_admin_profile.gym)
        return self.queryset.none()

    def perform_create(self, serializer):
        from django.contrib.auth import get_user_model
        U = get_user_model()
        data = self.request.data
        email = (data.get("email") or "").strip().lower()
        if not email:
            raise ValidationError({"email": "مطلوب"})
        if U.objects.filter(email=email).exists():
            raise ValidationError({"email": "مستخدم مسبقاً"})
        if self.request.user.is_superuser:
            gid = data.get("gym")
            gym = Gym.objects.filter(id=gid).first() if gid else self.request.user.gym_admin_profile.gym if hasattr(self.request.user, "gym_admin_profile") else None
        else:
            gym = self.request.user.gym_admin_profile.gym
        if gym is None:
            raise ValidationError({"gym": "اختر صالة"})
        username = re.sub(r"[^a-z0-9_]", "", email.split("@")[0]) or ("tr" + uuid.uuid4().hex[:6])
        while U.objects.filter(username=username).exists():
            username += uuid.uuid4().hex[:2]
        user = U.objects.create_user(
            username=username, email=email,
            password=data.get("password") or "Trainer2026!",
            first_name=data.get("first_name") or data.get("name") or "",
            last_name=data.get("last_name") or "", role="trainer",
            phone=data.get("phone") or "",
        )
        serializer.save(
            user=user, gym=gym,
            employee_id=data.get("employee_id") or ("TR-" + uuid.uuid4().hex[:6].upper()),
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
@permission_classes([IsGymStaff])
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
            "membershipStart": str(c.membership_start) if c.membership_start else "",
            "membershipEnd": str(c.membership_end) if c.membership_end else "",
            "membershipFee": float(c.membership_fee or 0),
            "email": c.user.email,
            "phone": c.user.phone,
            "goals": c.goals or [],
            "weight": float(getattr(c, "weight", 0) or 0),
            "startWeight": float(getattr(c, "weight", 0) or 0),
            "targetWeight": float(getattr(c, "weight", 0) or 0) - 5,
            "adherence": 85,
            "joinedWeeks": joined_weeks,
            "isActive": bool(c.is_active),
        })
    return Response(result)


@api_view(["GET"])
@permission_classes([IsGymStaff])
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
@permission_classes([IsGymStaff])
def gym_stats(request):
    """Gym statistics for the dashboard."""
    gym = _get_user_gym(request.user)
    if gym is None:
        return Response({}, status=200)

    members = ClientProfile.objects.filter(gym=gym, is_active=True)
    trainers = TrainerProfile.objects.filter(gym=gym, is_active=True)
    today = date.today()
    from django.db.models import Sum
    fee_sum = members.aggregate(t=Sum("membership_fee"))["t"] or 0
    return Response({
        "totalMembers": members.count(),
        "activeMembers": members.filter(is_active=True).count(),
        "expiredMembers": ClientProfile.objects.filter(gym=gym, is_active=True, membership_end__lt=today).count(),
        "activeSubscriptions": members.filter(membership_end__gte=today).count(),
        "totalTrainers": trainers.count(),
        "activeTrainers": trainers.count(),
        "newThisMonth": members.filter(membership_start__month=today.month, membership_start__year=today.year).count(),
        "expiringThisMonth": members.filter(membership_end__month=today.month, membership_end__year=today.year).count(),
        "totalRevenue": round(float(fee_sum), 2),
    })


def _parse_iso_date(value):
    try:
        return date.fromisoformat(str(value))
    except Exception:
        return None


def _create_member_in_gym(gym, d, actor):
    """Shared member-creation logic (staff only). Fee + manual dates in EGP."""
    from django.contrib.auth import get_user_model
    U = get_user_model()

    email = (d.get("email") or "").strip().lower()
    name = (d.get("name") or "").strip()
    first = (d.get("first_name") or "").strip()
    last = (d.get("last_name") or "").strip()
    if not email:
        return Response({"error": "البريد مطلوب"}, status=400)
    if not first and name:
        first, _, lastpart = name.partition(" ")
        last = lastpart.strip()
    if U.objects.filter(email=email).exists():
        return Response({"error": "البريد مستخدم مسبقاً"}, status=400)

    username = re.sub(r"[^a-z0-9_]", "", email.split("@")[0]) or ("mem" + uuid.uuid4().hex[:6])
    while U.objects.filter(username=username).exists():
        username += uuid.uuid4().hex[:2]

    user = U.objects.create_user(
        username=username, email=email,
        password=d.get("password") or "Member2026!",
        first_name=first, last_name=last,
        phone=d.get("phone") or "", role="client",
    )

    membership_type = d.get("membership_type") or "basic"
    if membership_type not in dict(ClientProfile.MEMBERSHIP_TYPES):
        membership_type = "basic"

    today = date.today()
    m_start = _parse_iso_date(d.get("membership_start")) or today
    m_end = _parse_iso_date(d.get("membership_end")) or (m_start + timedelta(days=365))
    try:
        fee = round(float(d.get("membership_fee", 0) or 0), 2)
    except Exception:
        fee = 0

    trainer = None
    tid = d.get("trainer_id")
    if tid:
        trainer = TrainerProfile.objects.filter(id=tid, gym=gym).first()
    if trainer is None and hasattr(actor, "trainer_profile") and actor.trainer_profile.is_active:
        trainer = actor.trainer_profile

    client = ClientProfile.objects.create(
        user=user, gym=gym, trainer=trainer,
        membership_type=membership_type,
        membership_start=m_start, membership_end=m_end,
        membership_fee=fee,
        goals=d.get("goals") if isinstance(d.get("goals"), list) else [],
        is_active=True,
    )
    return Response({
        "id": str(client.id), "name": user.get_full_name(), "email": user.email,
        "membership": client.membership_type, "password_set": True,
    }, status=201)


@api_view(["POST"])
@permission_classes([IsGymStaff])
def gym_member_create(request):
    """Create a new member — gym staff only (admins + trainers)."""
    gym = _get_user_gym(request.user)
    if gym is None:
        return Response({"error": "لا توجد صالة مربوطة بحسابك"}, status=400)
    if hasattr(request.user, "client_profile"):
        return Response({"error": "غير مسموح — المدرب أو مدير الصالة فقط"}, status=403)
    return _create_member_in_gym(gym, request.data, request.user)


@api_view(["PATCH", "DELETE"])
@permission_classes([IsGymStaff])
def gym_member_update(request, member_id):
    """Update/deactivate a member. Gym admins: any member; trainers: their own only."""
    gym = _get_user_gym(request.user)
    if gym is None:
        return Response({"error": "لا توجد صالة مربوطة بحسابك"}, status=400)

    cp = ClientProfile.objects.filter(id=member_id, gym=gym).select_related("user", "trainer").first()
    if cp is None:
        return Response({"error": "العضو غير موجود في صالتك"}, status=404)

    is_trainer_only = (hasattr(request.user, "trainer_profile") and not request.user.is_superuser
                       and not hasattr(request.user, "gym_admin_profile"))
    if is_trainer_only and cp.trainer_id != request.user.trainer_profile.id:
        return Response({"error": "يمكنك إدارة عملائك المخصصين فقط"}, status=403)

    if request.method == "DELETE":
        cp.is_active = False
        cp.save(update_fields=["is_active"])
        return Response({"ok": True, "is_active": False})

    d = request.data
    if "trainer_id" in d:
        tid = d.get("trainer_id")
        if tid:
            trainer = TrainerProfile.objects.filter(id=tid, gym=gym).first()
            if trainer is None:
                return Response({"error": "المدرب غير موجود في الصالة"}, status=400)
            cp.trainer = trainer
        else:
            cp.trainer = None

    if "membership_type" in d and d.get("membership_type") in dict(ClientProfile.MEMBERSHIP_TYPES):
        cp.membership_type = d["membership_type"]

    for field in ("membership_start", "membership_end"):
        if field in d:
            parsed = _parse_iso_date(d.get(field))
            if parsed is None:
                return Response({"error": f"{field}: تاريخ غير صالح (YYYY-MM-DD)"}, status=400)
            setattr(cp, field, parsed)

    if "membership_fee" in d:
        try:
            cp.membership_fee = round(float(d.get("membership_fee") or 0), 2)
        except Exception:
            return Response({"error": "membership_fee: قيمة غير صالحة"}, status=400)

    if "goals" in d:
        if not isinstance(d.get("goals"), list):
            return Response({"error": "goals: قائمة مطلوبة"}, status=400)
        cp.goals = d["goals"]

    if "is_active" in d and isinstance(d.get("is_active"), bool):
        cp.is_active = d["is_active"]

    cp.save()
    return Response({
        "ok": True,
        "id": str(cp.id),
        "trainerId": str(cp.trainer_id) if cp.trainer_id else "",
        "membership": cp.membership_type,
        "membershipStart": str(cp.membership_start),
        "membershipEnd": str(cp.membership_end),
        "membershipFee": float(cp.membership_fee or 0),
        "isActive": cp.is_active,
    })


# ---------------- gym admin: general settings + notifications ----------------
GENERAL_SETTINGS_FIELDS = [
    "address", "city", "contact_email", "contact_phone",
    "instagram_url", "twitter_url", "website_url", "currency",
]


def _admin_gym(user):
    if hasattr(user, "gym_admin_profile"):
        return user.gym_admin_profile.gym
    if user.is_superuser:
        return user.get_gym() or Gym.objects.first()
    return None


@api_view(["GET"])
@permission_classes([IsGymAdminOrSuperAdmin])
def gym_settings_get(request):
    gym = _admin_gym(request.user)
    if gym is None:
        return Response({"error": "صلاحيات مدير الصالة مطلوبة"}, status=403)
    return Response({
        "name": gym.name,
        "address": gym.address,
        "city": gym.city,
        "contact_email": gym.contact_email,
        "contact_phone": gym.contact_phone,
        "instagram_url": gym.instagram_url,
        "twitter_url": gym.twitter_url,
        "website_url": gym.website_url,
        "currency": gym.currency or "EGP",
        "opening_hours": gym.opening_hours or {},
        "notification_config": gym.notification_config or {},
    })


@api_view(["PATCH"])
@permission_classes([HasGymPerm("manage_settings")])
def gym_settings_update(request):
    gym = _admin_gym(request.user)
    if gym is None:
        return Response({"error": "صلاحيات مدير الصالة مطلوبة"}, status=403)
    d = request.data
    for field in GENERAL_SETTINGS_FIELDS:
        if field in d and d.get(field) is not None:
            setattr(gym, field, str(d.get(field)).strip())
    if "opening_hours" in d and isinstance(d.get("opening_hours"), dict):
        gym.opening_hours = d["opening_hours"]
    if "notification_config" in d and isinstance(d.get("notification_config"), dict):
        gym.notification_config = d["notification_config"]
    gym.save()
    return Response({"ok": True})
