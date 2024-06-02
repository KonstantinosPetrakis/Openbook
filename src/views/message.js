import fs from "fs/promises";
import cuid from "cuid";
import express from "express";
import { matchedData } from "express-validator";

import * as validator from "../validators/message.js";
import prisma from "../db.js";
import { formatFileFields, getPrivateFileDirectory } from "../helpers.js";

const router = express.Router();

router.post("/", validator.messageValidator, async (req, res) => {
    const areFriends = await prisma.friendship.findFirst({
        where: {
            OR: [
                {
                    requestedById: req.user.id,
                    acceptedById: req.params.id,
                },
                {
                    requestedById: req.params.id,
                    acceptedById: req.user.id,
                },
            ],
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
    return res.sendStatus(201);
});

router.get("/:id", async (req, res) => {
    const resultsPerPage = Number(process.env["RESULTS_PER_PAGE"] || 10);
    const page = Number(req.query.page || 1);

    const messages = (
        (await prisma.message.findMany({
            where: {
                OR: [
                    {
                        senderId: req.user.id,
                        recipientId: req.params.id,
                    },
                    {
                        senderId: req.params.id,
                        recipientId: req.user.id,
                    },
                ],
            },
            orderBy: {
                sentAt: "desc",
            },
            skip: (page - 1) * resultsPerPage,
            take: resultsPerPage,
        })) || []
    ).map((m) => formatFileFields(m, ["file"], true));

    return res.json(await Promise.all(messages));
});

export default router;
