"""
Maybe the tests are not so readable, but they get the job done for a toy project.
"""

from uuid import uuid4

from django.test import TestCase, Client
from django.test.client import encode_multipart, BOUNDARY, MULTIPART_CONTENT

from api.models import User


VALID_PASSWORD = "12345678"
INVALID_PASSWORD = "1234567"
VALID_EMAIL = "JohnDoe@example.com"
INVALID_EMAIL = "JohnDoe"
VALID_CREDENTIALS = ("John", "Doe", VALID_EMAIL, VALID_PASSWORD)
INVALID_EMAIL_CREDENTIALS = ("John", "Doe", INVALID_EMAIL, VALID_PASSWORD)
INVALID_PASSWORD_CREDENTIALS = ("John", "Doe", VALID_EMAIL, INVALID_PASSWORD)
VALID_LOGIN = (VALID_EMAIL, VALID_PASSWORD)

client = Client()


def register_request(first_name: str, last_name: str, email: str, password: str):
    return client.post(
        "/api/user/register",
        {
            "firstName": first_name,
            "lastName": last_name,
            "email": email,
            "password": password,
        },
        "application/json",
    )


def login_request(email: str, password: str):
    return client.post(
        "/api/user/login",
        {"email": email, "password": password},
        "application/json",
    )


def friend_request(token, id):
    return client.post(
        f"/api/friendship/add/{id}", HTTP_AUTHORIZATION=f"Bearer {token}"
    )


def create_post(token, content):
    return client.post(
        "/api/post",
        {"content": content},
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )


def like_post(token, id):
    return client.post(f"/api/post/like/{id}", HTTP_AUTHORIZATION=f"Bearer {token}")


def comment_post(token, id, content):
    return client.post(
        f"/api/post/comment/{id}",
        {"content": content},
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )


class UserAuthentication(TestCase):
    def test_register(self):
        # Password too short
        self.assertEqual(
            register_request(*INVALID_PASSWORD_CREDENTIALS).status_code, 422
        )

        # Invalid email
        self.assertEqual(register_request(*INVALID_EMAIL_CREDENTIALS).status_code, 422)

        # Correct data
        self.assertEqual("id" in register_request(*VALID_CREDENTIALS).json(), True)

        # Duplicate email
        self.assertEqual(register_request(*VALID_CREDENTIALS).status_code, 409)

    def test_login(self):
        register_request(*VALID_CREDENTIALS)

        # User does not exist
        self.assertEqual(
            login_request("JaneDoe@example.com", VALID_PASSWORD).status_code, 401
        )

        # Correct data
        self.assertEqual("token" in login_request(*VALID_LOGIN).json(), True)

    def test_auth(self):
        register_request(*VALID_CREDENTIALS)
        token = login_request(*VALID_LOGIN).json()["token"]

        # Access protected route with a valid token
        self.assertEqual(
            "id"
            in client.get("/api/user/me", HTTP_AUTHORIZATION=f"Bearer {token}").json(),
            True,
        )

        # Access protected route with an invalid token
        self.assertEqual(
            client.get(
                "/api/user/me", HTTP_AUTHORIZATION=f"Bearer {token + 'a'}"
            ).status_code,
            401,
        )


