"""
Devices API (ported) - JWT endpoints + public QR/webhook
Adapted imports: fitpro.devices -> devices, fitpro.core -> core
"""
from datetime import timedelta
from django.http import JsonResponse
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .models import Device, DeviceReading

VALID_METRICS = {"weight_kg", "body_fat", "bpm", "steps", "sleep_h"}

def _client(request):
    return getattr(request.user, "client_profile", None)

def _device_json(d: Device, latest=None) -> dict:
    return {"id": str(d.id), "kind": d.kind, "name": d.name, "brand": d.brand, "status": d.status, "pairing_code": d.pairing_code if d.status == "pending" else None, "last_sync": d.last_sync.isoformat() if d.last_sync else None, "latest": latest or {}}

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def pair_start(request):
    cp = _client(request)
    if cp is None:
        return JsonResponse({"error": "حساب متدرب فقط"}, status=403)
    kind = request.data.get("kind", "scale")
    if kind not in ("scale", "watch", "band"):
        kind = "scale"
    name = (request.data.get("name") or "Smart Scale").strip()[:100]
    brand = (request.data.get("brand") or "").strip()[:60]
    d = Device(gym_id=getattr(cp, "gym_id", None), client=cp, kind=kind, name=name, brand=brand)
    if hasattr(d, "gym_id"):
        d.gym_id = cp.gym_id
    d.save()
    code = d.issue_code()
    origin = request.get_host()
    scheme = "https"
    qr_url = f"{scheme}://{origin}/pair/?c={code}"
    return JsonResponse({"id": str(d.id), "code": code, "qr_url": qr_url, "expires_in": 900, "status": "pending"}, status=201)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def mine(request):
    cp = _client(request)
    if cp is None:
        return JsonResponse([], safe=False)
    out = []
    for d in Device.objects.filter(client=cp).exclude(status="revoked"):
        latest = {}
        for m in ("weight_kg", "body_fat", "bpm", "steps"):
            r = d.readings.filter(metric=m).order_by("-recorded_at").first()
            if r:
                latest[m] = float(r.value)
                if m == "weight_kg":
                    latest["at"] = r.recorded_at.isoformat()
        out.append(_device_json(d, latest))
    return JsonResponse(out, safe=False)

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def unpair(request, device_id):
    cp = _client(request)
    if cp is None:
        return JsonResponse({"error": "غير مسموح"}, status=403)
    try:
        d = Device.objects.get(id=device_id, client=cp)
    except Device.DoesNotExist:
        return JsonResponse({"error": "غير موجود"}, status=404)
    d.status = "revoked"
    d.save(update_fields=["status"])
    return JsonResponse({"ok": True})

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def metrics(request):
    cp = _client(request)
    if cp is None:
        return JsonResponse([], safe=False)
    metric = request.GET.get("metric", "weight_kg")
    if metric not in VALID_METRICS:
        return JsonResponse({"error": "metric غير معروف"}, status=400)
    days = min(int(request.GET.get("days", 30) or 30), 180)
    since = timezone.now() - timedelta(days=days)
    qs = DeviceReading.objects.filter(device__client=cp, metric=metric, recorded_at__gte=since).order_by("recorded_at").values_list("recorded_at", "value")
    return JsonResponse([{"t": t.isoformat(), "v": float(v)} for t, v in qs], safe=False)

@api_view(["POST"])
@permission_classes([])
def confirm(request, code):
    try:
        d = Device.objects.get(pairing_code=code, status="pending")
    except Device.DoesNotExist:
        return JsonResponse({"error": "رمز غير صالح"}, status=404)
    if not d.code_valid:
        return JsonResponse({"error": "انتهت صلاحية الرمز"}, status=410)
    d.status = "active"
    d.last_sync = timezone.now()
    d.save(update_fields=["status", "last_sync"])
    return JsonResponse({"ok": True, "device": d.name, "ingest_token": d.ingest_token, "hint": "أرسل القياسات إلى /devices/ingest/<token>/"})

@api_view(["POST"])
@permission_classes([])
def ingest(request, token):
    try:
        d = Device.objects.get(ingest_token=token, status="active")
    except Device.DoesNotExist:
        return JsonResponse({"error": "token غير صالح"}, status=404)
    readings = request.data.get("readings") or []
    saved = 0
    for r in readings:
        metric = (r.get("metric") or "").strip()
        try:
            value = float(r.get("value"))
        except (TypeError, ValueError):
            continue
        if metric not in VALID_METRICS:
            continue
        DeviceReading.objects.create(device=d, gym_id=d.gym_id, client_id=d.client_id, metric=metric, value=value)
        saved += 1
    d.last_sync = timezone.now()
    d.save(update_fields=["last_sync"])
    return JsonResponse({"ok": True, "saved": saved})
