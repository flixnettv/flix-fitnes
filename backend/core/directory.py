"""
Gym Directory API - Real members/trainers lists (ported from fitpro.core.directory)
Adapted: fitpro.acct -> acct, fitpro.progress -> progress, gym -> gym_center
"""
from django.http import JsonResponse
from django.db.models import Subquery, OuterRef, Avg, Count
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes

def _full_name(u):
    try:
        return u.get_full_name() or u.username
    except Exception:
        return getattr(u, "username", str(u))

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def members_list(request):
    from acct.models import ClientProfile
    try:
        from progress.models import WeeklyCheckin
        has_checkin = True
    except Exception:
        has_checkin = False

    if request.user.is_superuser or getattr(request.user, "role", "") in ("owner", "super_admin"):
        qs = ClientProfile.objects.select_related("user", "trainer__user", "gym") if has_checkin else ClientProfile.objects.select_related("user", "gym")
    else:
        gym = None
        try:
            gym = request.user.get_gym()
        except Exception:
            if hasattr(request.user, "gym_admin_profile"):
                gym = request.user.gym_admin_profile.gym
            elif hasattr(request.user, "coach_profile"):
                # fallback owned gym
                gym = request.user.owned_gyms.first()
        if gym is None:
            return JsonResponse([], safe=False)
        qs = ClientProfile.objects.filter(gym=gym).select_related("user", "trainer__user") if has_checkin else ClientProfile.objects.filter(gym=gym).select_related("user")

    if hasattr(request.user, "client_profile"):
        try:
            qs = qs.filter(id=request.user.client_profile.id)
        except Exception:
            pass

    # annotate latest weight and adherence if possible
    if has_checkin:
        try:
            latest_weight = WeeklyCheckin.objects.filter(client=OuterRef("pk")).order_by("-week_start").values("weight_kg")[:1]
            adherence_avg = WeeklyCheckin.objects.filter(client=OuterRef("pk")).values("client").annotate(a=Avg("adherence")).values("a")[:1]
            qs = qs.annotate(lw=Subquery(latest_weight), ad=Subquery(adherence_avg))
        except Exception:
            pass
        data = []
        today = timezone.now().date()
        for c in qs:
            joined_weeks = 0
            if getattr(c, "membership_start", None):
                try:
                    joined_weeks = max(0, (today - c.membership_start).days // 7)
                except Exception:
                    joined_weeks = 0
            w = float(getattr(c, "lw", 0) or 0) if hasattr(c, "lw") else 0
            ad = getattr(c, "ad", None)
            data.append({
                "id": str(c.id),
                "name": _full_name(c.user),
                "email": getattr(c.user, "email", ""),
                "phone": getattr(c.user, "phone", ""),
                "gymId": str(c.gym_id) if c.gym_id else "",
                "gymName": getattr(c.gym, "name", "") if c.gym_id else "",
                "trainerId": str(c.trainer_id) if getattr(c, "trainer_id", None) else "",
                "membership": getattr(c, "membership_type", "basic"),
                "membershipEnd": c.membership_end.isoformat() if getattr(c, "membership_end", None) else "",
                "goals": getattr(c, "goals", []) or [],
                "weight": w,
                "startWeight": w,
                "targetWeight": w,
                "adherence": int(ad * 20) if ad else 60,
                "lastWorkout": "",
                "streak": 0,
                "joinedWeeks": joined_weeks,
                "isActive": bool(getattr(c, "is_active", True)),
            })
        return JsonResponse(data, safe=False)
    else:
        data = []
        for c in qs:
            data.append({
                "id": str(c.id),
                "name": _full_name(c.user),
                "email": getattr(c.user, "email", ""),
                "gymId": str(c.gym_id) if c.gym_id else "",
                "gymName": getattr(c.gym, "name", "") if c.gym_id else "",
                "isActive": bool(getattr(c, "is_active", True)),
            })
        return JsonResponse(data, safe=False)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def trainers_list(request):
    from acct.models import CoachProfile
    # In target, Trainer concept is CoachProfile
    try:
        from acct.models import ClientProfile
    except Exception:
        ClientProfile = None

    if request.user.is_superuser or getattr(request.user, "role", "") in ("owner", "super_admin"):
        qs_t = CoachProfile.objects.filter(is_active=True).select_related("user")
        # try to include gym if exists via owned_gyms? fallback
    else:
        gym = None
        try:
            gym = request.user.get_gym()
        except Exception:
            if hasattr(request.user, "gym_admin_profile"):
                gym = request.user.gym_admin_profile.gym
        if gym is None:
            # fallback: if coach, return own
            if hasattr(request.user, "coach_profile"):
                qs_t = CoachProfile.objects.filter(user=request.user, is_active=True).select_related("user")
                data = []
                for t in qs_t:
                    data.append({
                        "id": str(t.id),
                        "name": _full_name(t.user),
                        "email": getattr(t.user, "email", ""),
                        "gymId": "",
                        "gymName": "",
                        "employeeId": getattr(t, "employee_id", ""),
                        "spec": getattr(t, "specialization", []) or getattr(t, "specializations", "").split(",") if getattr(t, "specializations", "") else ["عام"],
                        "certs": getattr(t, "certifications", []) or [],
                        "clients": 0,
                        "maxClients": getattr(t, "max_clients", 50),
                        "sessionsMonth": 0,
                        "rating": 4.8,
                        "hireDate": getattr(t, "hire_date", None).isoformat()[:7] if getattr(t, "hire_date", None) else "",
                        "rate": float(getattr(t, "hourly_rate", 0) or 0),
                        "active": bool(getattr(t, "is_active", True)),
                    })
                return JsonResponse(data, safe=False)
            return JsonResponse([], safe=False)
        # gym exists but CoachProfile has no gym FK in target - fallback all active
        qs_t = CoachProfile.objects.filter(is_active=True).select_related("user")

    data = []
    for t in qs_t:
        clients_count = 0
        try:
            if hasattr(t, "clients"):
                clients_count = t.clients.filter(is_active=True).count()
            elif ClientProfile:
                clients_count = ClientProfile.objects.filter(trainer=t, is_active=True).count()
        except Exception:
            clients_count = 0
        # gym info fallback
        gym_id = getattr(t, "gym_id", "") or ""
        gym_name = ""
        try:
            if gym_id and hasattr(t, "gym"):
                gym_name = t.gym.name
        except Exception:
            pass
        data.append({
            "id": str(t.id),
            "name": _full_name(t.user),
            "email": getattr(t.user, "email", ""),
            "gymId": str(gym_id) if gym_id else "",
            "gymName": gym_name,
            "employeeId": getattr(t, "employee_id", ""),
            "spec": getattr(t, "specialization", []) or (getattr(t, "specializations", "").split(",") if getattr(t, "specializations", "") else ["عام"]),
            "certs": getattr(t, "certifications", []) or [],
            "clients": clients_count,
            "maxClients": getattr(t, "max_clients", 50),
            "sessionsMonth": 0,
            "rating": 4.8,
            "hireDate": getattr(t, "hire_date", None).isoformat()[:7] if getattr(t, "hire_date", None) else "",
            "rate": float(getattr(t, "hourly_rate", 0) or 0),
            "active": True,
        })
    return JsonResponse(data, safe=False)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def members_create(request):
    import re as _re
    from django.contrib.auth import get_user_model
    from datetime import timedelta
    from acct.models import ClientProfile
    User = get_user_model()
    gym = None
    try:
        gym = request.user.get_gym()
    except Exception:
        if hasattr(request.user, "gym_admin_profile"):
            gym = request.user.gym_admin_profile.gym
        elif hasattr(request.user, "coach_profile"):
            gym = request.user.owned_gyms.first()
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
    base = username
    cnt = 1
    while User.objects.filter(username=username).exists():
        username = f"{base}{cnt}"
        cnt += 1
    password = d.get("password") or "Client2026!"
    user = User.objects.create_user(username=username, email=email, password=password, first_name=first, last_name=last, role="client")
    try:
        user.phone = d.get("phone") or ""
        user.save(update_fields=["phone"])
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
            from acct.models import CoachProfile
            trainer = CoachProfile.objects.filter(id=tid).first()
            # ensure gym match if possible
            if trainer and hasattr(trainer, "gym_id") and trainer.gym_id != gym.id:
                trainer = None
        except Exception:
            trainer = getattr(request.user, "coach_profile", None)
    else:
        trainer = getattr(request.user, "coach_profile", None)
    # Handle trainer FK type: ClientProfile.trainer expects CoachProfile
    cp_kwargs = dict(user=user, gym=gym, membership_type=d.get("membership_type", "basic"), membership_start=m_start, membership_end=m_end, goals=d.get("goals") or [])
    if trainer:
        cp_kwargs["trainer"] = trainer
    cp = ClientProfile.objects.create(**cp_kwargs)
    return JsonResponse({"id": str(cp.id), "name": _full_name(user), "email": user.email, "membership": cp.membership_type, "password_set": bool(d.get("password"))}, status=201)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_trainer_account(request):
    import re as _re
    import uuid as _uuid
    from datetime import date
    from django.contrib.auth import get_user_model
    from acct.models import CoachProfile
    from gym_center.models import GymCenter
    if not (request.user.is_superuser or request.user.is_staff or getattr(request.user, "role", "") in ("owner", "super_admin")):
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
    if GymCenter.objects.filter(slug=slug).exists():
        return JsonResponse({"error": "هذا الصب دومين محجوز"}, status=409)
    password = data.get("password") or "Trainer2026!"
    username = _re.sub(r"[^a-z0-9_]", "", email.split("@")[0]) or f"tr{_uuid.uuid4().hex[:6]}"
    base = username
    cnt = 1
    while User.objects.filter(username=username).exists():
        username = f"{base}{cnt}"
        cnt += 1
    user = User.objects.create_user(username=username, email=email, password=password, first_name=first, last_name=last, role="coach", phone=data.get("phone") or "")
    gid = _uuid.uuid4()
    gym = GymCenter(id=gid, name=f"{first} {last}".strip() or username, slug=slug, owner=user)
    # set optional branding if fields exist
    for f, val in [("primary_color", data.get("primary_color")), ("accent_color", data.get("accent_color")), ("background_color", data.get("background_color")), ("default_theme", data.get("default_theme")), ("splash_title", data.get("splash_title")), ("splash_tagline", data.get("splash_tagline")), ("splash_style", data.get("splash_style"))]:
        if val and hasattr(gym, f):
            setattr(gym, f, val)
    for f in ("logo", "banner", "background_image", "splash_image"):
        if request.FILES.get(f) and hasattr(gym, f):
            setattr(gym, f, request.FILES[f])
    gym.save()
    CoachProfile.objects.create(user=user, slug=slug, display_name=f"{first} {last}".strip() or username, is_active=True)
    try:
        from core.branding import sync_dynamic_entries
        sync_status = sync_dynamic_entries()
    except Exception as e:
        sync_status = f"error: {e}"
    return JsonResponse({"ok": True, "user_id": str(user.id), "gym_id": str(gym.id), "subdomain": f"{slug}.fitpro.hftv.qzz.io", "dynamic": sync_status, "password_default": password if not data.get("password") else "(custom)"}, status=201)
