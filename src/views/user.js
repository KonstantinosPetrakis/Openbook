import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import { matchedData } from "express-validator";
import { NotificationType } from "@prisma/client";

import * as validator from "../validators/user.js";
import {
    checkNamedFileOutOfMany,
    excludeFieldsFromObject,
    excludeUndefinedFieldsFromObject,
    formatFileFields,
    updateModelFile,
} from "../helpers.js";
import prisma, {
    selectJoinedPostData,
    processFetchedJoinedPostData,
    friendsOf,
} from "../db.js";
import { createNotification } from "./notification.js";

const upload = multer();
const router = express.Router();

router.post("/register", validator.userRegister, async (req, res) => {
    const { email, password, firstName, lastName } = matchedData(req);
    try {
        const user = await prisma.user.create({
            data: {
                email,
                firstName,
                lastName,
                password: await bcrypt.hash(
                    password,
                    Number(process.env.SALT_HASH_ROUNDS) || 10
                ),
            },
        });
        return res.status(201).json({ id: user.id });
    } catch (error) {
        return res.sendStatus(409);
    }
});

router.post("/login", validator.loginValidator, async (req, res) => {
    const { email, password } = matchedData(req);
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user || !(await bcrypt.compare(password, user.password)))
        return res.sendStatus(401);

    return res.json({
        token: jwt.sign({ id: user.id }, process.env.SECRET_KEY || "", {
            expiresIn: "7d",
        }),
    });
});

router.patch(
    "/",
    upload.fields([
        { name: "profileImage", maxCount: 1 },
        { name: "backgroundImage", maxCount: 1 },
    ]),
    validator.userUpdate,
    async (req, res) => {
        const valuesToUpdate = excludeUndefinedFieldsFromObject(
            matchedData(req)
        );

        for (const attribute of ["profileImage", "backgroundImage"]) {
            valuesToUpdate[attribute] = updateModelFile(
                req.user,
                checkNamedFileOutOfMany(req, attribute),
                attribute,
                (model, extension) => `${attribute}_${model.id}.${extension}`
            );
        }

        await prisma.user.update({
            where: { id: req.user.id },
            data: valuesToUpdate,
        });

        return res.sendStatus(200);
    }
);

router.post("/addFriend/:id", validator.isValidUser(), async (req, res) => {
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
            { userId: req.user.id }
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
            { userId: req.user.id }
        );
        return res.sendStatus(200);
    }
});

router.delete(
    "/deleteFriend/:id",
    validator.isValidUser(),
    async (req, res) => {
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
    }
);

router.get("/friends", async (req, res) => {
    return res.json({ friends: await friendsOf(req.user) });
});

router.get("/friendRequests", async (req, res) => {
    const friendRequests = await prisma.friendship.findMany({
        where: {
            acceptedById: req.user.id,
            acceptedAt: null,
        },
    });

    const requestorIds = friendRequests.map(
        (friendRequest) => friendRequest.requestedById
    );

    return res.json({ friendRequests: requestorIds });
});

router.get("/:id", validator.isValidUser(), async (req, res) => {
    return res.json(
        formatFileFields(excludeFieldsFromObject(req.extraUser, ["password"]), [
            "profileImage",
            "backgroundImage",
        ])
    );
});

export default router;
