from typing import List

from django.contrib.auth.hashers import make_password, check_password
from pydantic import UUID4
from ninja import Router, Form, File, UploadedFile, Path
from ninja.pagination import paginate

from api.schemas import (
    UserRegisterIn,
    UserRegisterOut,
    UserLoginIn,
    UserLoginOut,
    UserUpdateIn,
    UserOutSingle,
    UserOutMulti,
    UserSearchIn,
)
from api.helpers import save_file
from api.models import User
from api.auth import create_token


router = Router(tags=["user"])


@router.post("/register", auth=None, response={201: UserRegisterOut, 409: str})
def register(request, data: UserRegisterIn):
    if User.objects.filter(email=data.email).exists():
        return 409, "Email already exists"

    data = data.dict()
    data["password"] = make_password(data["password"])
    return 201, User.objects.create(**data)


@router.post("/login", auth=None, response={200: UserLoginOut, 401: str})
def login(request, data: UserLoginIn):
    user = User.objects.filter(email=data.email).first()
    if not user or not check_password(data.password, user.password):
        return 401, "Invalid credentials"

    return {"token": create_token(user)}


@router.patch("/", response={200: str, 409: str, 422: str})
def update(
    request,
    data: Form[UserUpdateIn],
    profile_image: File[UploadedFile] = None,
    background_image: File[UploadedFile] = None,
):
    """
    Missing or null fields will not be updated.
    If you want to reset a field, you must provide an empty string.
    """

    if (
        all(d is None for d in data.dict().values())
        and not profile_image
        and not background_image
    ):
        return 422, "No data provided"

    if (
        data.email
        and User.objects.filter(email=data.email).exclude(id=request.auth.id).exists()
    ):
        return 409, "Email already exists"

    data.password = make_password(data.password) if data.password else None
    for key, value in data.dict().items():
        if value is not None:
            setattr(request.auth, key, value)

    save_file(request.auth.profile_image, profile_image, ["image"])
    save_file(request.auth.background_image, background_image, ["image"])

    request.auth.save()
    return 200, "User updated"


@router.get("/me", response=UserRegisterOut)
def me(request):
    return {"id": request.auth.id}


@router.get("/search/{query}", response=List[UserOutMulti])
@paginate
def search(request, filters: UserSearchIn = Path(...)):
    return filters.filter(User.objects.all())


@router.get("/{id}", response={200: UserOutSingle, 404: str})
def profile(request, id: UUID4):
    user = User.objects.filter(id=id).first()
    return (200, user) if user else (404, "User not found.")
