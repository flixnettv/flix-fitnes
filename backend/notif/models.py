from django.db import models


class Notification(models.Model):
    TYPE_CHOICES = [
        ('workout_reminder', 'تذكير بالتمرين'),
        ('membership_expiry', 'انتهاء العضوية'),
        ('general', 'عام'),
        ('achievement', 'إنجاز'),
    ]
    user = models.ForeignKey('acct.User', on_delete=models.CASCADE, related_name='notifications', verbose_name='المستخدم')
    title = models.CharField('العنوان', max_length=200)
    message = models.TextField('الرسالة')
    notification_type = models.CharField('النوع', max_length=20, choices=TYPE_CHOICES, default='general')
    is_read = models.BooleanField('مقروء', default=False)
    created_at = models.DateTimeField('تاريخ الإنشاء', auto_now_add=True)
    link = models.CharField('الرابط', max_length=255, blank=True)

    class Meta:
        verbose_name = 'إشعار'
        verbose_name_plural = 'إشعارات'
        ordering = ['-created_at']

    def __str__(self):
        return self.title