class User(TestCase):
    def get_user(self, token, id):
        return client.get(f"/api/user/{id}", HTTP_AUTHORIZATION=f"Bearer {token}")

    def search_user(self, token, query):
        return client.get(
            f"/api/user/search/{query}", HTTP_AUTHORIZATION=f"Bearer {token}"
        )

    def update_user(self, token, data):
        return client.patch(
            "/api/user",
            encode_multipart(BOUNDARY, data),
            MULTIPART_CONTENT,
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

    def setUp(self):
        self.u1 = register_request(*VALID_CREDENTIALS).json()["id"]
        self.u2 = register_request(
            "Jane", "Doe", "JaneDoe@example.com", VALID_PASSWORD
        ).json()
        self.t1 = login_request(*VALID_LOGIN).json()["token"]

    def test_getuser(self):
        # Unauthorized
        self.assertEqual(self.get_user("invalid", "cool-id").status_code, 401)

        # Invalid id (not of type UUID4)
        self.assertEqual(self.get_user(self.t1, "cool-id").status_code, 422)

        # User does not exist
        self.assertEqual(self.get_user(self.t1, uuid4()).status_code, 404)

        # Access user
        self.assertEqual(
            self.get_user(self.t1, self.u2["id"]).json()["firstName"], "Jane"
        )

    def test_search(self):
        # Unauthorized
        self.assertEqual(self.search_user("invalid", "cool-query").status_code, 401)
        self.assertEqual(self.search_user(self.t1, "John").json()["count"], 1)
        self.assertEqual(self.search_user(self.t1, "Doe").json()["count"], 2)

    def test_update(self):
        self.assertEqual(self.get_user(self.t1, self.u1).json()["firstName"], "John")

        # No data update
        self.assertEqual(self.update_user(self.t1, {}).status_code, 422)

        # Duplicate email
        self.assertEqual(
            self.update_user(self.t1, {"email": "JaneDoe@example.com"}).status_code, 409
        )

        # Correct update
        self.assertEqual(
            self.update_user(self.t1, {"firstName": "Johnny"}).status_code, 200
        )
        d = self.get_user(self.t1, self.u1).json()
        self.assertEqual(d["firstName"], "Johnny")
        self.assertEqual(d["lastName"], "Doe")


class TestFriendShip(TestCase):
    def setUp(self):
        self.u1 = register_request(*VALID_CREDENTIALS).json()["id"]
        self.u2 = register_request(
            "Jane", "Doe", "JaneDoe@example.com", VALID_PASSWORD
        ).json()["id"]
        self.t1 = login_request(*VALID_LOGIN).json()["token"]
        self.t2 = login_request("JaneDoe@example.com", VALID_PASSWORD).json()["token"]

    def remove_friend(self, token, id):
        return client.delete(
            f"/api/friendship/remove/{id}", HTTP_AUTHORIZATION=f"Bearer {token}"
        )

    def get_friends(self, token):
        return client.get("/api/friendship", HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_friendship(self):
        # Unauthorized
        self.assertEqual(friend_request("invalid", self.u2).status_code, 401)

        # User does not exist
        self.assertEqual(friend_request(self.t1, uuid4()).status_code, 404)

        # Send friend request
        self.assertEqual(friend_request(self.t1, self.u2).status_code, 201)

        # Friend request already sent
        self.assertEqual(friend_request(self.t1, self.u2).status_code, 403)

        # Accept friend request
        self.assertEqual(friend_request(self.t2, self.u1).status_code, 200)

        # Already friends
        self.assertEqual(friend_request(self.t1, self.u2).status_code, 409)

        # Get friends
        self.assertEqual(len(self.get_friends(self.t1).json()), 1)
        self.assertEqual(len(self.get_friends(self.t2).json()), 1)

        # Remove friend
        self.assertEqual(self.remove_friend(self.t1, self.u2).status_code, 200)

        # Get friends
        self.assertEqual(len(self.get_friends(self.t1).json()), 0)
        self.assertEqual(len(self.get_friends(self.t2).json()), 0)


class TestMessage(TestCase):
    def setUp(self):
        self.u1 = register_request(*VALID_CREDENTIALS).json()["id"]
        self.u2 = register_request(
            "Jane", "Doe", "JaneDoe@example.com", VALID_PASSWORD
        ).json()["id"]
        self.u3 = register_request(
            "Alice", "Smith", "AliceSmith@example.com", VALID_PASSWORD
        ).json()["id"]
        self.t1 = login_request(*VALID_LOGIN).json()["token"]
        self.t2 = login_request("JaneDoe@example.com", VALID_PASSWORD).json()["token"]
        self.t3 = login_request("AliceSmith@example.com", VALID_PASSWORD).json()[
            "token"
        ]

    def send_message(self, token, recipient_id, content):
        return client.post(
            "/api/message",
            {
                "recipientId": recipient_id,
                "content": content,
            },
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

    def unread_messages_count(self, token):
        return client.get("/api/message/unread", HTTP_AUTHORIZATION=f"Bearer {token}")

    def get_messages(self, token, friend_id):
        return client.get(
            f"/api/message/{friend_id}", HTTP_AUTHORIZATION=f"Bearer {token}"
        )

    def get_chats(self, token):
        return client.get("/api/message/chats", HTTP_AUTHORIZATION=f"Bearer {token}")

    def check_chats(
        self, chats, first_author, first_content, second_author, second_content
    ):
        self.assertEqual(chats["count"], 2)
        self.assertEqual(chats["items"][0]["firstName"], first_author)
        self.assertEqual(chats["items"][0]["content"], first_content)
        self.assertEqual(chats["items"][1]["firstName"], second_author)
        self.assertEqual(chats["items"][1]["content"], second_content)

    def test_messages(self):
        # To not existing user (friendship not found)
        self.assertEqual(self.send_message(self.t1, uuid4(), "Hello").status_code, 403)

        # To not friend
        self.assertEqual(self.send_message(self.t1, self.u2, "Hello").status_code, 403)

        friend_request(self.t1, self.u2)
        friend_request(self.t1, self.u3)
        friend_request(self.t2, self.u1)
        friend_request(self.t3, self.u1)

        # To friend
        self.assertEqual(self.send_message(self.t1, self.u2, "Hello").status_code, 201)
        for _ in range(9):
            self.send_message(self.t1, self.u2, "Hello")

        # Unread messages
        self.assertEqual(self.unread_messages_count(self.t2).json(), 10)

        # Read messages
        self.assertEqual(self.get_messages(self.t2, self.u1).json()["count"], 10)

        self.assertEqual(self.unread_messages_count(self.t2).json(), 0)

        # Chats
        self.send_message(self.t3, self.u1, "Hello from Alice")

        self.check_chats(
            self.get_chats(self.t1).json(),
            "Alice",
            "Hello from Alice",
            "Jane",
            "You: Hello",
        )

        self.send_message(self.t2, self.u1, "Response to 10 hellos")
        self.check_chats(
            self.get_chats(self.t1).json(),
            "Jane",
            "Response to 10 hellos",
            "Alice",
            "Hello from Alice",
        )


class NotificationTest(TestCase):
    def get_notifications(self, token):
        return client.get("/api/notification/", HTTP_AUTHORIZATION=f"Bearer {token}")

    def get_unread_notifications_count(self, token):
        return client.get(
            "/api/notification/count", HTTP_AUTHORIZATION=f"Bearer {token}"
        )

    def mark_notification_as_read(self, token, id):
        return client.patch(
            f"/api/notification/read/{id}", HTTP_AUTHORIZATION=f"Bearer {token}"
        )

    def check_notifications(self, d, count, first_type):
        self.assertEqual(d["count"], count)
        self.assertEqual(d["items"][0]["type"], first_type)

    def test_notification(self):
        u1 = register_request(*VALID_CREDENTIALS).json()["id"]
        u2 = register_request(
            "Jane", "Doe", "JaneDoe@example.com", VALID_PASSWORD
        ).json()["id"]
        t1 = login_request(*VALID_LOGIN).json()["token"]
        t2 = login_request("JaneDoe@example.com", VALID_PASSWORD).json()["token"]

        # Friend request
        friend_request(t1, u2)
        d = self.get_notifications(t2).json()
        not_id = d["items"][0]["id"]
        self.check_notifications(d, 1, "FRIEND_REQUEST")

        # Unread notifications count
        self.assertEqual(self.get_unread_notifications_count(t2).json(), 1)

        # Mark notification as read
        self.mark_notification_as_read(t2, not_id)
        self.assertEqual(self.get_unread_notifications_count(t2).json(), 0)

        # Friend request accepted
        friend_request(t2, u1)
        self.check_notifications(
            self.get_notifications(t1).json(), 1, "FRIEND_REQUEST_ACCEPTED"
        )

        # Post created
        p = create_post(t2, "Hello").json()["id"]
        self.check_notifications(self.get_notifications(t1).json(), 2, "FRIEND_POSTED")

        # Post liked
        like_post(t1, p)
        self.check_notifications(self.get_notifications(t2).json(), 2, "POST_LIKED")

        # Post commented
        comment_post(t1, p, "Nice post")
        self.check_notifications(self.get_notifications(t2).json(), 3, "POST_COMMENTED")


class PostTest(TestCase):
    def get_post(self, token, id):
        return client.get(f"/api/post/{id}", HTTP_AUTHORIZATION=f"Bearer {token}")

    def get_posts_of_user(self, token, id):
        return client.get(
            f"/api/post/ofUser/{id}", HTTP_AUTHORIZATION=f"Bearer {token}"
        )

    def get_feed(self, token):
        return client.get("/api/post/feed", HTTP_AUTHORIZATION=f"Bearer {token}")

    def comments_of_post(self, token, id):
        return client.get(
            f"/api/post/{id}/comments", HTTP_AUTHORIZATION=f"Bearer {token}"
        )

    def delete_post(self, token, id):
        return client.delete(f"/api/post/{id}", HTTP_AUTHORIZATION=f"Bearer {token}")

    def delete_comment(self, token, id):
        return client.delete(
            f"/api/post/comment/{id}", HTTP_AUTHORIZATION=f"Bearer {token}"
        )

    def test_post(self):
        u1 = register_request(*VALID_CREDENTIALS).json()["id"]
        u2 = register_request(
            "Jane", "Doe", "JaneDoe@example.com", VALID_PASSWORD
        ).json()["id"]
        t1 = login_request(*VALID_LOGIN).json()["token"]
        t2 = login_request("JaneDoe@example.com", VALID_PASSWORD).json()["token"]

        # Create post
        p = create_post(t1, "Hello").json()["id"]

        # Get non existing post
        self.assertEqual(self.get_post(t1, uuid4()).status_code, 404)

        # Get post
        self.assertEqual(self.get_post(t1, p).json()["content"], "Hello")

        # Get posts of user
        self.assertEqual(self.get_posts_of_user(t1, u1).json()["count"], 1)

        # Get feed
        self.assertEqual(self.get_feed(t1).json()["count"], 1)
        self.assertEqual(self.get_feed(t2).json()["count"], 0)

        # Become friends
        friend_request(t1, u2)
        friend_request(t2, u1)

        # Get feed
        self.assertEqual(self.get_feed(t2).json()["count"], 1)

        # Like post
        like_post(t2, p)
        self.assertEqual(self.get_post(t1, p).json()["likes"], 1)

        # Comment post
        comment_post(t2, p, "Nice post")
        self.assertEqual(self.comments_of_post(t1, p).json()["count"], 1)

        comment_id = self.comments_of_post(t1, p).json()["items"][0]["id"]
        # Delete comment from wrong user
        self.assertEqual(self.delete_comment(t1, comment_id).status_code, 404)

        # Delete comment
        self.assertEqual(self.delete_comment(t2, comment_id).status_code, 200)

        # Comment count
        self.assertEqual(self.comments_of_post(t1, p).json()["count"], 0)

        # Delete post from wrong user
        self.assertEqual(self.delete_post(t2, p).status_code, 404)

        # Delete post
        self.assertEqual(self.delete_post(t1, p).status_code, 200)

        # Get feed
        self.assertEqual(self.get_feed(t1).json()["count"], 0)
        self.assertEqual(self.get_feed(t2).json()["count"], 0)
