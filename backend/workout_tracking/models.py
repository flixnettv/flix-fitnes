from django.db import models


class ClientPlan(models.Model):
    client = models.ForeignKey('acct.User', on_delete=models.CASCADE, related_name='client_plans', verbose_name='العميل')
    plan = models.ForeignKey('exercise_db.WorkoutPlan', on_delete=models.CASCADE, verbose_name='الخطة')
    coach = models.ForeignKey('acct.User', on_delete=models.CASCADE, related_name='assigned_plans', verbose_name='المدرب')
    start_date = models.DateField('تاريخ البداية')
    end_date = models.DateField('تاريخ النهاية', blank=True, null=True)
    is_active = models.BooleanField('نشط', default=True)
    notes = models.TextField('ملاحظات', blank=True)
    created_at = models.DateTimeField('تاريخ الإنشاء', auto_now_add=True)

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

    class Meta:
        verbose_name = 'سجل تمرين'
        verbose_name_plural = 'سجلات التمارين'
        ordering = ['created_at']

    def __str__(self):
        return f'{self.exercise.name_ar or self.exercise.name} - {self.sets_completed}×{self.reps_completed}'
