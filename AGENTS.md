# قواعد البيئة الحاكمة — FitPro Center — اقرأ قبل أي تنفيذ

## ⚠️ قاعدة فصل البيئات (لا تُخترق أبداً)

**الجهاز المحلي = للتنفيذ فقط**
- تعديل الكود المصدري للواجهة (flutter-app/, dashboard-react/src)
- البناء المحلي (npm run build / flutter build) للمعاينة السريعة فقط
- لا يمكن الاعتماد عليه في **أي تكامل** ولا اختبار تكامل
- ممنوع اعتباره مصدر حقيقة للنشر

**الخادم 65.75.200.19 = بيئة التكامل والإنتاج الوحيدة**
- مصدر الحقيقة الوحيد: `/home/flix/fitpro-center` (git: https://github.com/flixnettv/flix-fitnes.git فرع main)
- Backend الحقيقي: `/home/flix/fitpro-center/backend` (تطبيقات: acct, gym_center, workout_tracking, nutrition_plan, body_measurements, exercise_db, notif)
- أي تعديل Backend: عبر SSH مباشرة على مسارات الخادم المذكورة، ثم `docker cp` إلى الحاويتين `/app/src/fitpro/` **و** `/usr/local/lib/python3.12/site-packages/fitpro/` ثم `docker restart`
- التحقق من أي تكامل: دائماً على النطاق الحي (`curl https://fitpro.hftv.qzz.io/...` أو متصفح) — **أبداً محلياً**

## 📦 تقسيم المشروع الصحيح

| الجزء | المصدر الحقيقي | النشر |
|-------|--------|-------|
| واجهة React (Dashboard) | محلي: /home/flix/Desktop/tar/ (مؤقت) → ينقل إلى الخادم: /home/flix/fitpro-center/dashboard-react/ | `npm run build` محلي ← tar ← scp ← `/home/flix/fitpro-center/dashboard-react/dist-official/` ثم Nginx |
| واجهة Flutter | `/home/flix/fitpro-center/flutter-app` | `flutter build web` على الخادم عبر docker |
| Backend Django | `/home/flix/fitpro-center/backend` | `COPY backend/ .` في Dockerfile.backend |
| Nginx | `/home/flix/fitpro-center/nginx/` | حاوية fitpro-web-static |
| Traefik dynamic | `/data/coolify/proxy/dynamic/fitpro-gyms.yml` | مراقب تلقائياً — يُحدَّث من Backend عند إنشاء صالة |

## 🚫 أخطاء لا تتكرر (مستفادة بالدم)

1. **لا تخلط** مسارات محلية وبعيدة في نفس سكربت التعديل — قسّمه: سكربت محلي + سكربت يُنقل عبر scp
2. **heredoc عبر SSH يفسد الملفات** (يحذف علامات الاقتباس) — النقل دائماً: write محلي ← scp ← python3
3. **باك إند الحاوية له مساران للكود**: `/app/src/fitpro/` (يُحمَّل أولاً — يحجب الآخر!) و `site-packages/fitpro/` — حدّث **كليهما** دائماً
4. **preload_app=True**: `kill -HUP` لا يكفي — أي تغيير urlconf/models يتطلب `docker restart` كامل
5. **حقول تُحقن في perform_create** (client/gym/trainer) يجب أن تكون `read_only=True` في السيريالايزر وإلا فشل 400
6. **ترتيب مسارات Django**: المسارات الحرفية قبل `include()` — ومسار التفاصيل `^(pk)/$` يلتهم أي كلمة ثابتة مسجلة بعده (سجّل المحدد أولاً)
7. **Traefik v3.6**: `HostRegexp` مع `{var}` مكسور — استخدم regex مباشر بلا أقواس؛ شهادات الصب دومينات عبر **ملف ديناميكي** (مجلد dynamic مُراقب) لا عبر docker labels
8. **مشروع Coolify المكرر**: يوجد مشروعان باسم FitPro Center (id 9 قديم فيه wger-fitness, id 10 جديد فارغ). المصدر الحقيقي هو id 10. احذف/أرشف id 9.

## 🔑 بيانات الدخول الحية

| الدور | البريد | كلمة المرور |
|-------|--------|--------------|
| إدارة المنصة | flixnettv@gmail.com | #Flix1571980 |
| مدير صالة (ديمو) | manager@fitpro.hftv.qzz.io | Manager2026! |
| مدرب | trainer@fitpro.hftv.qzz.io | Trainer2026! |
| مدربة مستقلة | coach.sara@fitpro.hftv.qzz.io | Trainer2026! |
| متدربون | client1..5@fitpro.hftv.qzz.io | Client2026! |

## 🌐 النطاقات

- `fitpro.hftv.qzz.io` — بوابة إدارة المنصة (الوحيدة بمبدّل الصالات والتسويق)
- `{slug}.fitpro.hftv.qzz.io` — تطبيق مستقل لكل حساب بشاشة دخول مغلقة بهويته
- `/pwa/` تطبيق Flutter · `/pair/` صفحة إقران الأجهزة · `/api/v1/` الواجهة الخلفية

## 🚀 النشر الحصري عبر Coolify

- **ممنوع** `docker cp` اليدوي الدائم أو `scp build` كمسار نشر نهائي — هو فقط للطوارئ/المعاينة
- **المسار المعتمد**: تعديل في `/home/flix/fitpro-center` → `git add` → `git commit` → `git push origin main` → Coolify يبني وينشر تلقائياً (Dockerfile.backend)
- التحقق بعد النشر: `curl https://fitpro.hftv.qzz.io/api/v1/gyms/branding/` + متصفح
