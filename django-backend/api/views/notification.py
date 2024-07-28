from typing import List

from ninja import Router
from ninja.pagination import paginate

from api.schemas import NotificationOut
from api.models import Notification


router = Router(tags=["notification"])


@router.get("/", response=List[NotificationOut])
@paginate
def get_notifications(request):
    return Notification.objects.filter(recipient=request.auth).order_by("-created_at")


@router.get("/count", response=int)
def get_unread_notifications_count(request):
    return Notification.objects.filter(recipient=request.auth, read=False).count()


@router.patch("/read/{id}", response={200: None, 404: str})
def mark_notification_as_read(request, id: str):
    notification = Notification.objects.filter(id=id, recipient=request.auth).first()
    if not notification:
        return 404, "Notification not found"

    notification.read = True
    notification.save()
