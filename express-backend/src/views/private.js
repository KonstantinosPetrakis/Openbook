import express from "express";
import { getPrivateFileDirectory } from "../helpers.js";
import jwt from "jsonwebtoken";

const router = express.Router();

router.get("/:id", (req, res) => {
    try {
        return res.sendFile(
            getPrivateFileDirectory(
                jwt.verify(req.params.id, process.env.SECRET_KEY || "").fileName
            ),
            { root: process.cwd() }
        );
    } catch (error) {
        return res.sendStatus(403);
    }
});

export default router;
