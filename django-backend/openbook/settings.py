from pathlib import Path
from django.core.management.commands.runserver import Command as runserver
from dotenv import dotenv_values

CONFIG = dotenv_values()
BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = CONFIG["SECRET"]

DEBUG = CONFIG["DEBUG"] == "1"

# It's ok for dev and production since it's behind a reverse proxy in a docker container
runserver.default_port = "3000"
ALLOWED_HOSTS = ["*"]

# contrib.auth is required by templates, and templates are required for docs
INSTALLED_APPS = [
    "daphne",
    "django.contrib.contenttypes",
    "django.contrib.auth",
    "django.contrib.staticfiles",
    "corsheaders",
    "api",
    "ninja",
    "django_cleanup.apps.CleanupConfig",
    "channels_postgres",
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
ASGI_APPLICATION = "openbook.asgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": CONFIG["POSTGRES_DB"],
        "USER": CONFIG["POSTGRES_USER"],
        "PASSWORD": CONFIG["POSTGRES_PASSWORD"],
        "HOST": CONFIG["POSTGRES_HOST"],
        "PORT": CONFIG["POSTGRES_PORT"],
    }
}

DATABASES["channels_postgres"] = DATABASES["default"]

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_postgres.core.PostgresChannelLayer",
        "CONFIG": DATABASES["default"],
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

APPEND_SLASH = False
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True
STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

NINJA_PAGINATION_CLASS = "ninja.pagination.PageNumberPagination"
NINJA_PAGINATION_PER_PAGE = 10
