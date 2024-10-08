import { URL, authFetch, assertEqual } from "./helpers.js";
import { createUsers, getUser } from "./user.js";

/**
 * This function sends a friend request to a user.
 * It's also used to accept a friend request.
 * @param {string} token the token to authenticate with.
 * @param {string} id the id of the user to send a friend request to or accept a friend request from.
 * @returns {Promise<number>} the status code of the request.
 */
export async function addFriend(token, id) {
    const response = await authFetch(`${URL}/friendship/add/${id}`, token, {
        method: "POST",
    });
    return response.status;
}

/**
 * This function gets the friends of the authenticated user.
 * @param {string} token the token to authenticate with.
 * @returns {Promise<string[]>} the friends of the user.
 */
export async function getFriends(token) {
    const response = await authFetch(`${URL}/friendship`, token);
    return await response.json();
}

/**
 * This function deletes a friend from the authenticated user.
 * @param {string} token the token to authenticate with.
 * @param {string} id the id of the friend to delete.
 * @returns {Promise<number>} the status code of the request.
 */
export async function deleteFriend(token, id) {
    const response = await authFetch(`${URL}/friendship/remove/${id}`, token, {
        method: "DELETE",
    });

    return response.status;
}

/**
 * This function tests the friends functionality.
 */
export async function main() {
    const { tokens, userIds } = await createUsers();

    // Accept friend request
    await addFriend(tokens[0], userIds[1]);
    assertEqual(
        (await getUser(tokens[0], userIds[1])).friendshipStatus,
        "requested"
    );
    assertEqual(
        (await getUser(tokens[1], userIds[0])).friendshipStatus,
        "received"
    );
    assertEqual(await addFriend(tokens[0], userIds[1]), 403);
    assertEqual(await getFriends(tokens[0]), []);
    assertEqual(await getFriends(tokens[1]), []);
    await addFriend(tokens[1], userIds[0]);
    assertEqual(
        (await getUser(tokens[0], userIds[1])).friendshipStatus,
        "friend"
    );
    assertEqual(
        (await getUser(tokens[1], userIds[0])).friendshipStatus,
        "friend"
    );
    assertEqual(await getFriends(tokens[0]), [userIds[1]]);
    assertEqual(await getFriends(tokens[1]), [userIds[0]]);

    // Remove friend from request side
    assertEqual(
        (await getUser(tokens[2], userIds[3])).friendshipStatus,
        "stranger"
    );
    assertEqual(
        (await getUser(tokens[3], userIds[2])).friendshipStatus,
        "stranger"
    );
    await addFriend(tokens[2], userIds[3]);
    await addFriend(tokens[3], userIds[2]);
    assertEqual(
        (await getUser(tokens[2], userIds[3])).friendshipStatus,
        "friend"
    );
    assertEqual(
        (await getUser(tokens[3], userIds[2])).friendshipStatus,
        "friend"
    );
    assertEqual(await getFriends(tokens[2]), [userIds[3]]);
    assertEqual(await getFriends(tokens[3]), [userIds[2]]);
    await deleteFriend(tokens[2], userIds[3]);
    assertEqual(await getFriends(tokens[2]), []);
    assertEqual(await getFriends(tokens[3]), []);
    assertEqual(
        (await getUser(tokens[2], userIds[3])).friendshipStatus,
        "stranger"
    );
    assertEqual(
        (await getUser(tokens[3], userIds[2])).friendshipStatus,
        "stranger"
    );

    // Remove friend from accept side
    await addFriend(tokens[4], userIds[5]);
    await addFriend(tokens[5], userIds[4]);
    await deleteFriend(tokens[5], userIds[4]);
    assertEqual(await getFriends(tokens[4]), []);
    assertEqual(await getFriends(tokens[5]), []);

    // Delete friend request
    await addFriend(tokens[6], userIds[7]);
    await deleteFriend(tokens[6], userIds[7]);

    // Deny friend request
    await addFriend(tokens[8], userIds[9]);
    await deleteFriend(tokens[9], userIds[8]);
}
