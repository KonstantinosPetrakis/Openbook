import { Gender, RelationshipStatus } from "@prisma/client";
import { body } from "express-validator";

import { escapeUndefined, isEnum, returnValidationError } from "./helpers.js";

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
