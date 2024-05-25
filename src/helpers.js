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
 * This function is used to check if a file uploaded among others 
 * (different file-fields in the same form) and handled by multer
 * with fields and max count 1 is present.
 * @param req Request object
 * @param fileName Name of the file to check
 * @returns {object | undefined | null} the file object if present, 
 * undefined if not present, and null if the user wants to delete the image.
 */
export function checkNamedImageOutOfMany(req, fileName) {
    if (
        req.files &&
        req.files[fileName] &&
        req.files[fileName][0].mimetype.startsWith("image")
    )
        return req.files[fileName][0];
    // If a file is present in the body, it means the user wants to delete the image.
    // Most likely the client will send a null or empty string as the value of the image.
    else if (req.body && req.body[fileName] !== undefined) return null;
    return undefined;
}

/**
 * This function is used to update the user image based on the type of image.
 * @param {object} user the user object returned from the database
 * @param {object | undefined | null} image the image object returned from multer
 * @param {"profileImage" | "backgroundImage"} type the type of image to update
 * @returns {string | null} the path to the image or null if the image is not present.
 */
export function updateUserImage(user, image, type = "profileImage") {
    if (image === undefined) return user[type];
    if (image === null) {
        if (user[type]) fs.unlink(`storage/public/${user[type]}`);
        return null;
    }

    if (user[type]) fs.unlink(`storage/public/${user[type]}`);

    const fileName = `${type}_${user.id}.${image.mimetype.split("/")[1]}`;
    fs.writeFile(`storage/public/${fileName}`, image.buffer);
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
export function formatImageFields(object, fields) {
    const newObj = { ...object };
    fields.forEach((field) => {
        if (newObj[field]) newObj[field] = `/public/${newObj[field]}`;
    });
    return newObj;
}
