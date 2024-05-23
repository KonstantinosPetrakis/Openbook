import fs from "fs/promises";
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import { PrismaClient } from "@prisma/client";
import { matchedData } from "express-validator";

import * as validator from "../validators/user.js";
import {
    checkNamedImageOutOfMany,
    excludeFieldsFromObject,
    updateUserImage,
} from "../helpers.js";

const upload = multer();
const prisma = new PrismaClient();
const router = express.Router();

router.post("/register", validator.userRegister, async (req, res) => {
    const { email, password, firstName, lastName } = matchedData(req);
    try {
        const user = await prisma.user.create({
            data: {
                email,
                firstName,
                lastName,
                password: await bcrypt.hash(
                    password,
                    Number(process.env.SALT_HASH_ROUNDS) || 10
                ),
            },
        });
        return res.json({
            id: user.id,
            message: "User created successfully",
        });
    } catch (error) {
        return res.sendStatus(409);
    }
});

router.post("/login", validator.loginValidator, async (req, res) => {
    const { email, password } = matchedData(req);
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user || !(await bcrypt.compare(password, user.password)))
        return res.sendStatus(401);

    return res.json({
        token: jwt.sign({ id: user.id }, process.env.SECRET_KEY || "", {
            expiresIn: "7d",
        }),
    });
});

router.patch(
    "/",
    upload.fields([
        { name: "profileImage", maxCount: 1 },
        { name: "backgroundImage", maxCount: 1 },
    ]),
    validator.userUpdate,
    async (req, res) => {
        const valuesToUpdate = Object.entries(matchedData(req)).reduce(
            (acc, [key, value]) => {
                if (value !== undefined) acc[key] = value;
                return acc;
            },
            {}
        );

        for (const image of ["profileImage", "backgroundImage"]) {
            const imageUrl = updateUserImage(
                req.user,
                checkNamedImageOutOfMany(req, image),
                image
            );
            if (imageUrl) valuesToUpdate[image] = imageUrl;
        }

        await prisma.user.update({
            where: { id: req.user.id },
            data: valuesToUpdate,
        });

        return res.sendStatus(200);
    }
);

router.get("", async (req, res) => {
    return res.json(excludeFieldsFromObject(req.user, ["password"]));
});

export default router;
