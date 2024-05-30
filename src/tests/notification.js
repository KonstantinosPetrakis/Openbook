import { URL, authFetch, assertCallable } from "./helpers.js";
import { createUsers } from "./user.js";
import { addFriend } from "./friends.js";
import { createPost, createComment, likePost } from "./post.js";

async function getNotifications(token) {
    const response = await authFetch(`${URL}/notification`, token);
    return response.ok ? await response.json() : [];
}

export async function main() {
    const { userIds, tokens } = await createUsers();

    // FriendRequest / FriendRequestAccepted notifications
    await addFriend(tokens[0], userIds[1]);
    await addFriend(tokens[1], userIds[0]);
    assertCallable(
        await getNotifications(tokens[0]),
        (notifications) =>
            notifications.length === 1 &&
            notifications[0].type === "FRIEND_REQUEST_ACCEPTED"
    );
    assertCallable(
        await getNotifications(tokens[1]),
        (notifications) =>
            notifications.length === 1 &&
            notifications[0].type === "FRIEND_REQUEST"
    );

    // Friend posted
    const postId = await createPost(tokens[0], "Hello, world!");
    assertCallable(
        await getNotifications(tokens[1]),
        (notifications) =>
            notifications.length === 2 &&
            notifications[0].type === "FRIEND_POSTED"
    );

    // Post commented
    await createComment(tokens[1], postId, "Nice post!");
    assertCallable(
        await getNotifications(tokens[0]),
        (notifications) =>
            notifications.length === 2 &&
            notifications[0].type === "POST_COMMENTED"
    );

    // Post liked
    await likePost(tokens[0], postId);
    assertCallable(
        await getNotifications(tokens[0]),
        (notifications) =>
            notifications.length === 3 && notifications[0].type === "POST_LIKED"
    );
}
