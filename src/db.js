import { PrismaClient } from "@prisma/client";

import { formatFileFields, excludeFieldsFromObject } from "./helpers.js";

export default new PrismaClient();

/**
 * This function is used to define what fields are going to
 * be selected when fetching post data.
 * @param {object} req the request object from express.
 * @returns
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

    post.files = post.files.map(
        (file) => formatFileFields(file, ["file"]).file
    );

    post.liked = post.likes.length > 0;
    post.likes = post._count.likes;
    delete post._count;

    return post;
}
