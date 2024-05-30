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

export default router;
