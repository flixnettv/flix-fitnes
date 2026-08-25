"""
Public Gym Branding API - White-label theming source (ported from fitpro.core.branding)
Adapted: fitpro.gym -> gym_center, fitpro.core.branding -> core.branding
"""
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
import re
from django.http import JsonResponse


def _resolve_gym(request):
    """Resolve gym by Host header: custom_domain > subdomain > first active."""
    from gym_center.models import GymCenter
    host = (request.get_host() or "").split(":")[0].lower()
    gym = None
    if host:
        gym = GymCenter.objects.filter(is_active=True, custom_domain=host).first()
        if gym is None and "." in host:
            sub = host.split(".")[0]
            gym = GymCenter.objects.filter(is_active=True, subdomain=sub).first()
    if gym is None:
        gym = GymCenter.objects.filter(is_active=True).order_by("created_at").first()
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
        "description": getattr(gym, "description", ""),
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
        "banner": request.build_absolute_uri(gym.banner.url) if getattr(gym, "banner", None) else None,
        "background_image": request.build_absolute_uri(gym.background_image.url) if getattr(gym, "background_image", None) else None,
        "splash_image": request.build_absolute_uri(gym.splash_image.url) if getattr(gym, "splash_image", None) else None,
        "font_family": gym.font_family or "Cairo",
        "logo": request.build_absolute_uri(gym.logo.url) if gym.logo else None,
        "contact_phone": getattr(gym, "phone", ""),
        "contact_email": getattr(gym, "email", ""),
    })


APPEARANCE_COLORS = ["primary_color", "accent_color", "background_color"]
APPEARANCE_IMAGES = ["logo", "banner", "background_image", "splash_image"]
APPEARANCE_SPLASH = ["splash_title", "splash_tagline", "splash_style"]
COLOR_RE = re.compile(r"^#[0-9a-fA-F]{6}$")


def _owner_gym(request):
    if hasattr(request.user, "client_profile"):
        return None
    try:
        return request.user.get_gym()
    except AttributeError:
        if hasattr(request.user, "gym_admin_profile"):
            return request.user.gym_admin_profile.gym
        if hasattr(request.user, "coach_profile"):
            # coach may have gym via related? try to get via client? fallback
            try:
                from acct.models import CoachProfile
                cp = getattr(request.user, "coach_profile", None)
                if cp:
                    # CoachProfile currently no gym FK, try owned gyms
                    owned = request.user.owned_gyms.first()
                    if owned:
                        return owned
            except Exception:
                pass
        return None


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
        "slug": getattr(gym, "slug", ""),
        "subdomain": f"{getattr(gym, 'slug','')}.fitpro.hftv.qzz.io",
        "primary_color": getattr(gym, "primary_color", "#38BDF8"),
        "accent_color": getattr(gym, "accent_color", "#4ADE80"),
        "background_color": getattr(gym, "background_color", "#0F172A"),
        "default_theme": getattr(gym, "default_theme", "dark"),
        "logo": _url("logo"),
        "banner": _url("banner"),
        "background_image": _url("background_image"),
        "splash_title": getattr(gym, "splash_title", ""),
        "splash_tagline": getattr(gym, "splash_tagline", ""),
        "splash_style": getattr(gym, "splash_style", "gradient"),
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

import os
FITPRO_DYNAMIC_DIR = os.environ.get("FITPRO_DYNAMIC_DIR", "")

def sync_dynamic_entries():
    if not FITPRO_DYNAMIC_DIR:
        return "disabled"
    try:
        from gym_center.models import GymCenter
        gyms = GymCenter.objects.filter(is_active=True).exclude(slug="").values_list("slug", flat=True)
        lines = ["http:", "  routers:"]
        seen = set()
        for slug in gyms:
            if slug in seen:
                continue
            seen.add(slug)
            safe = re.sub(r"[^a-z0-9-]", "", slug)
            host = slug + ".fitpro.hftv.qzz.io"
            name = "fitpro-gym-" + safe
            lines += [
                "    " + name + ":",
                "      rule: 'Host(`" + host + "`)'",
                "      entryPoints: [https]",
                "      service: fitpro-static-svc",
                "      tls:",
                "        certResolver: letsencrypt",
                "    " + name + "-http:",
                "      rule: 'Host(`" + host + "`)'",
                "      entryPoints: [http]",
                "      middlewares: [redirect-to-https@docker]",
                "      service: fitpro-static-svc",
            ]
        if not seen:
            return "no gyms"
        lines += [
            "  services:",
            "    fitpro-static-svc:",
            "      loadBalancer:",
            "        servers:",
            "          - url: 'http://fitpro-web-static:80'",
        ]
        path = os.path.join(FITPRO_DYNAMIC_DIR, "fitpro-gyms.yml")
        tmp = path + ".tmp"
        with open(tmp, "w") as f:
            f.write("\n".join(lines) + "\n")
        os.replace(tmp, path)
        return "synced " + str(len(seen)) + " subdomains"
    except Exception as e:
        return "error: " + str(e)
