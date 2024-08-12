import express from "express";

import prisma from "../db.js";

const router = express.Router();

router.get("/:file", async (req, res) => {
    const wantedFile = req.params.file;

    const message = await prisma.message.findUnique({
        where: { file: wantedFile },
    });
    
    if (
        !message ||
        ![message.recipientId, message.senderId].includes(req.user.id)
    ) {
        return res.status(404).send("File not found");
    }

    res.status(200);
    res.header("Content-Type", "");
    res.header("X-Accel-Redirect", `/private/${wantedFile}`);
    res.end();
});

export default router;
