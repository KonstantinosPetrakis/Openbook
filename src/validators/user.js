import { Gender, RelationshipStatus } from "@prisma/client";
import { body } from "express-validator";

import { escapeUndefined, isEnum, returnValidationError } from "./helpers.js";
import prisma from "../db.js";

/**
 * This is a middleware function that checks if a user exists based
 * on the id provided in the query parameters. If the user exists,
 * the user object is attached to the request object. Otherwise, a 404
 * status is sent back to the client.
 * @param {object} req the request object from express.
 * @param {object} res the response object from express.
 * @param {Function} next the next function to call in the middleware chain.
 */
export async function isValidUser(req, res, next) {
    const user = await prisma.user.findUnique({
        where: { id: req.params.id },
    });

    if (!user) return res.sendStatus(404);

    req.queryUser = user;
    next();
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
