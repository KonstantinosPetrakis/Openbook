"""
While in development, the django application server will serve 
the files from the public and private directories.

While in production, the public files will be directly served by ngnx 
and the private files will be first checked by the private router and
then served by ngnx via an internal redirect.
"""

import os

from django.conf.urls.static import static
from django.conf import settings
from django.urls import path
from ninja import NinjaAPI, Swagger, Router

from api.helpers import camel_case_responses
from api.auth import AuthBearer
from api.views.user import router as user_router
from api.views.private import router as private_router
from api.views.notification import router as notification_router
from api.views.friendship import router as friendship_router
from api.views.message import router as message_router
from api.views.post import router as post_router


api = NinjaAPI(
    auth=AuthBearer(),
    title="Openbook API",
    description="API for Openbook project",
    docs=Swagger(settings={"persistAuthorization": True}),
)

api_router = Router()
api.add_router("/api", api_router)
api_router.add_router("user", user_router)
api_router.add_router("notification", notification_router)
api_router.add_router("friendship", friendship_router)
api_router.add_router("message", message_router)
api_router.add_router("post", post_router)


if not settings.DEBUG:
    api_router.add_router("/private", private_router)

camel_case_responses(api)

dev_files = (
    (
        static("/public/", document_root=os.path.join(settings.BASE_DIR, "public"))
        + static("/private/", document_root=os.path.join(settings.BASE_DIR, "private"))
    )
    if settings.DEBUG
    else []
)

urlpatterns = [
    path("", api.urls),
] + dev_files
