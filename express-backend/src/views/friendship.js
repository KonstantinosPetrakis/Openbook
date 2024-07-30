import express from "express";
import { NotificationType } from "@prisma/client";

import * as validator from "../validators/user.js";
import { getPublicFileURL } from "../helpers.js";
import { createNotification } from "./notification.js";
import prisma, { friendsOf } from "../db.js";

const router = express.Router();

router.post("/add/:id", validator.isValidUser(), async (req, res) => {
    const userDict = {
        userId: req.user.id,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        profileImage: getPublicFileURL(req.user.profileImage),
    };

    const friendEntity = await prisma.friendship.findFirst({
        where: {
            OR: [
                {
                    requestedById: req.user.id,
                    acceptedById: req.extraUser.id,
                },
                {
                    requestedById: req.extraUser.id,
                    acceptedById: req.user.id,
                },
            ],
        },
    });

    // Send friend request
    if (!friendEntity) {
        await prisma.friendship.create({
            data: {
                requestedById: req.user.id,
                acceptedById: req.extraUser.id,
            },
        });
        await createNotification(
            req.extraUser.id,
            NotificationType.FRIEND_REQUEST,
            userDict
        );
        return res.sendStatus(201);
    }

    // Already friends
    if (friendEntity.acceptedAt) return res.sendStatus(409);

    // Friend request already sent
    if (friendEntity.requestedById === req.user.id) return res.sendStatus(403);

    // Accept friend request
    if (friendEntity.requestedById === req.extraUser.id) {
        await prisma.friendship.update({
            where: {
                requestedById_acceptedById: {
                    requestedById: req.extraUser.id,
                    acceptedById: req.user.id,
                },
            },
            data: { acceptedAt: new Date() },
        });
        await createNotification(
            req.extraUser.id,
            NotificationType.FRIEND_REQUEST_ACCEPTED,
            userDict
        );
        return res.sendStatus(200);
    }
});

router.delete("/remove/:id", validator.isValidUser(), async (req, res) => {
    // This could be a friend request or an actual friendship.
    // In case of friend request this action will trigger a cancel or reject
    // depending on the user who initiated the request.
    const friendEntity = await prisma.friendship.findFirst({
        where: {
            OR: [
                {
                    requestedById: req.user.id,
                    acceptedById: req.extraUser.id,
                },
                {
                    requestedById: req.extraUser.id,
                    acceptedById: req.user.id,
                },
            ],
        },
    });

    if (!friendEntity) return res.sendStatus(404);

    await prisma.friendship.delete({
        where: {
            requestedById_acceptedById: {
                requestedById: friendEntity.requestedById,
                acceptedById: friendEntity.acceptedById,
            },
        },
    });
    return res.sendStatus(200);
});

router.get("", async (req, res) => {
    return res.json(await friendsOf(req.user));
});

export default router;
