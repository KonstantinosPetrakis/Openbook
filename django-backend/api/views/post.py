from typing import List

from django.contrib.postgres.expressions import ArraySubquery
from ninja import Router, Form, File, UploadedFile
from ninja.pagination import paginate
from django.db.models import Count, OuterRef, Exists, Q
from pydantic import UUID4

from api.helpers import save_file, create_notification
from api.schemas import PostIn, PostOutMinimal, PostOut, CommentOutMinimal
from api.models import User, Post, PostFile, Notification, PostLike, PostComment


router = Router(tags=["post"])


@router.post("", response={201: PostOutMinimal, 422: str})
def create_post(request, data: Form[PostIn], files: File[list[UploadedFile]] = []):
    if not data.content and not files:
        return 422, "Data not provided"

    post = Post.objects.create(author=request.auth, content=data.content)
    post_files = PostFile.objects.bulk_create([PostFile(post=post) for _ in files])

    for pf, file in zip(post_files, files):
        save_file(pf.file, file, ["image", "video"])

    for friend_id in request.auth.friends():
        create_notification(
            friend_id,
            Notification.Types.FRIEND_POSTED,
            {
                "postId": str(post.id),
                "userId": str(request.auth.id),
                "firstName": request.auth.first_name,
                "lastName": request.auth.last_name,
                "profileImage": (
                    request.auth.profile_image.url
                    if request.auth.profile_image
                    else None
                ),
            },
        )

    return 201, post


@paginate
@router.get("/feed", response={200: List[PostOut]})
def get_feed(request):
    return (
        Post.objects.filter(
            Q(author__id__in=request.auth.friends()) | Q(author=request.auth)
        )
        .annotate(
            comment_count=Count("comments"),
            like_count=Count("likes"),
            liked=Exists(
                PostLike.objects.filter(post=OuterRef("id"), liked_by=request.auth)
            ),
            file=ArraySubquery(
                PostFile.objects.filter(post__id=OuterRef("id")).values("file")
            ),
        )
        .select_related("author")
    )


@router.post("/like/{id}", response={404: str, 201: str, 200: str})
def like_post(request, id: UUID4):
    post = Post.objects.filter(id=id).first()
    if not post:
        return 404, "Post not found"

    post_liked = PostLike.objects.filter(post=post, liked_by=request.auth)
    if post_liked:
        post_liked.delete()
        return 200, "Post unliked"
    else:
        PostLike.objects.create(post=post, liked_by=request.auth)
        create_notification(
            post.author.id,
            Notification.Types.POST_LIKED,
            {
                "postId": str(post.id),
                "userId": str(request.auth.id),
                "firstName": request.auth.first_name,
                "lastName": request.auth.last_name,
                "profileImage": (
                    request.auth.profile_image.url
                    if request.auth.profile_image
                    else None
                ),
            },
        )
        return 201, "Post liked"


@router.post("/comment/{id}", response={201: CommentOutMinimal, 404: str, 422: str})
def comment_post(
    request, id: UUID4, data: Form[PostIn], file: File[UploadedFile] = None
):
    if not data.content and not file:
        return 422, "Data not provided"

    post = Post.objects.filter(id=id).first()

    if not post:
        return 404, "Post not found"

    comment = PostComment.objects.create(
        post=post, author=request.auth, content=data.content
    )
    save_file(comment.file, file, ["image", "video"])

    create_notification(
        post.author.id,
        Notification.Types.POST_COMMENTED,
        {
            "postId": str(post.id),
            "userId": str(request.auth.id),
            "firstName": request.auth.first_name,
            "lastName": request.auth.last_name,
            "profileImage": (
                request.auth.profile_image.url if request.auth.profile_image else None
            ),
            "content": data.content or "An attachment",
        },
    )
    return 201, comment


@router.delete("/comment/{id}", response={200: str, 404: str})
def delete_comment(request, id: UUID4):
    comment = PostComment.objects.filter(id=id, author=request.auth).first()
    if not comment:
        return 404, "Comment not found"

    comment.delete()
    return 200, "Comment deleted"


@paginate
@router.get("/{id}/comments", response={404: str, 200: List[PostOutMinimal]})
def get_comments(request, id: UUID4):
    post = Post.objects.filter(id=id).first()
    if not post:
        return 404, "Post not found"

    return PostComment.objects.filter(post=post)


@paginate
@router.get("/ofUser/{id}", response={404: str, 200: List[PostOut]})
def get_user_posts(request, id: UUID4):
    user = User.objects.filter(id=id).first()
    if not user:
        return 404, "User not found"

    return (
        Post.objects.filter(author=user)
        .annotate(
            comment_count=Count("comments"),
            like_count=Count("likes"),
            liked=Exists(
                PostLike.objects.filter(post=OuterRef("id"), liked_by=request.auth)
            ),
            file=ArraySubquery(
                PostFile.objects.filter(post__id=OuterRef("id")).values("file")
            ),
        )
        .select_related("author")
    )


@router.get("/{id}", response={404: str, 200: PostOut})
def get_post(request, id: UUID4):
    return (
        Post.objects.filter(id=id)
        .annotate(
            comment_count=Count("comments"),
            like_count=Count("likes"),
            liked=Exists(
                PostLike.objects.filter(post=OuterRef("id"), liked_by=request.auth)
            ),
            file=ArraySubquery(
                PostFile.objects.filter(post__id=OuterRef("id")).values("file")
            ),
        )
        .first()
    ) or (404, "Post not found")


@router.delete("/{id}", response={200: str, 404: str})
def delete_post(request, id: UUID4):
    post = Post.objects.filter(id=id, author=request.auth).first()
    if not post:
        return 404, "Post not found"

    post.delete()
    return 200, "Post deleted"
