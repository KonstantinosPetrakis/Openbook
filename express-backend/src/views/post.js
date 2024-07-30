import fs from "fs/promises";
import { NotificationType } from "@prisma/client";
import express from "express";
import { matchedData } from "express-validator";
import cuid from "cuid";

import * as validator from "../validators/post.js";
import { isValidUser } from "../validators/user.js";
import {
    getPublicFileDirectory,
    getPublicFileURL,
    paginate,
} from "../helpers.js";
import prisma, {
    selectJoinedPostData,
    processFetchedJoinedPostData,
    friendsOf,
} from "../db.js";
import { createNotification } from "./notification.js";

const router = express.Router();

router.post("/", validator.postCreate, async (req, res) => {
    const post = await prisma.post.create({
        data: {
            content: matchedData(req).content,
            authorId: req.user.id,
        },
    });

    await prisma.postFile.createMany({
        data: (req.files || []).map((file) => {
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

    const friends = await friendsOf(req.user);
    const userPublicImage = getPublicFileURL(req.user.profileImage);
    friends.forEach((friendId) => {
        createNotification(friendId, NotificationType.FRIEND_POSTED, {
            postId: post.id,
            userId: req.user.id,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            profileImage: userPublicImage,
        });
    });
    return res.status(201).json({ id: post.id });
});

router.delete("/:id", validator.postExists, async (req, res) => {
    if (req.post.authorId !== req.user.id) return res.sendStatus(403);

    const files = await prisma.postFile.findMany({
        where: { postId: req.params.id },
    });

    files.forEach((file) => fs.unlink(getPublicFileDirectory(file.file)));
    await prisma.post.delete({ where: { id: req.params.id } });
    return res.sendStatus(200);
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
        await createNotification(post.authorId, NotificationType.POST_LIKED, {
            postId: req.params.id,
            userId: req.user.id,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            profileImage: getPublicFileURL(req.user.profileImage),
        });
        return res.sendStatus(201);
    }
});

router.post("/comment/:id", validator.commentCreate, async (req, res) => {
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
    await createNotification(
        req.post.authorId,
        NotificationType.POST_COMMENTED,
        {
            postId: req.params.id,
            userId: req.user.id,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            profileImage: getPublicFileURL(req.user.profileImage),
            content: content || "An attachment",
        }
    );
    return res.status(201).json({ id: comment.id });
});

router.delete("/comment/:id", validator.commentExists, async (req, res) => {
    if (req.comment.authorId !== req.user.id) return res.sendStatus(403);

    if (req.comment.file) fs.unlink(getPublicFileDirectory(req.comment.file));
    await prisma.postComment.delete({ where: { id: req.params.id } });
    return res.sendStatus(200);
});

router.get("/:id/comments", validator.postExists, async (req, res) => {
    const comments = await prisma.postComment.findMany({
        where: {
            postId: req.params.id,
        },
        include: {
            author: true,
        },
        orderBy: { commentedAt: "desc" },
        ...paginate(req),
    });

    for (let comment of comments) {
        comment.file = getPublicFileURL(comment.file);
        comment.author.profileImage = getPublicFileURL(
            comment.author.profileImage
        );
    }

    return res.json({ items: comments });
});

router.get("/feed", async (req, res) => {
    return res.json({
        items: (
            (await prisma.post.findMany({
                where: {
                    authorId: {
                        in: [...(await friendsOf(req.user)), req.user.id],
                    },
                },
                orderBy: {
                    postedAt: "desc",
                },
                ...selectJoinedPostData(req),
                ...paginate(req),
            })) || []
        ).map((p) => processFetchedJoinedPostData(p)),
    });
});

router.get("/ofUser/:id", isValidUser(), async (req, res) => {
    return res.json({
        items: (
            (await prisma.post.findMany({
                where: { authorId: req.params.id },
                orderBy: { postedAt: "desc" },
                ...selectJoinedPostData(req),
                ...paginate(req),
            })) || []
        ).map((p) => processFetchedJoinedPostData(p)),
    });
});

router.get("/:id", validator.postExists, async (req, res) => {
    let post = await prisma.post.findUnique({
        where: { id: req.params.id },
        ...selectJoinedPostData(req),
    });

    return res.json(processFetchedJoinedPostData(post));
});

export default router;
