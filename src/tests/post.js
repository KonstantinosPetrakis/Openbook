import { URL, authFetch, assertEqual } from "./helpers.js";
import { createUsers } from "./user.js";

async function createPost(token, content) {
    const response = await authFetch(`${URL}/post`, token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
    });

    return (await response.json()).id;
}

async function deletePost(token, id) {
    return (
        await authFetch(`${URL}/post/${id}`, token, {
            method: "DELETE",
        })
    ).status;
}

async function getPost(token, id) {
    const response = await authFetch(`${URL}/post/${id}`);
    return await response.json();
}

async function likePost(token, id) {
    return (
        await authFetch(`${URL}/post/like/${id}`, token, {
            method: "POST",
        })
    ).status;
}

async function createComment(token, postId, content) {
    const response = await authFetch(`${URL}/post/comment/${postId}`, token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
    });

    return (await response.json()).id;
}

async function deleteComment(token, id) {
    return (
        await authFetch(`${URL}/post/comment/${id}`, token, {
            method: "DELETE",
        })
    ).status;
}

async function getComments(token, id) {
    const response = await authFetch(`${URL}/post/${id}/comments`, token);
    return await response.json();
}

async function getFeed(token) {
    const response = await authFetch(`${URL}/post/feed`, token);
    return await response.json();
}

export async function main() {
    // Create post unauthorized
    // Create post from user1
    // Create post from user2
    // Try to delete post of another user
    // Delete post of own user
    // Get nonexisting post
    // Get existing post
    // Like Post
    // Unlike Post
    // Comment post thrice
    // Try to delete non existent comment
    // Delete 1 of 3 comments
    // Get comments of post
    // Check feed from a user (empty)
    // Create 3 posts from 3 different users
    // Add 2 of the 3 users from another user
    // Check the feed from that user
    // Then make one of the friends create a new post
    // Check the feed again (+=1 post)
}
