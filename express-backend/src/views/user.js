import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { matchedData } from "express-validator";

import * as validator from "../validators/user.js";
import {
    checkNamedFileOutOfMany,
    excludeFieldsFromObject,
    excludeUndefinedFieldsFromObject,
    formatFileFields,
    updateModelFile,
    paginate,
} from "../helpers.js";
import prisma from "../db.js";

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
        return res.status(201).json({ id: user.id });
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
        id: user.id,
    });
});

router.patch("/", validator.userUpdate, async (req, res) => {
    const valuesToUpdate = excludeUndefinedFieldsFromObject(matchedData(req));

    if (valuesToUpdate.password)
        valuesToUpdate.password = await bcrypt.hash(
            valuesToUpdate.password,
            Number(process.env.SALT_HASH_ROUNDS) || 10
        );

    for (const attribute of ["profileImage", "backgroundImage"]) {
        valuesToUpdate[attribute] = updateModelFile(
            req.user,
            checkNamedFileOutOfMany(req, attribute),
            attribute,
            (model, extension) => `${attribute}_${model.id}.${extension}`
        );
    }

    try {
        await prisma.user.update({
            where: { id: req.user.id },
            data: valuesToUpdate,
        });
    } catch (error) {
        return res.sendStatus(409);
    }

    return res.sendStatus(200);
});

router.get("/:id", validator.isValidUser(), async (req, res) => {
    const friendshipRecord = await prisma.friendship.findFirst({
        where: {
            OR: [
                {
                    requestedById: req.user.id,
                    acceptedById: req.extraUser.id,
                },
                {
                    requestedById: req.extraUser.id,
                    acceptedById: req.user.id,
                },
            ],
        },
    });

    req.extraUser.friendshipStatus = friendshipRecord
        ? friendshipRecord.acceptedAt
            ? "friend"
            : friendshipRecord.requestedById === req.user.id
            ? "requested"
            : "received"
        : "stranger";

    return res.json(
        formatFileFields(excludeFieldsFromObject(req.extraUser, ["password"]), [
            "profileImage",
            "backgroundImage",
        ])
    );
});

router.get("/search/:query", async (req, res) => {
    return res.json({
        items: (
            (await prisma.user.findMany({
                where: {
                    OR: [
                        {
                            firstName: {
                                contains: req.params.query,
                                mode: "insensitive",
                            },
                        },
                        {
                            lastName: {
                                contains: req.params.query,
                                mode: "insensitive",
                            },
                        },
                        {
                            email: {
                                contains: req.params.query,
                                mode: "insensitive",
                            },
                        },
                    ],
                },
                ...paginate(req),
            })) || []
        )
            .map((u) => excludeFieldsFromObject(u, ["password"]))
            .map((u) =>
                formatFileFields(u, ["profileImage", "backgroundImage"])
            ),
    });
});

export default router;
