"""
Django settings for config project.
"""

import os
from datetime import timedelta
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# SECURITY WARNING: keep the secret key used in production secret!
# In production, set SECRET_KEY via an environment variable.
SECRET_KEY = os.environ.get(
    'SECRET_KEY',
    'django-insecure-4lwp%yr(+abf5zsy--7ce5c7-u@uno4^cl0+z3!l_(krsw-6q-',
)

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DEBUG', 'True') == 'True'

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'accounts',
    'tasks',
    'annotate',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
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


# Database
# https://docs.djangoproject.com/en/6.0/ref/settings/#databases
#
# DATA_DIR points at a persistent location for SQLite + uploaded media. In
# production set it to a mounted disk (e.g. /var/data on Render) so the DB and
# uploads survive redeploys; locally it defaults to BASE_DIR.
#
# If DATA_DIR isn't actually writable — e.g. the env var points at a disk that
# isn't mounted (hosts without a persistent disk, like Render's free tier) —
# fall back to BASE_DIR so the app still boots. Data is then ephemeral and
# resets on redeploy/restart, which is fine for a demo deployment.
DATA_DIR = Path(os.environ.get('DATA_DIR', BASE_DIR))
try:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    _write_test = DATA_DIR / '.write_test'
    _write_test.touch()
    _write_test.unlink()
except OSError:
    DATA_DIR = BASE_DIR

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': DATA_DIR / 'db.sqlite3',
    }
}


AUTH_USER_MODEL = 'accounts.User'

# Password validation
# https://docs.djangoproject.com/en/6.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/6.0/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/6.0/howto/static-files/

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STORAGES = {
    'default': {
        'BACKEND': 'django.core.files.storage.FileSystemStorage',
    },
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    },
}

# Media files (uploaded images) — stored under the persistent DATA_DIR.
MEDIA_URL = '/media/'
MEDIA_ROOT = DATA_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': False,
}

# CORS / CSRF - allowed frontend origin(s), comma-separated.
# Defaults to the local Next.js dev server; in production set FRONTEND_URL to
# the deployed frontend URL (e.g. https://vai.vercel.app).
#
# `or <default>` guards against FRONTEND_URL being present but empty, and the
# comprehension drops any blank entries — both would otherwise produce an
# invalid '' origin that Django/corsheaders reject at startup.
FRONTEND_URL = os.environ.get('FRONTEND_URL') or 'http://localhost:3000,http://127.0.0.1:3000'
CORS_ALLOWED_ORIGINS = [origin.strip() for origin in FRONTEND_URL.split(',') if origin.strip()]
CSRF_TRUSTED_ORIGINS = list(CORS_ALLOWED_ORIGINS)


# Production security hardening (only active when DEBUG is off). The platform
# (e.g. Render) terminates TLS at its proxy, so tell Django to trust the
# forwarded-proto header before enforcing HTTPS redirects/secure cookies.
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 60 * 60 * 24 * 7  # 1 week
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
