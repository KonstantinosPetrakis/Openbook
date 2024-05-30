import {
    URL,
    authFetch,
    assertEqual,
    assertCallable,
    sleep,
} from "./helpers.js";

import { addFriend } from "./friends.js";

import { createUsers } from "./user.js";

export async function createPost(token, content) {
    const response = await authFetch(`${URL}/post`, token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
    });

    return response.ok ? (await response.json()).id : undefined;
}

export async function deletePost(token, id) {
    return (
        await authFetch(`${URL}/post/${id}`, token, {
            method: "DELETE",
        })
    ).status;
}

export async function getPost(token, id) {
    const response = await authFetch(`${URL}/post/${id}`, token);
    return response.ok ? await response.json() : undefined;
}

export async function getPostsOfUser(token, id) {
    const response = await authFetch(`${URL}/post/ofUser/${id}`, token);
    return response.ok ? await response.json() : undefined;
}

export async function likePost(token, id) {
    return (
        await authFetch(`${URL}/post/like/${id}`, token, {
            method: "POST",
        })
    ).status;
}

export async function createComment(token, postId, content) {
    const response = await authFetch(`${URL}/post/comment/${postId}`, token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
    });

    return response.ok ? (await response.json()).id : undefined;
}

export async function deleteComment(token, id) {
    return (
        await authFetch(`${URL}/post/comment/${id}`, token, {
            method: "DELETE",
        })
    ).status;
}

export async function getComments(token, id) {
    const response = await authFetch(`${URL}/post/${id}/comments`, token);
    return await response.json();
}

export async function getFeed(token) {
    const response = await authFetch(`${URL}/post/feed`, token);
    return await response.json();
}

export async function main() {
    const { userIds, tokens } = await createUsers();

    // Create post unauthorized
    assertEqual(await createPost("123", "Hello World"), undefined);

    // Create post from user0
    const post0Id = await createPost(tokens[0], "Hello World");
    assertCallable(post0Id, (value) => typeof value === "string");
    assertCallable(await getPostsOfUser(tokens[0], userIds[0]), (value) =>
        value.some((post) => post.id === post0Id)
    );

    // Create post from user1
    const post1Id = await createPost(tokens[1], "Hello World");
    assertCallable(post1Id, (value) => typeof value === "string");

    // Try to delete post of another user
    assertEqual(await deletePost(tokens[0], post1Id), 403);

    // Delete post of own user
    assertEqual(await deletePost(tokens[1], post1Id), 200);

    // Get nonexisting post
    assertEqual(await getPost(tokens[0], "123"), undefined);

    // Like Post
    assertEqual(await likePost(tokens[0], post0Id), 201);
    assertCallable(
        await getPost(tokens[0], post0Id),
        (value) => value.likes === 1 && value.liked
    );
    assertCallable(
        await getPost(tokens[1], post0Id),
        (value) => value.likes === 1 && !value.liked
    );

    // Unlike Post
    assertEqual(await likePost(tokens[0], post0Id), 200);
    assertCallable(
        await getPost(tokens[0], post0Id),
        (value) => value.likes === 0 && !value.liked
    );

    // Comment post thrice
    const comments = [];
    for (let i = 0; i < 3; i++) {
        comments.push(await createComment(tokens[i], post0Id, `Comment ${i}`));
        await sleep(100); // Sleep to ensure different timestamps
    }
    assertCallable(
        await getPost(tokens[0], post0Id),
        (value) => value.comments === 3
    );

    // Delete 1 of 3 comments
    assertEqual(await deleteComment(tokens[0], await comments[0]), 200);
    assertCallable(
        await getPost(tokens[0], post0Id),
        (value) => value.comments === 2
    );

    assertCallable(
        await getComments(tokens[0], post0Id),
        (value) =>
            value.length === 2 &&
            value[0].content === "Comment 2" &&
            value[1].content === "Comment 1"
    );

    // Try to delete nonexisting comment
    assertEqual(await deleteComment(tokens[0], comments[0]), 404);

    // Try to delete comment of another user
    assertEqual(await deleteComment(tokens[1], comments[2]), 403);

    // Check feed from a user (empty)
    assertEqual((await getFeed(tokens[0])).length, 0);

    // Create 3 posts from 3 different users
    for (let i = 3; i < 6; i++) {
        await createPost(tokens[i], "Hello World");
    }
    // Add 2 of the 3 users from another user
    await addFriend(tokens[3], userIds[4]);
    await addFriend(tokens[3], userIds[5]);
    await addFriend(tokens[4], userIds[3]);
    await addFriend(tokens[5], userIds[3]);

    // Check the feed from that user
    assertEqual((await getFeed(tokens[3])).length, 2);

    // Then make one of the friends create a new post
    await createPost(tokens[4], "Hello World");

    // Check the feed again (+=1 post)
    assertEqual((await getFeed(tokens[3])).length, 3);
}
