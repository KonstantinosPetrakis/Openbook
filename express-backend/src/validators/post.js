import { body } from "express-validator";
import { returnValidationError } from "./helpers.js";

import { multerImageVideoUploader as upload } from "../helpers.js";
import { multerErrorHandler } from "./helpers.js";
import prisma from "../db.js";

/**
 * This is a middleware function that checks if a post exists based
 * on the id provided in the query parameters. If the post exists,
 * the post object is attached to the request object. Otherwise, a 404
 * status is sent back to the client.
 * @param {object} req the request object from express.
 * @param {object} res the response object from express.
 * @param {Function} next the next function to call in the middleware chain.
 */
export async function postExists(req, res, next) {
    const post = await prisma.post.findUnique({
        where: { id: req.params.id },
    });

    if (!post) return res.sendStatus(404);
    req.post = post;
    next();
}

/**
 * This is a middleware function that checks if a comment exists based
 * on the id provided in the query parameters. If the comment exists,
 * the comment object is attached to the request object. Otherwise, a 404
 * status is sent back to the client.
 * @param {object} req the request object from express.
 * @param {object} res the response object from express.
 * @param {Function} next the next function to call in the middleware chain.
 */
export async function commentExists(req, res, next) {
    const comment = await prisma.postComment.findUnique({
        where: { id: req.params.id },
    });

    if (!comment) return res.sendStatus(404);
    req.comment = comment;
    next();
}

export const postCreate = [
    upload.array("files", 20),
    multerErrorHandler,
    body("content").trim(),
    returnValidationError,
];

export const commentCreate = [
    upload.single("file"),
    multerErrorHandler,
    postExists,
    body("content"),
    returnValidationError,
];
