import { validationResult } from "express-validator";

export const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/gif"];
export const VIDEO_MIME_TYPES = ["video/mp4", "video/flv", "video/avi"];
export const VIDEO_EXTENSIONS = VIDEO_MIME_TYPES.map((m) => m.split("/")[1]);
export const MAX_FILE_SIZE = 40 * 10 ** 6; // 40 MB

/**
 * This function is a middleware that checks if there are any validation errors in the request.
 * @param {object} req the request object from express
 * @param {object} res the result object from express
 * @param {Function} next the next function from express
 */
export async function returnValidationError(req, res, next) {
    const valResult = validationResult(req);
    if (!valResult.isEmpty())
        return res.status(400).json({ errors: valResult.array() });

    next();
}

/**
 * This function checks if a value is a member of an enum object.
 * @param {string | undefined | null} value the value to check for.
 * @param {object} enumObject the object that contains the enum values as values.
 * @param {boolean} nullable whether null is a valid value.
 * @returns whether the value passes the check.
 */
export function isEnum(value, enumObject, nullable = true) {
    if (value === undefined) return true;
    if (value === null) return nullable;
    return Object.values(enumObject).includes(value);
}

/**
 * This is a sanitizers that allows undefined values to pass through.
 * @description Default escape sanitizers will convert undefined to an empty string which is not what we want.
 * @param {string | undefined} value the value to sanitize.
 * @returns the sanitized value.
 */
export function escapeUndefined(value) {
    if (value === undefined) return undefined;
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * This function returns a multer file filter function.
 * @param {Array<string>} allowedMimeTypes the allowed mime types.
 * @returns the multer file filter function.
 */
export function multerFileFilter(allowedMimeTypes) {
    return (req, file, cb) =>
        cb(null, allowedMimeTypes.includes(file.mimetype));
}
