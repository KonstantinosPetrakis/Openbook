import { URL, authFetch, assertCallable, assertEqual } from "./helpers.js";
import { createUsers } from "./user.js";
import { addFriend } from "./friendship.js";
import { createPost, createComment, likePost } from "./post.js";

/**
 * This function returns the notifications of the user (paginated).
 * @param {string} token the token of the user.
 * @returns {Promise<Array>} the notifications of the user.
 */
async function getNotifications(token) {
    const response = await authFetch(`${URL}/notification`, token);
    return response.ok ? (await response.json()).items : [];
}

/**
 * This function marks a notification as read.
 * @param {string} token the token of the user.
 * @param {string} id the id of the notification. 
 * @returns {Promise<boolean>} a promise that resolves to whether the operation was successful.
 */
async function readNotification(token, id) {
    const response = await authFetch(`${URL}/notification/read/${id}`, token, {
        method: "PATCH",
    });
    return response.ok;
}

/**
 * This function tests the notification system.
 */
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

    // Read non-existent notification
    assertEqual(await readNotification(tokens[0], 0), false);

    // Read notification
    const notifications = await getNotifications(tokens[0]);
    assertEqual(await readNotification(tokens[0], notifications[0].id), true);
    assertCallable(
        await getNotifications(tokens[0]),
        (notifications) =>
            notifications[0].read &&
            !notifications[1].read &&
            !notifications[2].read
    );
}
