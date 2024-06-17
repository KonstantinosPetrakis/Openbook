import express from "express";
import fs from "fs/promises";

import { getPublicFileDirectory, handleVideoStream } from "../helpers.js";
import { VIDEO_EXTENSIONS } from "../validators/helpers.js";

const router = express.Router();

router.get("/:file", async (req, res) => {
    const fileName = req.params.file;
    const fileExtension = fileName.split(".")[1];
    const path = getPublicFileDirectory(fileName);

    if (VIDEO_EXTENSIONS.includes(fileExtension))
        return handleVideoStream(req, res, path);

    try {
        await fs.stat(path);
    } catch (error) {
        return res.sendStatus(404);
    }

    return res.sendFile(path, { root: process.cwd() });
});

export default router;
