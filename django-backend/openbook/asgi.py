import os

from django.urls import path
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "openbook.settings")
django_asgi_app = get_asgi_application()

# Models have to be imported after get_asgi_application, check https://channels.readthedocs.io/en/latest/installation.html
from api.consumers import RealTimeConsumer

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": URLRouter(
            [
                path("ws", RealTimeConsumer.as_asgi()),
            ]
        ),
    }
)
