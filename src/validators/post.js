import { body } from "express-validator";
import { returnValidationError } from "./helpers.js";

import prisma from "../db.js";

export async function postExists(req, res, next) {
    const post = await prisma.post.findUnique({
        where: { id: req.params.id },
    });

    if (!post) return res.sendStatus(404);
    req.post = post;
    next();
}

export async function commentExists(req, res, next) {
    const comment = await prisma.postComment.findUnique({
        where: { id: req.params.id },
    });

    if (!comment) return res.sendStatus(404);
    req.comment = comment;
    next();
}

export const postCreate = [body("content").escape(), returnValidationError];

export const commentCreate = [
    postExists,
    body("content").escape(),
    returnValidationError,
];
