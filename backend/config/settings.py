import os
from datetime import timedelta
from pathlib import Path
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ['DJANGO_SECRET_KEY']

DEBUG = os.environ.get('DJANGO_DEBUG', os.environ.get('DEBUG', 'False')).lower() in ('true', '1', 'yes')

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', os.environ.get('DJANGO_ALLOWED_HOSTS', 'localhost,127.0.0.1,fitpro.hftv.qzz.io,api.fitpro.hftv.qzz.io')).split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'drf_spectacular',
    # Local apps (original + additive)
    'core',
    'acct',
    'exercise_db',
    'workout_tracking',
    'nutrition_plan',
    'body_measurements',
    'gym_center',
    'notif',
    'devices',
    'progress',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

DATABASES = {
    'default': dj_database_url.config(
        default=f'sqlite:///{BASE_DIR / "db.sqlite3"}',
        conn_max_age=600,
    )
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'ar'
LANGUAGES = [
    ('ar', 'Arabic'),
    ('en', 'English'),
]
TIME_ZONE = 'Asia/Riyadh'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'static'
MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

AUTH_USER_MODEL = 'acct.User'

# CORS
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = ['https://fitpro.hftv.qzz.io']

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# JWT
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=2),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# DRF Spectacular
SPECTACULAR_SETTINGS = {
    'TITLE': 'FitPro Center API',
    'DESCRIPTION': 'API for bodybuilding gym management center',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}

# === ADDITIVE: CACHES Redis (from fitpro) ===
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': os.environ.get('REDIS_URL', os.environ.get('CACHE_URL', 'redis://127.0.0.1:6379/1')),
        'TIMEOUT': 300,
        'KEY_PREFIX': 'fitpro',
    }
}
# Fallback to locmem if redis not available in DEBUG without env
if DEBUG and not os.environ.get('REDIS_URL'):
    try:
        import redis  # check installed
    except ImportError:
        CACHES['default'] = {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'fitpro-locmem',
        }

# === ADDITIVE: FitPro platform settings (from fitpro) ===
FITPRO = {
    'SUPPORTED_TIMEZONES': ['Asia/Riyadh', 'Asia/Dubai', 'Africa/Cairo', 'Europe/Istanbul', 'UTC'],
    'SUPPORTED_LANGUAGES': [('ar', 'Arabic'), ('en', 'English')],
    'SUPPORTED_CURRENCIES': ['SAR', 'AED', 'EGP', 'USD'],
}
PLATFORM_DOMAIN = os.environ.get('PLATFORM_DOMAIN', 'fitpro.hftv.qzz.io')
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'https://fitpro.hftv.qzz.io')
FITPRO_DYNAMIC_DIR = os.environ.get('FITPRO_DYNAMIC_DIR', '')

