import datetime

import jwt
from django.db.models import Model
from django.conf import settings
from ninja.security import HttpBearer

from api.models import User


SECRET = settings.SECRET_KEY


class AuthBearer(HttpBearer):
    def authenticate(self, request, token):
        try:
            payload = jwt.decode(token, SECRET, algorithms=["HS256"])
            return User.objects.get(id=payload["userId"])
        except jwt.ExpiredSignatureError:
            return False
        except jwt.InvalidTokenError:
            return False


def create_token(user: Model) -> str:
    """
    This function creates a JWT token for the user.

    Args:
        user (Model): The user model instance.

    Returns:
        str: The JWT token.
    """

    return jwt.encode(
        {
            "userId": str(user.id),
            "exp": datetime.datetime.now(tz=datetime.timezone.utc)
            + datetime.timedelta(days=7),
        },
        SECRET,
        algorithm="HS256",
    )
