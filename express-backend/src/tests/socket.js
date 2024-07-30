import io from "socket.io-client";
import { addFriend } from "./friendship.js";
import { createUsers } from "./user.js";
import { sendMessage } from "./message.js";
import { createPost, createComment, likePost } from "./post.js";
import { sleep, assertEqual } from "./helpers.js";

const facts = [];

export async function main() {
    const { userIds, tokens } = await createUsers();

    // Connect with a non-authenticated socket
    const fail_socket = io("http://localhost:3000", {
        auth: {
            token: "123",
        },
    });

    fail_socket.on("connect_error", () => facts.push("CONNECT_ERROR"));

    const socket = io("http://localhost:3000", {
        auth: {
            token: tokens[0],
        },
    });

    socket.on("connect_error", () => assertEqual(null, "CONNECT_ERROR"));

    socket.on("NEW_MESSAGE", () => facts.push("NEW_MESSAGE"));
    socket.on("NEW_NOTIFICATION", () => facts.push("NEW_NOTIFICATION"));

    socket.on("connect", async () => {
        const postId = await createPost(tokens[0], "Searching for friends");

        // Like notification
        await likePost(tokens[1], postId);

        // Comment notifications
        await createComment(tokens[1], postId, "I sent you a request!");
        await createComment(tokens[2], postId, "Can you add me?");

        // Friend Request notification
        await addFriend(tokens[1], userIds[0]);
        await addFriend(tokens[0], userIds[1]);
        await addFriend(tokens[0], userIds[2]);

        // Friend request accepted
        await addFriend(tokens[2], userIds[0]);

        // Message notification
        await sendMessage(
            tokens[1],
            userIds[0],
            "Hello there, I can be your friend!"
        );

        // Friend posted
        await createPost(tokens[1], "I got a new friend!");

        // Wait for all the notifications to be received
        await sleep(100);
        socket.disconnect();

        assertEqual(facts, [
            "CONNECT_ERROR",
            ...Array(5).fill("NEW_NOTIFICATION"),
            "NEW_MESSAGE",
            "NEW_NOTIFICATION",
        ]);
    });
}
