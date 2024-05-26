import fs from "fs/promises";

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
 * This function is used to get the public URL of a file.
 * @param {string} fileName the name of the file.
 * @returns {string} the public path of the file.
 */
export function getPublicFileURL(fileName) {
    return `/public/${fileName}`;
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
 * This function is used to check if files are uploaded among others
 * (different file-fields in the same form) and handled by multer.
 * @param {object} req Request object from express
 * @param {string} fileName Name of the file array to check
 * @param {Array<string>} fileType Types of the file to check for, default is images and videos.
 * @returns {Array<object>} the file objects that are present.
 */
export function checkNamedFilesOutOfMany(
    req,
    fileName,
    fileType = ["image", "video"]
) {
    const files = [];

    if (req.files && req.files[fileName])
        req.files[fileName].forEach((file) => {
            if (fileType.some((type) => file.mimetype.startsWith(type)))
                files.push(file);
        });
    return files;
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
    const rmFile = () => fs.unlink(getPublicFile(model[attribute]));
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
 * @returns {object} the object with the formatted image fields.
 */
export function formatFileFields(object, fields) {
    const newObj = { ...object };
    fields.forEach((field) => {
        if (newObj[field]) newObj[field] = getPublicFileURL(newObj[field]);
    });
    return newObj;
}
