const URL = "http:/localhost:3000/api/user/";
const USER_PASSWORD = "password";
const USERS_TO_CREATE = 10;
const VERBOSE = false;

async function authFetch(url, token, options) {
    return await fetch(url, {
        ...options,
        headers: {
            ...(options?.headers || {}),
            Authorization: `Bearer ${token}`,
        },
    });
}

function assertEqual(actual, expected) {
    if (JSON.stringify(actual) === JSON.stringify(expected)) {
        if (VERBOSE) console.log(`✅ ${actual} = ${expected}`);
    } else {
        console.error(`❌ ${actual} != ${expected}`);
        process.exit(1);
    }
}

async function createUser(email, password, firstName, lastName) {
    const response = await fetch(`${URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, firstName, lastName }),
    });

    return (await response.json()).id;
}

async function loginUser(email, password) {
    const response = await fetch(`${URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });

    return (await response.json()).token;
}

async function addFriend(token, id) {
    const response = await authFetch(`${URL}/addFriend/${id}`, token, {
        method: "POST",
    });
    return response.status;
}

async function getFriendRequests(token) {
    const response = await authFetch(`${URL}/friendRequests`, token);

    return (await response.json()).friendRequests;
}

async function getFriends(token) {
    const response = await authFetch(`${URL}/friends`, token);
    return (await response.json()).friends;
}

async function deleteFriend(token, id) {
    const response = await authFetch(`${URL}/deleteFriend/${id}`, token, {
        method: "DELETE",
    });

    return response.status;
}

async function main() {
    const userIds = [];
    const tokens = [];
    for (let i = 0; i < USERS_TO_CREATE; i++) {
        const email = `${crypto.randomUUID()}@example.com`;
        userIds.push(await createUser(email, USER_PASSWORD, "first", "last"));
        tokens.push(await loginUser(email, USER_PASSWORD));
    }

    // Accept friend request
    await addFriend(tokens[0], userIds[1]);
    assertEqual(await addFriend(tokens[0], userIds[1]), 403);
    assertEqual(await getFriends(tokens[0]), []);
    assertEqual(await getFriends(tokens[1]), []);
    assertEqual(await getFriendRequests(tokens[1]), [userIds[0]]);
    await addFriend(tokens[1], userIds[0]);
    assertEqual(await getFriends(tokens[0]), [userIds[1]]);
    assertEqual(await getFriends(tokens[1]), [userIds[0]]);

    // Remove friend from request side
    await addFriend(tokens[2], userIds[3]);
    await addFriend(tokens[3], userIds[2]);
    assertEqual(await getFriends(tokens[2]), [userIds[3]]);
    assertEqual(await getFriends(tokens[3]), [userIds[2]]);
    await deleteFriend(tokens[2], userIds[3]);
    assertEqual(await getFriends(tokens[2]), []);
    assertEqual(await getFriends(tokens[3]), []);

    // Remove friend from accept side
    await addFriend(tokens[4], userIds[5]);
    await addFriend(tokens[5], userIds[4]);
    await deleteFriend(tokens[5], userIds[4]);
    assertEqual(await getFriends(tokens[4]), []);
    assertEqual(await getFriends(tokens[5]), []);

    // Delete friend request
    await addFriend(tokens[6], userIds[7]);
    assertEqual(await getFriendRequests(tokens[7]), [userIds[6]]);
    await deleteFriend(tokens[6], userIds[7]);
    assertEqual(await getFriendRequests(tokens[7]), []);

    // Deny friend request
    await addFriend(tokens[8], userIds[9]);
    assertEqual(await getFriendRequests(tokens[9]), [userIds[8]]);
    await deleteFriend(tokens[9], userIds[8]);
    assertEqual(await getFriendRequests(tokens[9]), []);

    console.log("✅✨🎉 All tests passed!");
}

main();
