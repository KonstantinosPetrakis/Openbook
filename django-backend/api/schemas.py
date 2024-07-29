from datetime import datetime
from typing import Optional, List

from pydantic import EmailStr, Field, UUID4
from django.db.models import Q

from api.helpers import CamelCaseModelSchema, CamelCaseSchema, CamelCaseFilterSchema
from api.models import User, Notification, Friendship, Message, Post, PostComment


class UserRegisterIn(*CamelCaseModelSchema):
    class Meta:
        model = User
        fields = ["first_name", "last_name"]

    email: EmailStr
    password: str = Field(..., min_length=8)


class UserRegisterOut(*CamelCaseModelSchema):
    class Meta:
        model = User
        fields = ["id"]


class UserLoginIn(*CamelCaseModelSchema):
    class Meta:
        model = User
        fields = ["password"]

    email: EmailStr


class UserLoginOut(*CamelCaseSchema):
    id: UUID4
    token: str


class UserUpdateIn(*CamelCaseModelSchema):
    class Meta:
        model = User
        exclude = [
            "id",
            "profile_image",
            "background_image",
            "joined_at",
            "last_active",
        ]
        fields_optional = "__all__"

    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=8)


class UserOutMulti(*CamelCaseModelSchema):
    class Meta:
        model = User
        exclude = ["password"]


class UserOutSingle(UserOutMulti):
    friendship_status: str

    @staticmethod
    def resolve_friendship_status(user, context):
        auth_user = context["request"].auth
        friendship = Friendship.objects.filter(
            (Q(requested_by=auth_user, accepted_by=user))
            | Q(requested_by=user, accepted_by=auth_user)
        ).first()

        return (
            "stranger"
            if not friendship
            else (
                "friend"
                if friendship.accepted_at
                else "requested" if friendship.requested_by == auth_user else "received"
            )
        )


class UserSearchIn(*CamelCaseFilterSchema):
    query: str = Field(
        None, q=["first_name__icontains", "last_name__icontains", "email__icontains"]
    )


class NotificationOut(*CamelCaseModelSchema):
    class Meta:
        model = Notification
        fields = "__all__"


class MessageIn(*CamelCaseSchema):
    recipient_id: UUID4
    content: Optional[str] = ""


class MessageOut(*CamelCaseModelSchema):
    class Meta:
        model = Message
        fields = "__all__"

    sender_id: UUID4
    recipient_id: UUID4


class ChatOut(*CamelCaseSchema):
    friend_id: UUID4
    first_name: str
    last_name: str
    profile_image: str
    last_active: datetime
    sent_at: datetime
    content: str
    attention: bool


class PostIn(*CamelCaseModelSchema):
    class Meta:
        model = Post
        fields = ["content"]
        optional_fields = ["content"]


class PostOutMinimal(*CamelCaseModelSchema):
    class Meta:
        model = Post
        fields = ["id"]


class PostOut(*CamelCaseModelSchema):
    class Meta:
        model = Post
        fields = "__all__"

    comment_count: int = Field(None, serialization_alias="comments")
    like_count: int = Field(None, serialization_alias="likes")
    author: UserOutMulti
    file: List[str] = Field(None, serialization_alias="files")
    liked: bool


class CommentOutMinimal(*CamelCaseModelSchema):
    class Meta:
        model = PostComment
        fields = ["id"]


class CommentOut(*CamelCaseModelSchema):
    class Meta:
        model = PostComment
        fields = "__all__"
        exclude = ["post", "author"]

    author: UserOutMulti
