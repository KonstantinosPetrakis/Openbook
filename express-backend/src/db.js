import { PrismaClient } from "@prisma/client";

import { formatFileFields, excludeFieldsFromObject } from "./helpers.js";

const prisma = new PrismaClient();
export default prisma;

/**
 * This function is used to define what fields are going to
 * be selected when fetching post data.
 * @param {object} req the request object from express.
 * @returns the object for selecting the data
 */
export function selectJoinedPostData(req) {
    return {
        select: {
            id: true,
            content: true,
            postedAt: true,
            _count: {
                select: {
                    likes: true,
                    comments: true,
                },
            },
            author: {
                select: {
                    id: true,
                    profileImage: true,
                    firstName: true,
                    lastName: true,
                },
            },
            files: {
                select: { file: true },
            },
            likes: {
                where: {
                    likedById: req.user.id,
                },
            },
        },
    };
}

/**
 * This function is used to process the fetched post data from the database.
 * The processing involves excluding some fields, calculating and formatting others.
 * @param {object} post the post object fetched from the database.
 * @returns {object} the processed post object.
 */
export function processFetchedJoinedPostData(post) {
    post = excludeFieldsFromObject(post, ["authorId"]);


    post.author = formatFileFields(post.author, ["profileImage"]);
    post.files = post.files.map(
        (file) => formatFileFields(file, ["file"]).file
    );

    post.liked = post.likes.length > 0;
    post.likes = post._count.likes;
    post.comments = post._count.comments;
    delete post._count;

    return post;
}

export async function friendsOf(user) {
    return (
        await prisma.friendship.findMany({
            where: {
                requestedById: user.id,
                acceptedAt: { not: null },
            },
            select: { requestedById: true, acceptedById: true },
        })
    )
        .map((friendship) => friendship.acceptedById)
        .concat(
            (
                await prisma.friendship.findMany({
                    where: {
                        acceptedById: user.id,
                        acceptedAt: { not: null },
                    },
                    select: { requestedById: true, acceptedById: true },
                })
            ).map((friendship) => friendship.requestedById)
        );
}
