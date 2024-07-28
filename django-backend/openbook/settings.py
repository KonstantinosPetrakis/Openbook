from pathlib import Path
from dotenv import dotenv_values

CONFIG = dotenv_values(".env")
BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = CONFIG["SECRET_KEY"]

DEBUG = True

ALLOWED_HOSTS = []

# contrib.auth is required by templates, and templates are required for docs
INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.auth",
    "django.contrib.staticfiles",
    "corsheaders",
    "api",
    "ninja",
    "django_cleanup.apps.CleanupConfig",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "api.middlewares.process_put_patch",
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
]


ROOT_URLCONF = "openbook.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "openbook.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": CONFIG["DB_NAME"],
        "USER": CONFIG["DB_USER"],
        "PASSWORD": CONFIG["DB_PASSWORD"],
        "HOST": CONFIG["DB_HOST"],
        "PORT": CONFIG["DB_PORT"],
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True
STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

NINJA_PAGINATION_CLASS = "ninja.pagination.PageNumberPagination"
NINJA_PAGINATION_PER_PAGE = 10
