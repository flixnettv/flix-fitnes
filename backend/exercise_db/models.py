from django.db import models


class ExerciseCategory(models.Model):
    name = models.CharField('الاسم', max_length=100)
    name_ar = models.CharField('الاسم بالعربي', max_length=100, blank=True)
    icon = models.CharField('الأيقونة', max_length=50, blank=True)
    description = models.TextField('الوصف', blank=True)

    class Meta:
        verbose_name = 'فئة التمرين'
        verbose_name_plural = 'فئات التمارين'
        ordering = ['name']

    def __str__(self):
        return self.name_ar or self.name


class MuscleGroup(models.Model):
    MUSCLE_CHOICES = [
        ('chest', 'الصدر'), ('back', 'الظهر'), ('shoulders', 'الكتف'),
        ('biceps', 'البايسبس'), ('triceps', 'الترايسبس'), ('legs', 'الرجلين'),
        ('core', 'البطن'), ('glutes', 'المؤخرة'), ('calves', 'السمانة'),
        ('forearms', 'الساعد'),
    ]
    name = models.CharField('الاسم', max_length=50, unique=True)
    is_front = models.BooleanField('من الأمام', default=True)
    image = models.ImageField('الصورة', upload_to='muscles/', blank=True, null=True)

    class Meta:
        verbose_name = 'مجموعة عضلية'
        verbose_name_plural = 'مجموعات عضلية'
        ordering = ['name']

    def __str__(self):
        return self.name


class Equipment(models.Model):
    name = models.CharField('الاسم', max_length=100)
    name_ar = models.CharField('الاسم بالعربي', max_length=100, blank=True)
    description = models.TextField('الوصف', blank=True)

    class Meta:
        verbose_name = 'معدات'
        verbose_name_plural = 'معدات'
        ordering = ['name']

    def __str__(self):
        return self.name_ar or self.name


class Exercise(models.Model):
    DIFFICULTY_CHOICES = [
        ('beginner', 'مبتدئ'),
        ('intermediate', 'متوسط'),
        ('advanced', 'متقدم'),
    ]
    name = models.CharField('الاسم', max_length=200)
    name_ar = models.CharField('الاسم بالعربي', max_length=200, blank=True)
    category = models.ForeignKey(ExerciseCategory, on_delete=models.CASCADE, verbose_name='الفئة')
    primary_muscles = models.ManyToManyField(MuscleGroup, related_name='primary_exercises', verbose_name='العضلات الرئيسية')
    secondary_muscles = models.ManyToManyField(MuscleGroup, related_name='secondary_exercises', blank=True, verbose_name='العضلات الثانوية')
    equipment = models.ManyToManyField(Equipment, blank=True, verbose_name='المعدات')
    description = models.TextField('الوصف بالإنجليزية', blank=True)
    description_ar = models.TextField('الوصف بالعربي', blank=True)
    difficulty = models.CharField('المستوى', max_length=15, choices=DIFFICULTY_CHOICES, default='intermediate')
    instructions = models.TextField('التعليمات', blank=True)
    video_url = models.URLField('رابط الفيديو', blank=True)
    image = models.ImageField('الصورة', upload_to='exercises/', blank=True, null=True)

    class Meta:
        verbose_name = 'تمرين'
        verbose_name_plural = 'تمارين'
        ordering = ['name']

    def __str__(self):
        return self.name_ar or self.name


class WorkoutPlan(models.Model):
    name = models.CharField('اسم الخطة', max_length=200)
    coach = models.ForeignKey('acct.User', on_delete=models.CASCADE, related_name='created_plans', verbose_name='المدرب')
    description = models.TextField('الوصف', blank=True)
    difficulty = models.CharField('المستوى', max_length=15, choices=Exercise.DIFFICULTY_CHOICES, default='intermediate')
    duration_weeks = models.PositiveIntegerField('المدة (أسابيع)', default=4)
    is_template = models.BooleanField('قالب', default=False)
    created_at = models.DateTimeField('تاريخ الإنشاء', auto_now_add=True)

    class Meta:
        verbose_name = 'خطة تدريب'
        verbose_name_plural = 'خطط التدريب'
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class WorkoutDay(models.Model):
    plan = models.ForeignKey(WorkoutPlan, on_delete=models.CASCADE, related_name='days', verbose_name='الخطة')
    name = models.CharField('اسم اليوم', max_length=200)
    day_number = models.PositiveIntegerField('رقم اليوم')
    description = models.TextField('الوصف', blank=True)

    class Meta:
        verbose_name = 'يوم تدريب'
        verbose_name_plural = 'أيام التدريب'
        ordering = ['day_number']
        unique_together = ['plan', 'day_number']

    def __str__(self):
        return f'{self.plan.name} - {self.name}'


class WorkoutExercise(models.Model):
    TYPE_CHOICES = [
        ('normal', 'عادي'),
        ('warmup', 'إحماء'),
        ('dropset', 'Drop Set'),
        ('superset', 'Superset'),
    ]
    day = models.ForeignKey(WorkoutDay, on_delete=models.CASCADE, related_name='exercises', verbose_name='اليوم')
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE, verbose_name='التمرين')
    sets = models.PositiveIntegerField('المجموعات', default=3)
    reps = models.CharField('التكرارات', max_length=50, default='8-12')
    weight = models.DecimalField('الوزن (كجم)', max_digits=6, decimal_places=2, blank=True, null=True)
    rest_seconds = models.PositiveIntegerField('وقت الراحة (ثانية)', default=60)
    order = models.PositiveIntegerField('الترتيب', default=0)
    notes = models.TextField('ملاحظات', blank=True)
    exercise_type = models.CharField('نوع التمرين', max_length=10, choices=TYPE_CHOICES, default='normal')

    class Meta:
        verbose_name = 'تمرين في اليوم'
        verbose_name_plural = 'تمارين الأيام'
        ordering = ['order']

    def __str__(self):
        return f'{self.exercise.name_ar or self.exercise.name} - {self.sets}×{self.reps}'
