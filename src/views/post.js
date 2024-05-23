import express from "express";
import { PrismaClient } from "@prisma/client";
import { body, validationResult, matchedData } from "express-validator";

const prisma = new PrismaClient();

const router = express.Router();

router.post("/create", async (req, res) => {
    res.json({ message: "Create post" });
});

export default router;
