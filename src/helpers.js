import fs from "fs/promises";

export async function createStorageDirectories() {
    try {
        await fs.mkdir("storage");
        await fs.mkdir("storage/private");
        await fs.mkdir("storage/public");
    } catch (error) {}
}

/**
 * This function is used to check if a file uploaded among others and handled by multer with fields and max count 1 is present.
 * @param req Request object
 * @param fileName Name of the file to check
 * @returns {object | null} null if the file is not present or invalid, otherwise the file object
 */
export function checkNamedImageOutOfMany(req, fileName) {
    if (
        req.files &&
        req.files[fileName] &&
        req.files[fileName][0].mimetype.startsWith("image")
    )
        return req.files[fileName][0];

    return null;
}

/**
 * This function is used to update the user image based on the type of image.
 * @param {object} user the user object returned from the database
 * @param {object | null} image the image object returned from multer
 * @param {"profileImage" | "backgroundImage"} type the type of image to update
 * @returns {string | null} the path to the image or null if the image is not present.
 */
export function updateUserImage(user, image, type = "profileImage") {
    if (!image) return null;

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
