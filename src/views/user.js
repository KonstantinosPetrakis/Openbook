import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import { matchedData } from "express-validator";

import * as validator from "../validators/user.js";
import {
    checkNamedFileOutOfMany,
    excludeFieldsFromObject,
    excludeUndefinedFieldsFromObject,
    formatFileFields,
    updateModelFile,
} from "../helpers.js";
import prisma, {
    selectJoinedPostData,
    processFetchedJoinedPostData,
} from "../db.js";

const upload = multer();
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
    });
});

router.get("/:id", validator.isValidUser, async (req, res) => {
    return res.json(
        formatFileFields(
            excludeFieldsFromObject(req.query.user, ["password"]),
            ["profileImage", "backgroundImage"]
        )
    );
});

router.patch(
    "/",
    upload.fields([
        { name: "profileImage", maxCount: 1 },
        { name: "backgroundImage", maxCount: 1 },
    ]),
    validator.userUpdate,
    async (req, res) => {
        const valuesToUpdate = excludeUndefinedFieldsFromObject(
            matchedData(req)
        );

        for (const attribute of ["profileImage", "backgroundImage"]) {
            valuesToUpdate[attribute] = updateModelFile(
                req.user,
                checkNamedFileOutOfMany(req, attribute),
                attribute,
                (model, extension) => `${attribute}_${model.id}.${extension}`
            );
        }

        await prisma.user.update({
            where: { id: req.user.id },
            data: valuesToUpdate,
        });

        return res.sendStatus(200);
    }
);

router.get("/posts/:id", validator.isValidUser, async (req, res) => {
    const page = Number(req.query.page || 1);
    const resultsPerPage = Number(process.env.RESULTS_PER_PAGE || 10);

    const posts = await prisma.post.findMany({
        where: { authorId: req.queryUser.id },
        skip: (page - 1) * resultsPerPage,
        take: resultsPerPage,
        orderBy: { postedAt: "desc" },
        ...selectJoinedPostData(req),
    });

    for (let i = 0; i < posts.length; i++)
        posts[i] = processFetchedJoinedPostData(posts[i]);

    return res.json(posts);
});

export default router;
