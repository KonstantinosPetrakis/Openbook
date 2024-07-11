import { body } from "express-validator";
import { multerErrorHandler } from "./helpers.js";
import { multerImageVideoUploader as upload} from "../helpers.js";


export const messageValidator = [
    upload.single("file"),
    multerErrorHandler,
    body("content").escape().trim(),
    body("recipientId").isString(),
];
