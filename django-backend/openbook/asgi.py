import os

from django.urls import path
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter

from api.consumers import RealTimeConsumer


websocket_urlpatterns = [
    path("ws", RealTimeConsumer.as_asgi()),
]

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "openbook.settings")

application = ProtocolTypeRouter(
    {
        "http": get_asgi_application(),
        "websocket": URLRouter(websocket_urlpatterns),
    }
)
