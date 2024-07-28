from ninja import Router


router = Router(tags=["private"])


@router.get("/{file}")
def home(request, file: str):
    # https://wellfire.co/learn/nginx-django-x-accel-redirects/
    return f"Hello, {file}!"
