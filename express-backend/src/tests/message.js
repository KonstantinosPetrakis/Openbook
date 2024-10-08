import {
    authFetch,
    getPrivateFile,
    randomFileBlob,
    assertEqual,
    URL,
    assertCallable,
} from "./helpers.js";
import { createUsers } from "./user.js";
import { addFriend } from "./friendship.js";

export async function sendMessage(token, recipientId, text, file) {
    const formData = new FormData();
    formData.append("recipientId", recipientId);
    if (text) formData.append("content", text);
    if (file) formData.append("file", file);

    return (
        await authFetch(`${URL}/message`, token, {
            method: "POST",
            body: formData,
        })
    ).status;
}

/**
 * This function is used to get the paginated messages between a user and a friend.
 * @param {string} token the access token for the user.
 * @param {string} id the id of the friend.
 * @returns {Promise<Array>} a promise that resolves with the messages between the user and the friend.
 */
export async function getMessageWithFriend(token, id) {
    const response = await authFetch(`${URL}/message/${id}`, token);
    return response.ok ? (await response.json()).items : undefined;
}

export async function getChats(token) {
    const response = await authFetch(`${URL}/message/chats`, token);
    return response.ok ? await response.json() : undefined;
}

export async function main() {
    const { userIds, tokens } = await createUsers();

    // Test sending a message without being friends
    assertEqual(await sendMessage(tokens[0], userIds[1], "Hello, World!"), 403);

    await addFriend(tokens[0], userIds[1]);
    await addFriend(tokens[1], userIds[0]);

    // Try sending a message without content or a file
    assertEqual(await sendMessage(tokens[0], userIds[1]), 400);

    // Send a message with text content
    assertEqual(await sendMessage(tokens[0], userIds[1], "Hello, World!"), 201);
    assertCallable(
        await getMessageWithFriend(tokens[0], userIds[1]),
        (messages) =>
            messages.length === 1 && messages[0].content === "Hello, World!"
    );

    // Send a message with a file content
    const file = await randomFileBlob(1);
    assertEqual(await sendMessage(tokens[0], userIds[1], undefined, file), 201);
    const message = (await getMessageWithFriend(tokens[0], userIds[1]))[0];
    const messageFile = await (
        await getPrivateFile(message.file, tokens[0])
    ).blob();
    assertEqual(await messageFile.arrayBuffer(), await file.arrayBuffer());

    // Send a message with way too large of a file
    assertEqual(
        await sendMessage(
            tokens[0],
            userIds[1],
            undefined,
            await randomFileBlob(100)
        ),
        413
    );

    // Send a message with an unsupported file type
    assertEqual(
        await sendMessage(
            tokens[0],
            userIds[1],
            undefined,
            await randomFileBlob(1, "application/pdf")
        ),
        400
    );

    // Test chats by sending 3 messages to user2 from each user3, user4 and user5
    // Also make the user2 send a message to user6 and reply to only user3.

    for (let i = 3; i < 6; i++) {
        await addFriend(tokens[2], userIds[i]);
        await addFriend(tokens[i], userIds[2]);
        for (let j = 0; j < 3; j++)
            await sendMessage(tokens[i], userIds[2], `Message ${j + 1}`);
    }

    await addFriend(tokens[2], userIds[6]);
    await addFriend(tokens[6], userIds[2]);
    await sendMessage(tokens[2], userIds[6], "Message 1");

    await getMessageWithFriend(tokens[2], userIds[3]);
    await sendMessage(tokens[2], userIds[3], "Response to Message 1,2,3");

    assertCallable(
        await getChats(tokens[2]),
        (messages) =>
            messages[0].friendId === userIds[3] &&
            messages[1].friendId === userIds[6] &&
            messages[2].friendId == userIds[5] &&
            messages[3].friendId == userIds[4] &&
            messages[0].attention == false &&
            messages[1].attention == false &&
            messages[2].attention == true &&
            messages[3].attention == true
    );
}
