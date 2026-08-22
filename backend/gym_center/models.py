from django.db import models


class GymCenter(models.Model):
    name = models.CharField('اسم المركز', max_length=200)
    phone = models.CharField('الهاتف', max_length=20, blank=True)
    email = models.EmailField('البريد الإلكتروني', blank=True)
    address = models.TextField('العنوان', blank=True)
    logo = models.ImageField('الشعار', upload_to='gym_logos/', blank=True, null=True)
    owner = models.ForeignKey('acct.User', on_delete=models.CASCADE, related_name='owned_gyms', verbose_name='المالك')
    created_at = models.DateTimeField('تاريخ الإنشاء', auto_now_add=True)

    class Meta:
        verbose_name = 'مركز رياضي'
        verbose_name_plural = 'مراكز رياضية'
        ordering = ['name']

    def __str__(self):
        return self.name


class Membership(models.Model):
    TYPE_CHOICES = [
        ('monthly', 'شهري'),
        ('quarterly', '3 أشهر'),
        ('yearly', 'سنوي'),
        ('lifetime', ' مدى الحياة'),
    ]
    client = models.ForeignKey('acct.User', on_delete=models.CASCADE, related_name='memberships', verbose_name='العميل')
    gym = models.ForeignKey(GymCenter, on_delete=models.CASCADE, verbose_name='المركز')
    coach = models.ForeignKey('acct.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='coached_memberships', verbose_name='المدرب')
    start_date = models.DateField('تاريخ البداية')
    end_date = models.DateField('تاريخ النهاية', blank=True, null=True)
    is_active = models.BooleanField('نشط', default=True)
    membership_type = models.CharField('نوع العضوية', max_length=15, choices=TYPE_CHOICES, default='monthly')
    activated_by = models.ForeignKey('acct.User', on_delete=models.SET_NULL, null=True, related_name='activated_memberships', verbose_name='فعّلها')
    notes = models.TextField('ملاحظات', blank=True)
    created_at = models.DateTimeField('تاريخ الإنشاء', auto_now_add=True)

    class Meta:
        verbose_name = 'عضوية'
        verbose_name_plural = 'عضويات'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.client.get_full_name()} - {self.gym.name} ({self.get_membership_type_display()})'


class Attendance(models.Model):
    client = models.ForeignKey('acct.User', on_delete=models.CASCADE, related_name='attendances', verbose_name='العميل')
    gym = models.ForeignKey(GymCenter, on_delete=models.CASCADE, verbose_name='المركز')
    check_in = models.DateTimeField('وقت الدخول')
    check_out = models.DateTimeField('وقت الخروج', blank=True, null=True)
    qr_code = models.CharField('رمز QR', max_length=100, blank=True)

    class Meta:
        verbose_name = 'حضور'
        verbose_name_plural = 'حضور'
        ordering = ['-check_in']

    def __str__(self):
        return f'{self.client.get_full_name()} - {self.check_in}'
