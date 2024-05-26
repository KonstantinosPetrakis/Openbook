import fs from "fs/promises";
import express from "express";
import { body, validationResult, matchedData } from "express-validator";
import multer from "multer";
import cuid from "cuid";

import * as validator from "../validators/post.js";
import {
    checkNamedFilesOutOfMany,
    getPublicFileDirectory,
} from "../helpers.js";
import prisma, {
    selectJoinedPostData,
    processFetchedJoinedPostData,
} from "../db.js";

const upload = multer();
const router = express.Router();

router.post(
    "/",
    upload.fields([{ name: "files", maxCount: 20 }]),
    validator.postCreate,
    async (req, res) => {
        const files = checkNamedFilesOutOfMany(req, "files");
        const post = await prisma.post.create({
            data: {
                content: matchedData(req).content,
                authorId: req.user.id,
            },
        });

        await prisma.postFile.createMany({
            data: files.map((file) => {
                file.id = cuid();
                const fileName = `${file.id}.${file.mimetype.split("/")[1]}`;
                fs.writeFile(getPublicFileDirectory(fileName), file.buffer);
                return {
                    id: file.id,
                    postId: post.id,
                    file: fileName,
                };
            }),
        });

        return res.status(201).json({ id: post.id });
    }
);

router.delete("/:id", validator.postExists, async (req, res) => {
    if (req.post.authorId !== req.user.id) return res.sendStatus(403);

    const files = await prisma.postFile.findMany({
        where: { postId: req.params.id },
    });

    files.forEach((file) => fs.unlink(getPublicFileDirectory(file.file)));
    await prisma.postFile.deleteMany({ where: { postId: req.params.id } });
    await prisma.post.delete({ where: { id: req.params.id } });
    return res.sendStatus(200);
});

router.get("/:id", validator.postExists, async (req, res) => {
    let post = await prisma.post.findUnique({
        where: { id: req.params.id },
        ...selectJoinedPostData(req),
    });

    return res.json(processFetchedJoinedPostData(post));
});

router.post("/like/:id", async (req, res) => {
    const post = await prisma.post.findUnique({
        where: { id: req.params.id },
        include: {
            likes: {
                where: {
                    likedById: req.user.id,
                },
            },
        },
    });

    if (!post) return res.sendStatus(404);

    const likeData = { postId: req.params.id, likedById: req.user.id };

    if (post.likes.length > 0) {
        await prisma.postLike.delete({ where: { likedById_postId: likeData } });
        return res.sendStatus(200);
    } else {
        await prisma.postLike.create({ data: likeData });
        return res.sendStatus(201);
    }
});

router.post(
    "/comment/:id",
    upload.single("file"),
    validator.commentCreate,
    async (req, res) => {
        const file = req.file;
        const content = matchedData(req).content;

        if (!content && !file) return res.sendStatus(400);

        const commentData = {
            content,
            postId: req.params.id,
            authorId: req.user.id,
        };

        if (file) {
            const fileName = `${cuid()}.${file.mimetype.split("/")[1]}`;
            fs.writeFile(getPublicFileDirectory(fileName), file.buffer);
            commentData.file = fileName;
        }

        const comment = await prisma.postComment.create({ data: commentData });
        return res.status(201).json({ id: comment.id });
    }
);

router.delete("/comment/:id", validator.commentExists, async (req, res) => {
    if (req.comment.authorId !== req.user.id) return res.sendStatus(403);

    if (req.comment.file) fs.unlink(getPublicFileDirectory(req.comment.file));
    await prisma.postComment.delete({ where: { id: req.params.id } });
    return res.sendStatus(200);
});

router.get("/:id/comments", validator.postExists, async (req, res) => {
    const page = Number(req.query.page || 1);
    const resultsPerPage = Number(process.env.RESULTS_PER_PAGE || 10);

    const comments = await prisma.postComment.findMany({
        where: {
            postId: req.params.id,
        },
        skip: (page - 1) * resultsPerPage,
        take: resultsPerPage,
        orderBy: { commentedAt: "desc" },
    });

    return res.json(comments);
});

export default router;
