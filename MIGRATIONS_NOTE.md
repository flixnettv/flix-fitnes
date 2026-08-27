# ملاحظة Migrations - FitPro Center Backend المُوحد

## الوضع الحالي
- تم إنشاء المشروع من الصفر (لا توجد migrations تاريخية محفوظة في هذا المسار الجديد `/home/flix/fitpro-center/backend`).
- جميع التطبيقات تحتوي فقط على `migrations/__init__.py` — أي **لا توجد migrations مُطبّقة بعد**.

## المطلوب تنفيذه يدوياً (بعد المراجعة)

```bash
PYTHONPATH=/home/flix/fitpro-center/backend python backend/manage.py makemigrations
# أو
PYTHONPATH=backend python manage.py makemigrations  # من جذر fitpro-center

# سينشئ:
# - acct 0001: User, TrainerProfile, ClientProfile, GymAdminProfile, UserProfile
# - gym_center 0001: Gym (مع الحقول الجديدة kind/default_theme/banner/background_image/splash_*)
# - workout_tracking 0001: Exercise, WorkoutPlan, WorkoutDay, WorkoutExercise, WorkoutLog
# - nutrition_plan 0001: Food, MealPlan, Meal, MealFood, NutritionLog
# - progress 0001: ProgressPhoto, Goal, WeeklyCheckin
# - body_measurements 0001: BodyMeasurement
# - devices 0001: Device, DeviceData
# - exercise_db 0001: ExerciseCatalog
# - notif 0001: Notification

# ثم التطبيق:
python manage.py migrate
```

## لماذا لم ننفذها تلقائياً؟
- حتى لا **نكسر** أي migrations موجودة سابقاً في مستودع GitHub (إن كانت موجودة على فرع آخر).
- الحقل الجديد `gym` في `TenantBaseModel` أصبح `null=True, blank=True` عمداً — يسمح بتشغيل `makemigrations` دون الحاجة لـ default للـ data القديمة.
- الحقول الجديدة في `Gym` (kind, default_theme, banner, background_image, splash_*) كلها `blank=True/null=True/default=...` — لن تتسبب في فشل `migrate --fake-initial`.

## تحذيرات
- إذا كان الـ production الحالي به migrations قديمة، يفضل إنشاء migration واحد إضافي (`0002_add_branding_fields`) بدلاً من إعادة كتابة `0001_initial`.
- راجع `gym_center/migrations` قبل الدمج مع `main` على GitHub.
- تأكد من وجود Pillow في البيئة (مُدرج في requirements.txt) قبل `migrate` بسبب ImageFields.
