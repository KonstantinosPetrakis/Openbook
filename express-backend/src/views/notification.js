import express from "express";

import { updateUserForNewNotification } from "../socket.js";
import { paginate } from "../helpers.js";
import prisma from "../db.js";

const router = express.Router();

export async function createNotification(recipientId, type, data) {
    const notification = await prisma.notification.create({
        data: {
            recipientId,
            type,
            data,
        },
    });
    updateUserForNewNotification(recipientId);
    return notification;
}

router.get("/", async (req, res) => {
    return res.json(
        (await prisma.notification.findMany({
            where: {
                recipientId: req.user.id,
            },
            orderBy: {
                createdAt: "desc",
            },
            ...paginate(req)
        })) || []
    );
});

router.patch("/read/:id", async (req, res) => {
    try {
        await prisma.notification.update({
            where: {
                id: req.params.id,
            },
            data: {
                read: true,
            },
        });
        return res.sendStatus(200);
    } catch (error) {
        return res.sendStatus(404);
    }
});

export default router;
