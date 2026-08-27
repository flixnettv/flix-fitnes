"""
Public Gym Branding API - White-label theming source.
Returns branding for the gym matched by request Host (no auth required).
"""
import re
from django.conf import settings
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated


def _resolve_gym(request):
    """Resolve gym by Host header: custom_domain > subdomain > first active."""
    from gym_center.models import Gym
    host = (request.get_host() or "").split(":")[0].lower()
    gym = None
    if host:
        gym = Gym.objects.filter(is_active=True, custom_domain=host).first()
        if gym is None and "." in host:
            sub = host.split(".")[0]
            gym = Gym.objects.filter(is_active=True, slug=sub).first()
    if gym is None:
        gym = Gym.objects.filter(is_active=True).order_by("created_at").first()
    return gym


def _hex(c, default):
    v = (c or "").strip()
    return v if v.startswith("#") else default


def branding(request):
    gym = _resolve_gym(request)
    if gym is None:
        return JsonResponse({
            "name": "FitPro Center",
            "primary_color": "#38BDF8",
            "secondary_color": "#22D3EE",
            "accent_color": "#4ADE80",
            "background_color": "#0F172A",
            "surface_color": "#1E293B",
            "font_family": "Cairo",
            "logo": None,
        })
    return JsonResponse({
        "id": str(gym.id),
        "slug": gym.slug,
        "name": gym.name,
        "description": gym.description,
        "primary_color": _hex(gym.primary_color, "#38BDF8"),
        "secondary_color": _hex(gym.secondary_color, "#22D3EE"),
        "accent_color": _hex(gym.accent_color, "#4ADE80"),
        "background_color": _hex(gym.background_color, "#0F172A"),
        "surface_color": _hex(gym.surface_color, "#1E293B"),
        "default_theme": getattr(gym, "default_theme", "dark"),
        "kind": getattr(gym, "kind", "gym"),
        "splash_title": getattr(gym, "splash_title", ""),
        "splash_tagline": getattr(gym, "splash_tagline", ""),
        "splash_style": getattr(gym, "splash_style", "gradient"),
        "banner": request.build_absolute_uri(gym.banner.url) if getattr(gym, "banner", None) and gym.banner else None,
        "background_image": request.build_absolute_uri(gym.background_image.url) if getattr(gym, "background_image", None) and gym.background_image else None,
        "splash_image": request.build_absolute_uri(gym.splash_image.url) if getattr(gym, "splash_image", None) and gym.splash_image else None,
        "font_family": gym.font_family or "Cairo",
        "font_weight_regular": gym.font_weight_regular,
        "font_weight_medium": gym.font_weight_medium,
        "font_weight_bold": gym.font_weight_bold,
        "logo": request.build_absolute_uri(gym.logo.url) if gym.logo else None,
        "contact_phone": gym.contact_phone,
        "instagram_url": gym.instagram_url,
        "website_url": gym.website_url,
    })


# ---------------- owner-limited appearance editing ----------------
APPEARANCE_COLORS = ["primary_color", "accent_color", "background_color"]
APPEARANCE_IMAGES = ["logo", "banner", "background_image", "splash_image"]
APPEARANCE_SPLASH = ["splash_title", "splash_tagline", "splash_style"]
COLOR_RE = re.compile(r"^#[0-9a-fA-F]{6}$")


def _owner_gym(request):
    """Gym admin -> his gym; trainer -> his (personal) gym. Clients: none."""
    if hasattr(request.user, "client_profile"):
        return None
    return request.user.get_gym()


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_appearance(request):
    gym = _owner_gym(request)
    if gym is None:
        return JsonResponse({"error": "غير متاح لهذا الدور"}, status=403)

    def _url(f):
        img = getattr(gym, f, None)
        return request.build_absolute_uri(img.url) if img else None

    return JsonResponse({
        "slug": gym.slug,
        "subdomain": f"{gym.slug}.fitpro.hftv.qzz.io",
        "primary_color": gym.primary_color,
        "accent_color": gym.accent_color,
        "background_color": gym.background_color,
        "default_theme": gym.default_theme,
        "logo": _url("logo"),
        "banner": _url("banner"),
        "background_image": _url("background_image"),
        "splash_title": gym.splash_title,
        "splash_tagline": gym.splash_tagline,
        "splash_style": gym.splash_style,
        "splash_image": _url("splash_image"),
    })


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def my_appearance_update(request):
    gym = _owner_gym(request)
    if gym is None:
        return JsonResponse({"error": "غير متاح لهذا الدور"}, status=403)

    changed = []
    for c in APPEARANCE_COLORS:
        if c in request.data:
            val = (request.data.get(c) or "").strip()
            if not COLOR_RE.match(val):
                return JsonResponse({"error": f"{c}: لون غير صالح (#RRGGBB)"}, status=400)
            setattr(gym, c, val)
            changed.append(c)

    if "default_theme" in request.data:
        t = request.data.get("default_theme")
        if t not in ("dark", "light"):
            return JsonResponse({"error": "default_theme: dark|light"}, status=400)
        gym.default_theme = t
        changed.append("default_theme")

    for s in APPEARANCE_SPLASH:
        if s in request.data:
            val = str(request.data.get(s) or "").strip()
            setattr(gym, s, val[:200])
            changed.append(s)
    if "splash_style" in request.data and request.data["splash_style"] not in ("gradient", "solid", "minimal"):
        return JsonResponse({"error": "splash_style غير صالح"}, status=400)

    import json as _json
    for img_field in APPEARANCE_IMAGES:
        if img_field not in request.data:
            continue
        raw = request.data.get(img_field)
        if raw is None or raw == "" or raw == "null":
            setattr(gym, img_field, None)
            changed.append(img_field + ":cleared")
            continue
        fobj = request.FILES.get(img_field)
        if fobj is not None:
            setattr(gym, img_field, fobj)
            changed.append(img_field + ":uploaded")
            continue
        try:
            if _json.loads(raw) is None:
                setattr(gym, img_field, None)
                changed.append(img_field + ":cleared")
        except Exception:
            return JsonResponse({"error": f"{img_field}: ملف أو null"}, status=400)

    gym.save()
    out = {c: getattr(gym, c) for c in APPEARANCE_COLORS}
    out.update({"changed": changed, "ok": True})
    return JsonResponse(out)
