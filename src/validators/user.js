import { Gender, RelationshipStatus } from "@prisma/client";
import { body, validationResult } from "express-validator";

async function returnValidationError(req, res, next) {
    const valResult = validationResult(req);
    if (!valResult.isEmpty())
        return res.status(400).json({ errors: valResult.array() });

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
    body("email").escape(),
    body("firstName").escape(),
    body("lastName").escape(),
    body("gender")
        .optional()
        .if((value) => value !== "")
        .isIn(Object.values(Gender)),
    body("relationshipStatus")
        .optional()
        .if((value) => value !== "")
        .isIn(Object.values(RelationshipStatus)),
    body("bio").escape(),
    body("location").escape(),
    body("occupation").escape(),
    body("education").escape(),
    body("hobbies").escape(),
    returnValidationError,
];
