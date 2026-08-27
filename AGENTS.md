# قواعد البيئة الحاكمة — FitPro Center — اقرأ قبل أي تنفيذ

## ⚠️ قاعدة فصل البيئات (لا تُخترق أبداً)

**الجهاز المحلي = للتنفيذ فقط**
- تعديل الكود المصدري للواجهة (flutter-app/, dashboard-react/src)
- البناء المحلي (npm run build / flutter build) للمعاينة السريعة فقط
- لا يمكن الاعتماد عليه في **أي تكامل** ولا اختبار تكامل
- ممنوع اعتباره مصدر حقيقة للنشر

**الخادم 65.75.200.19 = بيئة التكامل والإنتاج الوحيدة**
- مصدر الحقيقة الوحيد: مستودع GitHub `https://github.com/flixnettv/flix-fitnes` فرع `main`
- النشر يتم عبر **Dokku** على الخادم: أي دفع إلى `main` (GitHub) ⇒ إعادة بناء عبر `Dockerfile` في جذر الريبو ⇒ إعادة نشر تلقائية لتطبيق `fitpro`
- أي كود يتوجب أولاً الدفع إلى `main` **ثم** التحقق على الحي — لا تعديل مباشر على الخادم إلا عبر تغيير في الريبو
- داخل الحاوية: Django في `/app` (Gunicorn:8000) + nginx داخلي :8080 (يوزع الواجهة/الـPWA/الـAPI) — الـ image يُعاد بناؤه بالكامل مع كل دفع، فلا توجد مسارات كود مزدوجة
- التحقق من أي تكامل: دائماً على النطاق الحي (`curl https://fitpro.hftv.qzz.io/...` أو متصفح) — **أبداً محلياً**

## 📦 تقسيم المشروع الصحيح (نشر Dokku)

| الجزء | المصدر الحقيقي | النشر (تُبنى في `Dockerfile`) |
|-------|--------|-------|
| واجهة React (Dashboard) | `dashboard-react/` | Stage 1 (node:20-alpine → `npm run build`) ⟶ يُخدم عند `/` من `/opt/web/dashboard` |
| واجهة Flutter (PWA) | `flutter-app/` | Stage 2 (flutter stable → `flutter build web --base-href /pwa/`) ⟶ يُخدم عند `/pwa/` |
| صفحة إقران الأجهزة | `pairpage/` | نسخة ثابتة ⟶ يُخدم عند `/pair/` |
| Backend Django | `backend/` | Stage 3 (python:3.12-slim: pip + `COPY backend/ .` + Gunicorn) |
| Nginx الداخلي | `nginx/dokku-default.conf` | يُنسخ إلى `/etc/nginx/conf.d/default.conf` — يوجّه `/api|admin|health|ready` إلى Django، و`/static`+`/media` من volume `/data` |
| قاعدة البيانات | خدمات Dokku: `fitpro-db` (Postgres) + `fitpro-cache` (Redis) | عبر `DATABASE_URL` و`REDIS_URL` المُحقنة من `dokku postgres:link` / `redis:link` |
| Celery | — | عملية `worker` في `Procfile` (من نفس الـ image) |

## 🧭 المنطق والتوجيه (الأدوار) — ثمرة الدراسة العميقة

**الهدف:** النظام متعدد الأدوار داخل أصل واحد `fitpro.hftv.qzz.io`:
- `super_admin` — منصة: إنشاء الصالات/المدربين المستقلين، فصل/تفعيل، حسابات وإعادة بواصير
- `gym_admin` — صالة: مدربوها وأعضاؤها ومظهرها وأجهزتها (`GymAdminProfile`)
- `trainer` — مدرب: عملاؤه وخططه وتغذيته وتطوره (`TrainerProfile` نشط)
- `client` — متدرب/عضو: تمارينه وتغذيته وأجهزته وتسجيل دخوله (`ClientProfile`)

**تدفق التوجيه وقت الدخول:**
1. `POST /api/v1/auth/login/` ← `MeSerializer` يعيد `role` حرفياً + `is_superuser` + `gym`
2. `dashboard-react/src/store.tsx` `activateUser`: `setRole(ROLE_MAP[u.role] ?? (u.isSuperuser ? "super" : "client"))`
3. `ROLE_MAP`: `super_admin→super` · `gym_admin→gymAdmin` · `trainer→trainer` · `client→client`
4. `Shell` يختار الواجهة: `SuperAdmin` / `GymAdmin` / `Trainer` / `ClientApp`

**القاعدة الذهبية (مستفادة):** الصلاحيات الفعلية تُمنح من **`is_superuser` + وجود الـ profiles** وليس من حقل `role` النصي — لكن الواجهة توجّه بـ `role` الحرفي. لذلك **يجب** أن يطابق `role` الـ profiles تماماً وإلا تتباعد الواجهة عن الصلاحيات.

