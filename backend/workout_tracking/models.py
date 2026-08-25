from django.db import models

# === ORIGINAL MODELS PRESERVED ===

class ClientPlan(models.Model):
    client = models.ForeignKey('acct.User', on_delete=models.CASCADE, related_name='client_plans', verbose_name='العميل')
    plan = models.ForeignKey('exercise_db.WorkoutPlan', on_delete=models.CASCADE, verbose_name='الخطة')
    coach = models.ForeignKey('acct.User', on_delete=models.CASCADE, related_name='assigned_plans', verbose_name='المدرب')
    start_date = models.DateField('تاريخ البداية')
    end_date = models.DateField('تاريخ النهاية', blank=True, null=True)
    is_active = models.BooleanField('نشط', default=True)
    notes = models.TextField('ملاحظات', blank=True)
    created_at = models.DateTimeField('تاريخ الإنشاء', auto_now_add=True)
    # === ADDITIVE: tenant & sync fields from fitpro.workout.WorkoutPlan ===
    gym = models.ForeignKey('gym_center.GymCenter', on_delete=models.CASCADE, null=True, blank=True, verbose_name='الصالة')
    tenant_id = models.UUIDField(null=True, blank=True, editable=False, db_index=True)
    days_sync = models.JSONField('مزامنة الأيام', default=dict, blank=True, help_text='Per-client days sync: {"day_id": "synced"}')
    # client FK already exists (client field above) - keep compatibility
    # additional per-client assignment fields mirroring source
    assigned_client_profile = models.ForeignKey('acct.ClientProfile', on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_workout_plans_via_tracking', verbose_name='العميل (بروفايل)')
    is_template = models.BooleanField('قالب', default=False)
    level = models.CharField('المستوى', max_length=20, default='beginner', blank=True)
    goal = models.CharField('الهدف', max_length=20, default='general', blank=True)

    class Meta:
        verbose_name = 'خطة العميل'
        verbose_name_plural = 'خطط العملاء'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.client.get_full_name()} - {self.plan.name}'


class WorkoutSession(models.Model):
    client = models.ForeignKey('acct.User', on_delete=models.CASCADE, related_name='workout_sessions', verbose_name='العميل')
    date = models.DateField('التاريخ')
    day = models.ForeignKey('exercise_db.WorkoutDay', on_delete=models.SET_NULL, null=True, verbose_name='اليوم')
    plan = models.ForeignKey(ClientPlan, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='الخطة')
    start_time = models.TimeField('وقت البداية', blank=True, null=True)
    end_time = models.TimeField('وقت النهاية', blank=True, null=True)
    notes = models.TextField('ملاحظات', blank=True)
    rating = models.PositiveIntegerField('التقييم', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    # === ADDITIVE ===
    gym = models.ForeignKey('gym_center.GymCenter', on_delete=models.CASCADE, null=True, blank=True)
    client_profile = models.ForeignKey('acct.ClientProfile', on_delete=models.SET_NULL, null=True, blank=True, related_name='workout_sessions_profile')
    started_at = models.DateTimeField('بدأت في', null=True, blank=True)
    completed_at = models.DateTimeField('اكتملت في', null=True, blank=True)
    duration_minutes = models.PositiveIntegerField('المدة (دقيقة)', null=True, blank=True)
    status = models.CharField('الحالة', max_length=20, choices=[('in_progress','قيد التنفيذ'),('completed','مكتمل'),('skipped','متخطى')], default='in_progress', blank=True)
    trainer_feedback = models.TextField('ملاحظات المدرب', blank=True)

    class Meta:
        verbose_name = 'جلسة تدريب'
        verbose_name_plural = 'جلسات التدريب'
        ordering = ['-date']

    def __str__(self):
        return f'{self.client.get_full_name()} - {self.date}'


class WorkoutLog(models.Model):
    session = models.ForeignKey(WorkoutSession, on_delete=models.CASCADE, related_name='logs', verbose_name='الجلسة')
    exercise = models.ForeignKey('exercise_db.Exercise', on_delete=models.CASCADE, verbose_name='التمرين')
    sets_completed = models.PositiveIntegerField('المجموعات المنجزة')
    reps_completed = models.CharField('التكرارات المنجزة', max_length=50)
    weight_used = models.DecimalField('الوزن المستخدم (كجم)', max_digits=6, decimal_places=2, blank=True, null=True)
    rest_taken = models.PositiveIntegerField('الراحة المأخوذة (ثانية)', blank=True, null=True)
    rir = models.PositiveIntegerField('RIR', blank=True, null=True)
    notes = models.TextField('ملاحظات', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    # === ADDITIVE from fitpro.workout.WorkoutLog ===
    client_profile = models.ForeignKey('acct.ClientProfile', on_delete=models.SET_NULL, null=True, blank=True, related_name='workout_logs_via_tracking')
    gym = models.ForeignKey('gym_center.GymCenter', on_delete=models.CASCADE, null=True, blank=True)

    class Meta:
        verbose_name = 'سجل تمرين'
        verbose_name_plural = 'سجلات التمارين'
        ordering = ['created_at']

    def __str__(self):
        return f'{self.exercise.name_ar or self.exercise.name} - {self.sets_completed}×{self.reps_completed}'


# === ADDITIVE MODELS from fitpro.workout (Exercise, WorkoutPlan helpers) mirrored as tenant-aware ===

class TenantExercise(models.Model):
    """Mirrored from fitpro.workout.Exercise for tenant isolation - additive, not replacing exercise_db.Exercise"""
    id = models.UUIDField(primary_key=True, default=__import__('uuid').uuid4, editable=False)
    gym = models.ForeignKey('gym_center.GymCenter', on_delete=models.CASCADE, null=True, blank=True, related_name='tenant_exercises')
    name = models.CharField('الاسم', max_length=200)
    name_ar = models.CharField('الاسم عربي', max_length=200, blank=True)
    description = models.TextField('الوصف', blank=True)
    muscle_group = models.CharField('المجموعة العضلية', max_length=20, default='chest', blank=True)
    equipment = models.CharField('المعدات', max_length=20, default='bodyweight', blank=True)
    difficulty = models.CharField('الصعوبة', max_length=20, default='beginner', blank=True)
    video_url = models.URLField(blank=True)
    is_custom = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        verbose_name = 'تمرين مستأجر'
        verbose_name_plural = 'تمارين مستأجرة'
        ordering = ['name']
    def __str__(self):
        return self.name_ar or self.name

class ClientWorkoutDaySync(models.Model):
    """Per-client days sync - additive helper for per-client days"""
    id = models.UUIDField(primary_key=True, default=__import__('uuid').uuid4, editable=False)
    client = models.ForeignKey('acct.User', on_delete=models.CASCADE, related_name='workout_day_syncs')
    client_profile = models.ForeignKey('acct.ClientProfile', on_delete=models.CASCADE, null=True, blank=True, related_name='day_syncs')
    plan = models.ForeignKey('exercise_db.WorkoutPlan', on_delete=models.CASCADE, null=True, blank=True)
    day = models.ForeignKey('exercise_db.WorkoutDay', on_delete=models.CASCADE)
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    gym = models.ForeignKey('gym_center.GymCenter', on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        verbose_name = 'مزامنة يوم العميل'
        verbose_name_plural = 'مزامنة أيام العملاء'
        unique_together = [('client', 'day')]
    def __str__(self):
        return f"{self.client} - {self.day} - {'done' if self.is_completed else 'pending'}"
