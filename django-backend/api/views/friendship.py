from typing import List

from django.utils import timezone
from pydantic import UUID4
from ninja import Router, Path
from django.db.models import Q

from api.schemas import UserOutMulti
from api.models import Notification, User, Friendship
from api.helpers import create_notification


router = Router(tags=["friendship"])


@router.post("/add/{id}", response={200: str, 201: str, 403: str, 409: str, 404: str})
def add_friend(request, id: UUID4):
    """
    Possible responses:
    - 201: Friend request sent
    - 409: Already friends
    - 403: Friend request already sent
    - 200: Friend request accepted
    - 404: User not found
    """

    request_user = request.auth

    accept_user = User.objects.filter(id=id).first()
    if not accept_user:
        return 404, "User not found"

    friendship_entity = Friendship.objects.filter(
        Q(requested_by=request_user, accepted_by=accept_user)
        | Q(requested_by=accept_user, accepted_by=request_user)
    ).first()

    if not friendship_entity:
        Friendship.objects.create(requested_by=request_user, accepted_by=accept_user)
        create_notification(
            accept_user.id,
            Notification.Types.FRIEND_REQUEST,
            UserOutMulti.from_orm(request_user).json(),
        )
        return 201, "Sent friend request"

    if friendship_entity.accepted_at:
        return 409, "Already friends"

    if friendship_entity.requested_by == request_user:
        return 403, "Friend request already sent"

    if friendship_entity.accepted_by == request_user:
        friendship_entity.accepted_at = timezone.now()
        friendship_entity.save()
        create_notification(
            friendship_entity.requested_by_id,
            Notification.Types.FRIEND_REQUEST_ACCEPTED,
            UserOutMulti.from_orm(accept_user).json(),
        )
        return 200, "Friend request accepted"


@router.delete("/remove/{id}", response={200: str, 404: str})
def remove_friend(request, id: UUID4):
    """
    This endpoint does one of the following operations based on the friendship status:
    - If users are friends, it removes the friendship.
    - If a friend request is sent, it cancels the friend request.
    - If a friend request is received, it declines the friend
    """

    first_user = request.auth
    second_user = User.objects.filter(id=id).first()

    friendship_entity = Friendship.objects.filter(
        Q(requested_by=first_user, accepted_by=second_user)
        | Q(requested_by=second_user, accepted_by=first_user)
    ).first()

    if not friendship_entity:
        return 404, "Friendship not found"

    friendship_entity.delete()
    return 200, "Friendship removed"


@router.get("", response=List[UUID4])
def friends(request):
    return request.auth.friends()
