import { body } from "express-validator";
import {
    multerImageVideoUploader as upload,
    multerErrorHandler,
} from "../helpers.js";

export const messageValidator = [
    upload.single("file"),
    multerErrorHandler,
    body("content").escape().trim(),
    body("recipientId").isString(),
];
