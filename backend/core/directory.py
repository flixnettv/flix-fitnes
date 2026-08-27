"""
Gym Directory API - Real members/trainers lists for the dashboard,
shaped to match the frontend design's data interfaces exactly.
"""
from django.http import JsonResponse
from django.db.models import Subquery, OuterRef, Avg
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser

from acct.models import ClientProfile, TrainerProfile


def _full_name(u):
    return u.get_full_name() or u.username


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def members_list(request):
    """Members directory. Platform admin sees ALL gyms."""
    if request.user.is_superuser:
        qs = ClientProfile.objects.select_related("user", "trainer__user", "gym")
    else:
        gym = request.user.get_gym()
        if gym is None:
            return JsonResponse([], safe=False)
        qs = ClientProfile.objects.filter(gym=gym).select_related("user", "trainer__user")
        if hasattr(request.user, "client_profile"):
            qs = qs.filter(id=request.user.client_profile.id)

    # Import here to avoid circular
    try:
        from progress.models import WeeklyCheckin
        latest_weight = WeeklyCheckin.objects.filter(
            client=OuterRef("pk")
        ).order_by("-week_start").values("weight_kg")[:1]
        adherence_avg = WeeklyCheckin.objects.filter(
            client=OuterRef("pk")
        ).values("client").annotate(a=Avg("adherence")).values("a")[:1]
        annotate_qs = qs.annotate(lw=Subquery(latest_weight), ad=Subquery(adherence_avg))
    except Exception:
        annotate_qs = qs

    data = []
    today = timezone.now().date()
    for c in annotate_qs:
        joined_weeks = 0
        if c.membership_start:
            joined_weeks = max(0, (today - c.membership_start).days // 7)
        w = float(getattr(c, 'lw', 0) or 0)
        ad = getattr(c, 'ad', None)
        data.append({
            "id": str(c.id),
            "name": _full_name(c.user),
            "email": c.user.email,
            "phone": c.user.phone,
            "gymId": str(c.gym_id),
            "gymName": c.gym.name if hasattr(c, 'gym') and c.gym else "",
            "trainerId": str(c.trainer_id) if c.trainer_id else "",
            "membership": c.membership_type,
            "membershipEnd": c.membership_end.isoformat() if c.membership_end else "",
            "goals": c.goals or [],
            "weight": w,
            "startWeight": w,
            "targetWeight": w,
            "adherence": int(ad * 20) if ad else 60,
            "lastWorkout": "",
            "streak": 0,
            "joinedWeeks": joined_weeks,
            "isActive": bool(c.is_active),
        })
    return JsonResponse(data, safe=False)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def trainers_list(request):
    """Trainers directory. Platform admin sees ALL."""
    if request.user.is_superuser:
        qs_t = TrainerProfile.objects.filter(is_active=True).select_related("user", "gym")
    else:
        gym = request.user.get_gym()
        if gym is None:
            return JsonResponse([], safe=False)
        qs_t = TrainerProfile.objects.filter(gym=gym, is_active=True).select_related("user", "gym")

    data = []
    for t in qs_t:
        clients_count = t.clients.filter(is_active=True).count()
        data.append({
            "id": str(t.id),
            "name": _full_name(t.user),
            "email": t.user.email,
            "gymId": str(t.gym_id),
            "gymName": t.gym.name if hasattr(t, 'gym') and t.gym else "",
            "employeeId": t.employee_id,
            "spec": t.specialization or ["عام"],
            "certs": t.certifications or [],
            "clients": clients_count,
            "maxClients": t.max_clients,
            "sessionsMonth": 0,
            "rating": 4.8,
            "hireDate": t.hire_date.isoformat()[:7] if t.hire_date else "",
            "rate": float(t.hourly_rate or 0),
            "active": True,
        })
    return JsonResponse(data, safe=False)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def members_create(request):
    """Create a new member (client) — trainer or gym admin only."""
    import re as _re
    from django.contrib.auth import get_user_model
    from django.utils import timezone
    from datetime import timedelta

    User = get_user_model()
    gym = request.user.get_gym()
    if gym is None or hasattr(request.user, "client_profile"):
        return JsonResponse({"error": "غير مسموح — المدرب أو مدير الصالة فقط"}, status=403)

    d = request.data if hasattr(request, "data") else {}
    email = (d.get("email") or "").strip().lower()
    first = (d.get("first_name") or "").strip()
    last = (d.get("last_name") or "").strip()
    name = (d.get("name") or "").strip()
    if not email:
        return JsonResponse({"error": "البريد الإلكتروني مطلوب"}, status=400)
    if not first and name:
        parts = name.split(" ", 1)
        first = parts[0]
        last = parts[1] if len(parts) > 1 else ""
    if User.objects.filter(email=email).exists():
        return JsonResponse({"error": "هذا البريد مسجل مسبقاً"}, status=400)

    username = _re.sub(r"[^a-z0-9_]", "", email.split("@")[0].lower()) or f"member{int(timezone.now().timestamp())}"
    while User.objects.filter(username=username).exists():
        username += str(timezone.now().timestamp())[-2:]

    password = d.get("password") or "Client2026!"
    user = User.objects.create_user(
        username=username, email=email, password=password,
        first_name=first, last_name=last, role="client",
    )
    try:
        user.phone = d.get("phone") or ""
        user.save()
    except Exception:
        pass

    m_start = timezone.now().date()
    try:
        m_end = timezone.datetime.strptime(d["membership_end"], "%Y-%m-%d").date()
    except Exception:
        m_end = m_start + timedelta(days=365)

    trainer = None
    tid = d.get("trainer_id")
    if tid:
        try:
            trainer = TrainerProfile.objects.get(id=tid, gym=gym)
        except TrainerProfile.DoesNotExist:
            trainer = getattr(request.user, "trainer_profile", None)
    else:
        trainer = getattr(request.user, "trainer_profile", None)

    cp = ClientProfile.objects.create(
        user=user, gym=gym, trainer=trainer,
        membership_type=d.get("membership_type", "basic"),
        membership_start=m_start, membership_end=m_end,
        goals=d.get("goals") or [],
    )
    return JsonResponse({
        "id": str(cp.id), "name": _full_name(user), "email": user.email,
        "membership": cp.membership_type, "password_set": bool(d.get("password")),
    }, status=201)


# ---------------- platform-admin exclusive account creation ----------------
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_trainer_account(request):
    """Platform admin ONLY. Creates an INDEPENDENT trainer with his own personal tenant."""
    import re as _re
    import uuid as _uuid
    from datetime import date
    from django.contrib.auth import get_user_model
    from acct.models import TrainerProfile
    from gym_center.models import Gym

    if not (request.user.is_superuser or request.user.is_staff):
        return JsonResponse({"error": "إدارة المنصة فقط"}, status=403)

    User = get_user_model()
    data = request.data
    email = (data.get("email") or "").strip().lower()
    first = (data.get("first_name") or "").strip()
    last = (data.get("last_name") or "").strip()
    name = (data.get("name") or "").strip()
    if not email:
        return JsonResponse({"error": "البريد مطلوب"}, status=400)
    if not first and name:
        parts = name.split(" ", 1)
        first, last = parts[0], parts[1] if len(parts) > 1 else ""
    if User.objects.filter(email=email).exists():
        return JsonResponse({"error": "البريد مسجل مسبقاً"}, status=400)

    slug = (data.get("slug") or "").strip().lower()
    slug = _re.sub(r"[^a-z0-9-]", "-", slug).strip("-")
    if len(slug) < 3:
        return JsonResponse({"error": "الصب دومين يجب أن يكون 3 أحرف على الأقل"}, status=400)
    if Gym.objects.filter(slug=slug).exists():
        return JsonResponse({"error": "هذا الصب دومين محجوز"}, status=409)

    password = data.get("password") or "Trainer2026!"
    username = _re.sub(r"[^a-z0-9_]", "", email.split("@")[0]) or f"tr{_uuid.uuid4().hex[:6]}"
    while User.objects.filter(username=username).exists():
        username += _uuid.uuid4().hex[:2]

    user = User.objects.create_user(
        username=username, email=email, password=password,
        first_name=first, last_name=last, role="trainer",
        phone=data.get("phone") or "",
    )

    gid = _uuid.uuid4()
    gym = Gym(id=gid, tenant_id=gid, kind="personal", slug=slug,
              name=f"{first} {last}".strip() or username,
              description="حساب مدرب مستقل")
    gym.primary_color = data.get("primary_color") or "#C6F24E"
    gym.accent_color = data.get("accent_color") or "#45d6c0"
    gym.background_color = data.get("background_color") or "#0F172A"
    gym.default_theme = data.get("default_theme") or "dark"
    gym.splash_title = data.get("splash_title") or ""
    gym.splash_tagline = data.get("splash_tagline") or ""
    gym.splash_style = data.get("splash_style") or "gradient"
    for f in ("logo", "banner", "background_image", "splash_image"):
        if request.FILES.get(f):
            setattr(gym, f, request.FILES[f])
    gym.save()

    TrainerProfile.objects.create(
        user=user, gym=gym,
        employee_id=f"IND-{_uuid.uuid4().hex[:6].upper()}",
        hire_date=date.today(),
        specialization=data.get("specialization") or [],
    )
    return JsonResponse({
        "ok": True, "user_id": str(user.id), "gym_id": str(gym.id),
        "subdomain": f"{slug}.fitpro.hftv.qzz.io",
        "password_default": password if not data.get("password") else "(custom)",
    }, status=201)
