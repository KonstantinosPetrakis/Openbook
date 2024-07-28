from typing import Any, Literal, List, Dict
import uuid

from ninja import Schema, ModelSchema, FilterSchema, NinjaAPI, File, UploadedFile
from pydantic import UUID4
from django.db.models import ImageField

from api.models import Notification, Message, User

# ------------ Snake case to camel case transformation for API usage  BEGIN ------------


def camel_case_responses(api: NinjaAPI):
    for _, router in api._routers:
        for view in router.path_operations.values():
            for op in view.operations:
                op.by_alias = True


class CamelCase:
    def snake_case_to_camel_case(snake_case: str) -> str:
        words = snake_case.split("_")
        return words[0] + "".join(word.title() for word in words[1:])

    model_config = dict(alias_generator=snake_case_to_camel_case, populate_by_name=True)


CamelCaseSchema = Schema, CamelCase
CamelCaseModelSchema = ModelSchema, CamelCase
CamelCaseFilterSchema = FilterSchema, CamelCase

# ------------ Snake case to camel case transformation for API usage  END ------------


def dict_fetchall(cursor: Any) -> List[Dict[str, Any]]:
    """_sum
    Returns all rows from a cursor as a dict

    Args:
        cursor (Any): The cursor to fetch the data from.

    Returns:
        List[Dict[str, Any]]: The fetched data as a list of dictionaries.
    """

    desc = cursor.description
    return [dict(zip([col[0] for col in desc], row)) for row in cursor.fetchall()]


def save_file(
    model_image_field: ImageField,
    file: File[UploadedFile] | None,
    wanted_types: List[Literal["image", "video"]],
) -> str | None:
    """
    This function saves the file to the model's image field and returns the file name.

    Args:
        model_image_field (ImageField): The model's image field.
        file (File[UploadedFile] | None): The uploaded file to save.
        wanted_types (List[Literal["image", "video"]]): The wanted file types.

    Returns:
        str | None: The saved file name or None if the file wasn't saved.
    """

    if not file or not any(file.content_type.startswith(t) for t in wanted_types):
        return None

    file_extension = file.content_type.split("/")[1]
    file_name = uuid.uuid4().hex + "." + file_extension
    model_image_field.save(file_name, file)
    return file_name


def create_notification(recipient_id: UUID4, type: str, data: Dict[str, Any]):
    """
    This function creates a notification for the recipient.

    Args:
        recipient_id (UUID4): The recipient ID.
        type (str): The notification type.
        data (dict[str, Any]): The notification data.
    """

    Notification.objects.create(recipient_id=recipient_id, type=type, data=data)
    # TODO: Send a push notification to the recipient.


def create_message(
    sender_id: UUID4,
    recipient_id: UUID4,
    content: str | None,
    file: File[UploadedFile] | None,
):
    """
    This function creates a message for the recipient.

    Args:
        sender_id (UUID4): The sender id.
        recipient_id (UUID4): The recipient id.
        content (str | None): The message content.
        file (File[UploadedFile] | None): The message file.
    """

    m = Message.objects.create(
        sender_id=sender_id, recipient_id=recipient_id, content=content
    )
    save_file(m.file, file, ["image", "video"])
    # TODO: Send a push notification to the recipient.
