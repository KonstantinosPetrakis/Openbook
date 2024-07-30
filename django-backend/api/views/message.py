from typing import List

from ninja import Router, Form, File, UploadedFile
from ninja.pagination import paginate
from django.db import connection
from django.db.models import Q
from pydantic import UUID4

from api.helpers import create_message, dict_fetchall
from api.models import Friendship, Message
from api.schemas import MessageIn, MessageOut, ChatOut


router = Router(tags=["message"])


@router.post("", response={201: str, 400: str, 403: str})
def send_message(request, data: Form[MessageIn], file: File[UploadedFile] = None):
    friendship = Friendship.objects.filter(
        (Q(requested_by=request.auth, accepted_by=data.recipient_id))
        | (Q(requested_by=data.recipient_id, accepted_by=request.auth)),
        accepted_at__isnull=False,
    ).first()

    if not friendship:
        return 403, "Friendship not found"

    if not data.content and not file:
        return 400, "No content provided"

    create_message(request.auth.id, data.recipient_id, data.content, file)
    return 201, "Message sent"


@router.get("/unread", response=int)
def unread_messages_count(request):
    return Message.objects.filter(recipient_id=request.auth, read=False).count()


@router.get("/chats", response=List[ChatOut])
def chats(request):
    with connection.cursor() as cursor:
        cursor.execute(
            """
                WITH
                    "chat_table" AS (
                        SELECT
                            "recipient_id" AS "friend_id",
                            "sent_at",
                            CONCAT (
                                'You: ', 
                                CASE 
                                    WHEN "content" = ''
                                        THEN '📎 Attachment'
                                    ELSE 
                                        "content"
                                END
                            ) as "content",
                            false as "attention"
                        FROM
                            "api_message"
                        WHERE
                            "sender_id" = %(id)s
                        UNION
                        SELECT
                            "sender_id" AS "friend_id",
                            "sent_at",
                            CASE 
                                WHEN "content" = '' 
                                    THEN '📎 Attachment'
                                ELSE
                                    "content" 
                            END as "content",
                            NOT "read" as "attention"
                        FROM
                            "api_message"
                        WHERE
                            "recipient_id" = %(id)s
                    )
                SELECT
                    "friend_id",
                    "first_name",
                    "last_name",
                    "profile_image",
                    "last_active",
                    "sent_at",
                    "content",
                    "attention"
                FROM
                    "chat_table" INNER JOIN "api_user" ON "chat_table"."friend_id" = "api_user"."id"
                WHERE
                    ("friend_id", "sent_at") IN (
                        SELECT
                            "friend_id",
                            MAX("sent_at")
                        FROM
                            "chat_table"
                        GROUP BY
                            "friend_id"
                    )
                ORDER BY "sent_at" DESC 
            """,
            {"id": request.auth.id},
        )

        return dict_fetchall(cursor)


@router.get("/{id}", response=List[MessageOut])
@paginate
def get_messages(request, id: UUID4):
    Message.objects.filter(recipient_id=request.auth, sender_id=id, read=False).update(
        read=True
    )

    return Message.objects.filter(
        Q(sender_id=request.auth, recipient_id=id)
        | Q(sender_id=id, recipient_id=request.auth)
    ).order_by("-sent_at")
