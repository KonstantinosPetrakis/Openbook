import express from "express";

import prisma from "../db.js";

const router = express.Router();

export async function createNotification(recipientId, type, data) {
    return await prisma.notification.create({
        data: {
            recipientId,
            type,
            data,
        },
    });
}

router.get("/", async (req, res) => {
    const page = Number(req.query.page) || 1;
    const resultsPerPage = Number(process.env.RESULTS_PER_PAGE || 10);

    return res.json(
        (await prisma.notification.findMany({
            where: {
                recipientId: req.user.id,
            },
            orderBy: {
                createdAt: "desc",
            },
            skip: (page - 1) * resultsPerPage,
            take: resultsPerPage,
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
