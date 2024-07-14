import fs from "fs/promises";
import jwt from "jsonwebtoken";
import multer from "multer";
import { createReadStream } from "fs";

import {
    IMAGE_MIME_TYPES,
    VIDEO_MIME_TYPES,
    MAX_FILE_SIZE,
    multerFileFilter,
} from "./validators/helpers.js";

export const multerImageUploader = multer({
    fileFilter: multerFileFilter(IMAGE_MIME_TYPES),
    limits: { fileSize: MAX_FILE_SIZE },
});

export const multerImageVideoUploader = multer({
    fileFilter: multerFileFilter([...IMAGE_MIME_TYPES, ...VIDEO_MIME_TYPES]),
    limits: { fileSize: MAX_FILE_SIZE },
});

/**
 * This function paginates the results of a query.
 * @param {object} req the request object
 * @returns {object} an object that contains the skip and take values for db query.
 */
export function paginate(req) {
    const page = Number(req.query.page || 1);
    const resultsPerPage = Number(process.env.RESULTS_PER_PAGE || 10);

    return {
        skip: (page - 1) * resultsPerPage,
        take: resultsPerPage,
    };
}

/**
 * This function creates the storage directories if they do not exist.
 */
export async function createStorageDirectories() {
    try {
        await fs.mkdir("storage");
        await fs.mkdir("storage/private");
        await fs.mkdir("storage/public");
    } catch (error) {}
}

/**
 * This function is used to get the path in the file system of a public file.
 * @param {string} fileName  the name of the file.
 * @returns {string} the path of the file in the file system.
 */
export function getPublicFileDirectory(fileName) {
    return `storage/public/${fileName}`;
}

/**
 * This function is used to get the path in the file system of a private file.
 * @param {string} fileName the name of the file.
 */
export function getPrivateFileDirectory(fileName) {
    return `storage/private/${fileName}`;
}

/**
 * This function is used to get the public URL of a file.
 * @param {string} fileName the name of the file.
 * @returns {string} the public path of the file.
 */
export function getPublicFileURL(fileName) {
    return `/public/${fileName}`;
}

/**
 * This function is used to get a public URL for a private file,
 * which can be accessed for a limited time.
 * @param {string} fileName the name of the file.
 * @returns {string} the public path of the file.
 */
export function getPrivateFileURL(fileName) {
    const token = jwt.sign({ fileName }, process.env.SECRET_KEY || "", {
        expiresIn: "1m",
    });
    return `/private/${token}`;
}

/**
 * This function is used to check if a file uploaded among others
 * (different file-fields in the same form) and handled by multer.
 * @param req Request object
 * @param fileName Name of the file to check
 * @param {"image" | "video"} fileType Type of the file to check for (default is image)
 * @returns {object | undefined | null} the file object if present,
 * undefined if not present, and null if the user wants to delete the image.
 */
export function checkNamedFileOutOfMany(req, fileName, fileType = "image") {
    if (
        req.files &&
        req.files[fileName] &&
        req.files[fileName][0].mimetype.startsWith(fileType)
    )
        return req.files[fileName][0];
    // If a file is present in the body, it means the user wants to delete the image.
    // Most likely the client will send a null or empty string as the value of the image.
    else if (req.body && req.body[fileName] !== undefined) return null;
    return undefined;
}

/**
 * This function is used to update the file field of a model.
 * @param {object} model the model whose file field is to be updated
 * @param {object} file the file object returned from multer
 * @param {string} attribute the attribute of the model to update
 * @param {Function} fileNameGenerator the function to generate the file name
 * given the model and the file extension.
 * @returns {string | null} the path to the updated file or null if the model has no file.
 */
export function updateModelFile(model, file, attribute, fileNameGenerator) {
    const rmFile = async () => {
        try {
            await fs.unlink(getPublicFileDirectory(model[attribute]));
        } catch (e) {}
    };

    if (file === undefined) return model[attribute];
    if (file === null) {
        if (model[attribute]) rmFile();
        return null;
    }

    if (model[attribute]) rmFile();

    const fileName = fileNameGenerator(model, file.mimetype.split("/")[1]);
    fs.writeFile(getPublicFileDirectory(fileName), file.buffer);
    return fileName;
}

/**
 * This function is used to exclude fields from an object.
 * @param {object} obj the object to exclude fields from.
 * @param {Array<string>} fields the fields to exclude from the object.
 * @returns {object} the new object without the excluded fields.
 */
export function excludeFieldsFromObject(obj, fields) {
    const newObj = { ...obj };
    fields.forEach((field) => delete newObj[field]);
    return newObj;
}

/**
 * This function is used to escape undefined values in an object.
 * @param {object} obj the object to escape undefined values from.
 * @returns {object} the new object without the undefined values.
 */
export function excludeUndefinedFieldsFromObject(obj) {
    const newObj = { ...obj };
    Object.entries(newObj).forEach(([key, value]) => {
        if (value === undefined) delete newObj[key];
    });
    return newObj;
}

/**
 * This function is used to format image fields in an object.
 * @param {object} object the object that contains the image fields.
 * @param {array<string>} fields the image fields to format.
 * @param {boolean} priv whether the image fields are private or not.
 * @returns {object} the object with the formatted image fields.
 */
export function formatFileFields(object, fields, priv = false) {
    const newObj = { ...object };
    const getURL = priv ? getPrivateFileURL : getPublicFileURL;
    for (const field of fields)
        newObj[field] = newObj[field] ? getURL(newObj[field]) : null;
    return newObj;
}

/**
 * This function is used to stream a video file.
 * @param {object} req the request object from express.
 * @param {object} res the response object from express.
 * @param {string} fileName the name of the video file, including the directory.
 */
export async function handleVideoStream(req, res, fileName) {
    let file;
    try {
        file = await fs.stat(fileName);
    } catch (error) {
        console.log(error);
        return res.sendStatus(404);
    }

    const range = req.headers.range;
    if (!range) {
        res.writeHead(200, {
            "Content-Length": file.size,
            "Content-Type": `video/${fileName.split(".")[1]}`,
        });
        return createReadStream(fileName).pipe(res);
    }

    const parts = range.replace(/bytes=/, "").split("-");
    const start = +parts[0];
    const end = parts[1] ? +parts[1] : file.size - 1;
    const chunkSize = end - start + 1;

    res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${file.size}`,
        "Content-Type": `video/${fileName.split(".")[1]}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
    });
    return createReadStream(fileName, { start, end }).pipe(res);
}