**قرارات مُنفَّذة لإصلاح الانحراف:**
- Data migration `acct/0003_reconcile_roles` تُطبع الدور خارج القيم الصالحة: سوبر أدمن ⇒ `super_admin`، ثم بالـ profile.
- أمر إدارة `python manage.py reconcile_roles` (وإن شئت `--check`) لإعادة المطابقة عند الطلب.
- الواجهة: Fallback ذكي `?? (isSuperuser ? "super" : "client")` + **منعش الدور من `/auth/me/`** عند استعادة الجلسة (لا ثقة بالدور المخزن محلياً).
- `dokku/web.sh` + `entrypoint.sh`: إنشاء الحساب بدور `super_admin` (لم تعد `owner`).
- مدقّة الإنشاء انتهت: كل نقاط الإنشاء (`members_create`، `gym_member_create`، `create_trainer_account`، `TrainerAdminViewSet`، `GymViewSet.perform_create`) تضبط `user.role` بما يوافق الـ profile — لا فجوة.
- تنظيف `core/permissions.py`: حذف `IsOwnerOrGymStaff` المكرر الأول الناقص + إزالة شروط `hasattr` المتطابقة (محافظ على السلوك).

1. **لا تخلط** مسارات محلية وبعيدة في نفس سكربت التعديل — قسّمه: سكربت محلي + سكربت يُنقل عبر scp (يقلص الوضوح بعد Dokku لكنه قاعدة ذهبية حتى الآن)
2. **heredoc عبر SSH يفسد الملفات** (يحذف علامات الاقتباس) — النقل دائماً: write محلي ← scp ← python3
3. **كل تعديل يتطلب دفعاً لإعادة البناء** — لا يوجد تعديل "حي" على الحاوية: التغيير لابد أن يُلتقط في `main` ثم `git push` (ملفات/حذف/تعديل وأيضاً إضافة متغير بيئة جديد يتطلب إعادة دفع)
4. **نظام nginx الداخلي يعيد الكتابة**: لا تضع `X-Forwarded-Proto $scheme` داخل الحاوية — مرّر رأس الأصل من الطبقة الأولى (`$http_x_forwarded_proto`) وإلا دار حلقة `SECURE_SSL_REDIRECT` (301 لا نهائية)
5. **حقول تُحقن في perform_create** (client/gym/trainer) يجب أن تكون `read_only=True` في السيريالايزر وإلا فشل 400
6. **ترتيب مسارات Django**: المسارات الحرفية قبل `include()` — ومسار التفاصيل `^(pk)/$` يلتهم أي كلمة ثابتة مسجلة بعده (سجّل المحدد أولاً)
7. **النطاقات الفرعية `{slug}.fitpro.hftv.qzz.io`** لم تُنفَّذ على Dokku بعد (قيد التخطيط) — لا تعتمد على آليتها القديمة (Traefik dynamic)؛ تُضاف لاحقاً كآلية تحديث domains per-gym
8. **الـ volume الدائم**: `STATIC_ROOT=/data/static` و`MEDIA_ROOT=/data/media` على مسار الخادم `/var/lib/dokku/data/storage/fitpro-data/` — لا تُغيّر هذه القيم وإلا فُقدت المرفوعات/الستاتيك مع كل نشر

## 🔑 بيانات الدخول الحية

| الدور | البريد | كلمة المرور |
|-------|--------|--------------|
| إدارة المنصة (owner) | flixnettv@gmail.com | #Flix1571980 |

> ملاحظة: حسابات الديمو (مدير صالة/مدرب/مدربة/متدربون) كانت بياناتاً في قاعدة البيانات القديمة — **ليست جزءاً من الكود**. أُنشئت قاعدة جديدة نظيفة (Postgres عبر Dokku، `fitpro-db`)؛ تُعاد إنشاء هذه الحسابات من اللوحة بعد إنشاء أول صالة.

## 🌐 النطاقات

- `fitpro.hftv.qzz.io` — بوابة إدارة المنصة + API (نفس الأصل: `/api/v1/` + `/admin/`) — وذلك لأن الواجهة تستدعي `window.location.origin/api/v1`
- `{slug}.fitpro.hftv.qzz.io` — تطبيق مستقل لكل صالة بشاشة دخول بهويته — **قيد التطوير على Dokku** (خطوة لاحقة)
- `/pwa/` تطبيق Flutter · `/pair/` صفحة إقران الأجهزة · `/health/`·`/ready/` فحص الصحة · `/static/`·`/media/` من الـ volume الدائم

## 🚀 النشر عبر Dokku (المسار الحصري)

- **المسار المعتمد**: تعديل في الريبو → `git add` → `git commit` → `git push origin main` → GitHub (المصدر الحقيقي) + `git push dokku main` يعيد بناء التطبيق تلقائياً عبر `Dockerfile`
- **ممنوع** التعديل المباشر داخل الحاوية أو `docker cp`/`scp build` — الـ image يُبنى من الصفر عند كل دفع
- متغيرات البيئة لا تُعدَّل عبر الدفع: تُدار بآلية Dokku (`dokku config:set fitpro VAR=val`) وتحتاج إعادة دفع/إعادة نشر لتفعيلها
- أوامر تشغيلية سريعة (بعد SSH للخادم): `dokku ps:list fitpro` · `dokku logs fitpro -t` · `dokku ps:scale fitpro web=N worker=N` · النسخ احتياطي تلقائي يومي عبر `/root/scripts/backup.sh` (يشمل `fitpro-db` و`fitpro-cache`)
- التحقق بعد النشر: `curl -sI https://fitpro.hftv.qzz.io/health/` (توقع 200) ثم متصفح على `https://fitpro.hftv.qzz.io`
