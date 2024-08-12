from typing import Any

from django.http import HttpResponse
from ninja import Router

from api.models import Message


router = Router(tags=["private"])


@router.get("/{file}", response={200: Any, 404: Any})
def home(request, file: str):
    if (
        msg := Message.objects.filter(file=f"private/{file}").first()
    ) is None or request.auth.id not in [msg.sender_id, msg.recipient_id]:
        return 404

    res = HttpResponse(status=200)
    res["Content-Type"] = ""
    res["X-Accel-Redirect"] = f"/private/{file}"
    return res
