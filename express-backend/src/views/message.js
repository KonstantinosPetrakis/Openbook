import fs from "fs/promises";
import cuid from "cuid";
import express from "express";
import { matchedData } from "express-validator";

import * as validator from "../validators/message.js";
import { updateUserForNewMessage } from "../socket.js";
import prisma from "../db.js";
import {
    excludeFieldsFromObject,
    formatFileFields,
    getPrivateFileDirectory,
    paginate,
} from "../helpers.js";

const router = express.Router();

router.post("/", validator.messageValidator, async (req, res) => {
    const areFriends = await prisma.friendship.findFirst({
        where: {
            OR: [
                { requestedById: req.user.id, acceptedById: req.params.id },
                { requestedById: req.params.id, acceptedById: req.user.id },
            ],
            acceptedAt: { not: null },
        },
    });

    if (!areFriends) return res.sendStatus(403);

    const messageData = {
        content: matchedData(req).content,
        senderId: req.user.id,
        recipientId: matchedData(req).recipientId,
    };

    if (!req.file && !messageData.content) return res.sendStatus(400);

    if (req.file) {
        const fileName = `${cuid()}.${req.file.mimetype.split("/")[1]}`;
        fs.writeFile(getPrivateFileDirectory(fileName), req.file.buffer);
        messageData.file = fileName;
    }

    await prisma.message.create({ data: messageData });
    updateUserForNewMessage(messageData.recipientId);
    return res.sendStatus(201);
});

router.get("/chats", async (req, res) => {
    const result = await prisma.$queryRaw`
        WITH
            "ChatTable" AS (
                SELECT
                    "recipientId" AS "friendId",
                    "sentAt",
                    CONCAT (
                        'You: ', 
                        CASE 
                            WHEN "content" IS NULL
                                THEN '📎 Attachment'
                            ELSE 
                                "content"
                        END
                    ) as "content",
                    false as "attention"
                FROM
                    "Message"
                WHERE
                    "senderId" = ${req.user.id}
                UNION
                SELECT
                    "senderId" AS "friendId",
                    "sentAt",
                    CASE 
                        WHEN "content" IS NULL 
                            THEN '📎 Attachment'
                        ELSE
                            "content" 
                    END as "content",
                    NOT "read" as "attention"
                FROM
                    "Message"
                WHERE
                    "recipientId" = ${req.user.id}
            )
        SELECT
            "friendId",
            "firstName",
            "lastName",
            "profileImage",
            "lastActive",
            "sentAt",
            "content",
            "attention"
        FROM
            "ChatTable" INNER JOIN "User" ON "ChatTable"."friendId" = "User"."id"
        WHERE
            ("friendId", "sentAt") IN (
                SELECT
                    "friendId",
                    MAX("sentAt")
                FROM
                    "ChatTable"
                GROUP BY
                    "friendId"
            )
        ORDER BY "sentAt" DESC
    `;

    return res.json(result);
});

router.get("/:id", async (req, res) => {
    await prisma.message.updateMany({
        where: { senderId: req.params.id, recipientId: req.user.id },
        data: { read: true },
    });

    return res.json(
        (
            (await prisma.message.findMany({
                where: {
                    OR: [
                        { senderId: req.user.id, recipientId: req.params.id },
                        { senderId: req.params.id, recipientId: req.user.id },
                    ],
                },
                orderBy: {
                    sentAt: "desc",
                },
                ...paginate(req),
            })) || []
        ).map((m) => formatFileFields(m, ["file"], true))
    );
});

export default router;
