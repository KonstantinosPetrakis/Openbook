import uuid

from django.contrib.postgres.expressions import ArraySubquery
from django.db.models import Count, OuterRef, Exists
from django.core.exceptions import ValidationError
from django.core.validators import EmailValidator
from django.db import models


class User(models.Model):
    class Genders(models.TextChoices):
        MALE = "MALE", "Male"
        FEMALE = "FEMALE", "Female"
        NON_BINARY = "NON_BINARY", "Non-binary"

    class RelationshipStatus(models.TextChoices):
        SINGLE = "SINGLE", "Single"
        IN_A_RELATIONSHIP = "IN_A_RELATIONSHIP", "In a relationship"
        ENGAGED = "ENGAGED", "Engaged"
        MARRIED = "MARRIED", "Married"
        DIVORCED = "DIVORCED", "Divorced"
        WIDOWED = "WIDOWED", "Widowed"
        COMPLICATED = "COMPLICATED", "Complicated"

    id = models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4)
    joined_at = models.DateTimeField(auto_now_add=True)
    last_active = models.DateTimeField(auto_now=True)
    email = models.EmailField(unique=True, validators=[EmailValidator()])
    password = models.CharField(max_length=255)
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    profile_image = models.ImageField(upload_to="public/", null=True, blank=True)
    background_image = models.ImageField(upload_to="public/", null=True, blank=True)
    gender = models.CharField(
        max_length=255, null=True, blank=True, choices=Genders.choices
    )
    relationship_status = models.CharField(
        max_length=255, null=True, blank=True, choices=RelationshipStatus.choices
    )
    bio = models.TextField(max_length=500, null=True, blank=True)
    location = models.CharField(max_length=255, null=True, blank=True)
    occupation = models.CharField(max_length=255, null=True, blank=True)
    education = models.CharField(max_length=255, null=True, blank=True)
    hobbies = models.CharField(max_length=255, null=True, blank=True)

    def friends(self):
        friends_requested = Friendship.objects.filter(
            requested_by=self, accepted_at__isnull=False
        ).values_list("accepted_by", flat=True)
        friends_accepted = Friendship.objects.filter(
            accepted_by=self, accepted_at__isnull=False
        ).values_list("requested_by", flat=True)
        return friends_requested.union(friends_accepted)


class Friendship(models.Model):
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["requested_by", "accepted_by"], name="unique_friendship"
            )
        ]

    id = models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4)
    requested_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="friendship_requests_sent"
    )
    accepted_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="friendship_requests_received"
    )
    accepted_at = models.DateTimeField(null=True, blank=True, default=None)


class Post(models.Model):
    id = models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    posted_at = models.DateTimeField(auto_now_add=True)
    content = models.TextField(max_length=1000, null=True, blank=True)

    @staticmethod
    def include_extra(queryset, request_user):
        return queryset.annotate(
            comment_count=Count("comments", distinct=True),
            like_count=Count("likes__id", distinct=True),
            liked=Exists(
                PostLike.objects.filter(post=OuterRef("id"), liked_by=request_user)
            ),
            file=ArraySubquery(
                PostFile.objects.filter(post__id=OuterRef("id")).values("file")
            ),
        ).select_related("author")


class PostFile(models.Model):
    id = models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="files")
    file = models.FileField(upload_to="public/")


class PostLike(models.Model):
    id = models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="likes")
    liked_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="likes")


class PostComment(models.Model):
    id = models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="comments")
    commented_at = models.DateTimeField(auto_now_add=True)
    content = models.TextField(null=True, blank=True, max_length=500)
    file = models.FileField(upload_to="public/", null=True, blank=True)

    def clean(self):
        if not self.content and not self.file:
            raise ValidationError("Comment content or file is required")


class Notification(models.Model):
    class Types(models.TextChoices):
        FRIEND_REQUEST = "FRIEND_REQUEST", "Friend request"
        FRIEND_REQUEST_ACCEPTED = "FRIEND_REQUEST_ACCEPTED", "Friend request accepted"
        FRIEND_POSTED = "FRIEND_POSTED", "Friend posted"
        POST_LIKED = "POST_LIKED", "Post like"
        POST_COMMENTED = "POST_COMMENTED", "Post commented"

    id = models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4)
    recipient = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="notifications"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    type_ = models.CharField(name="type", max_length=255, choices=Types.choices)
    data = models.JSONField()
    read = models.BooleanField(default=False)


class Message(models.Model):
    id = models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4)
    sender = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="sent_messages"
    )
    recipient = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="received_messages"
    )
    sent_at = models.DateTimeField(auto_now_add=True)
    content = models.TextField(max_length=1000)
    file = models.FileField(upload_to="private/", null=True, blank=True)
    read = models.BooleanField(default=False)

    def clean(self):
        if not self.content and not self.file:
            raise ValidationError("Message content or file is required")
