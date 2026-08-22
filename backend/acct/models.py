from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid


class User(AbstractUser):
    ROLE_CHOICES = [
        ('owner', 'المالك'),
        ('coach', 'المدرب'),
        ('client', 'العميل'),
    ]

    role = models.CharField('الدور', max_length=10, choices=ROLE_CHOICES, default='client')
    phone = models.CharField('الهاتف', max_length=20, blank=True)
    avatar = models.ImageField('الصورة', upload_to='avatars/', blank=True, null=True)
    birthdate = models.DateField('تاريخ الميلاد', blank=True, null=True)
    gender = models.CharField('الجنس', max_length=1, choices=[('M', 'ذكر'), ('F', 'أنثى')], blank=True)
    height_cm = models.PositiveIntegerField('الطول (سم)', blank=True, null=True)
    bio = models.TextField('نبذة', blank=True)

    # Coach fields
    specializations = models.CharField('التخصصات', max_length=255, blank=True)
    experience_years = models.PositiveIntegerField('سنوات الخبرة', blank=True, null=True)

    # Client fields
    assigned_coach = models.ForeignKey(
        'self', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='clients', verbose_name='المدرب المسؤول'
    )
    medical_notes = models.TextField('ملاحظات طبية', blank=True)
    goals = models.TextField('الأهداف', blank=True)

    class Meta:
        verbose_name = 'المستخدم'
        verbose_name_plural = 'المستخدمون'

    def __str__(self):
        return f'{self.get_full_name()} ({self.get_role_display()})'

    @property
    def is_owner(self):
        return self.role == 'owner'

    @property
    def is_coach(self):
        return self.role == 'coach'

    @property
    def is_client(self):
        return self.role == 'client'


class CoachProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='coach_profile', verbose_name='المدرب')
    slug = models.SlugField('الرابط الفريد', unique=True, allow_unicode=True, help_text='يُستخدم في الرابط: /coach/{slug}/')
    display_name = models.CharField('اسم العرض', max_length=100)
    logo = models.ImageField('اللوجو', upload_to='coach_logos/', blank=True, null=True)
    tagline = models.CharField('الشعار', max_length=255, blank=True, help_text='جملة قصيرة تحت الاسم')
    description = models.TextField('الوصف', blank=True)

    # Branding colors
    primary_color = models.CharField('اللون الرئيسي', max_length=7, default='#22c55e', help_text='hex color like #22c55e')
    secondary_color = models.CharField('اللون الثانوي', max_length=7, default='#16a34a')
    background_color = models.CharField('لون الخلفية', max_length=7, default='#f0fdf4')
    text_color = models.CharField('لون النص', max_length=7, default='#14532d')
    font_family = models.CharField('الخط', max_length=100, default='Tajawal', help_text='اسم الخط من Google Fonts')

    # Contact
    contact_phone = models.CharField('هاتف التواصل', max_length=20, blank=True)
    contact_email = models.EmailField('بريد التواصل', blank=True)

    # Social links
    social_instagram = models.URLField('Instagram', blank=True)
    social_twitter = models.URLField('Twitter/X', blank=True)
    social_tiktok = models.URLField('TikTok', blank=True)
    social_youtube = models.URLField('YouTube', blank=True)

    is_active = models.BooleanField('مفعل', default=True)
    created_at = models.DateTimeField('تاريخ الإنشاء', auto_now_add=True)
    updated_at = models.DateTimeField('تاريخ التعديل', auto_now=True)

    class Meta:
        verbose_name = 'بروفايل المدرب'
        verbose_name_plural = 'بروفايلات المدربين'

    def __str__(self):
        return f'{self.display_name} ({self.slug})'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = uuid.uuid4().hex[:8]
        super().save(*args, **kwargs)
