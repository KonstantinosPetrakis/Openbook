import express from "express";
import { getPrivateFileDirectory, handleVideoStream } from "../helpers.js";
import jwt from "jsonwebtoken";

const router = express.Router();

router.get("/:token", async (req, res) => {
    try {
        const fileName = jwt.verify(
            req.params.token,
            process.env.SECRET_KEY || ""
        ).fileName;
        const fileExtension = fileName.split(".")[1];
        const path = getPrivateFileDirectory(fileName);

        if (VIDEO_EXTENSIONS.includes(fileExtension))
            return handleVideoStream(req, res, path);

        await fs.readFile(path);
        return res.sendFile(path, { root: process.cwd() });
    } catch (error) {
        return res.sendStatus(403);
    }
});

export default router;
