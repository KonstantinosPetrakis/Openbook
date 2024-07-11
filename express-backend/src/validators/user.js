import { Gender, RelationshipStatus } from "@prisma/client";
import { body } from "express-validator";

import { multerImageUploader as upload } from "../helpers.js";
import {
    escapeUndefined,
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
    body("email", "Email must be a valid email.").escape().isEmail(),
    body("password", "Password must have at least 8 characters.").isLength({
        min: 8,
    }),
    body("firstName", "First name must be specified").escape().notEmpty(),
    body("lastName", "Last name must be specified").escape().notEmpty(),
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
    body("email")
        .customSanitizer((v) => escapeUndefined(v))
        .optional()
        .isEmail(),
    body("firstName")
        .customSanitizer((v) => escapeUndefined(v))
        .optional()
        .notEmpty(),
    body("lastName")
        .customSanitizer((v) => escapeUndefined(v))
        .optional()
        .notEmpty(),
    body("gender").custom((v) => isEnum(v, Gender)),
    body("relationshipStatus").custom((v) => isEnum(v, RelationshipStatus)),
    body("bio").customSanitizer((v) => escapeUndefined(v)),
    body("location").customSanitizer((v) => escapeUndefined(v)),
    body("occupation").customSanitizer((v) => escapeUndefined(v)),
    body("education").customSanitizer((v) => escapeUndefined(v)),
    body("hobbies").customSanitizer((v) => escapeUndefined(v)),
    returnValidationError,
];
