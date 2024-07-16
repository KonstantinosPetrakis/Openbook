import { Gender, RelationshipStatus } from "@prisma/client";
import { body } from "express-validator";

import { multerImageUploader as upload } from "../helpers.js";
import {
    isEnum,
    returnValidationError,
    multerErrorHandler,
} from "./helpers.js";
import prisma from "../db.js";

/**
 * This function is a middleware that checks if the user exists in the database
 * based on the user id in the request.
 * @param {"params" | "body"} position where the user id is located
 * @returns a middleware function that checks if the user exists in the database.
 */
export function isValidUser(position = "params") {
    return async (req, res, next) => {
        const user = await prisma.user.findUnique({
            where: { id: req[position].id },
        });

        if (!user) return res.sendStatus(404);

        req.extraUser = user;
        next();
    };
}

export const userRegister = [
    body("email", "Email must be a valid email.").isEmail(),
    body("password", "Password must have at least 8 characters.").isLength({
        min: 8,
    }),
    body("firstName", "First name must be specified").notEmpty(),
    body("lastName", "Last name must be specified").notEmpty(),
    returnValidationError,
];

export const loginValidator = [
    body("email", "Email must be a valid email.").isEmail(),
    body("password", "Password must be specified.").notEmpty(),
    returnValidationError,
];

export const userUpdate = [
    upload.fields([
        { name: "profileImage", maxCount: 1 },
        { name: "backgroundImage", maxCount: 1 },
    ]),
    multerErrorHandler,
    body("email").optional().isEmail(),
    body("password", "Password must have at least 8 characters.")
        .isLength({
            min: 8,
        })
        .optional(),
    body("firstName").optional().notEmpty(),
    body("lastName").optional().notEmpty(),
    body("gender").custom((v) => isEnum(v, Gender)),
    body("relationshipStatus").custom((v) => isEnum(v, RelationshipStatus)),
    body("bio"),
    body("location"),
    body("occupation"),
    body("education"),
    body("hobbies"),
    returnValidationError,
];
