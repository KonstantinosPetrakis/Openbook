/**
 * This function converts a camelCase text to a title case text.
 * @param {string} camelCaseText the camelCase text to convert.
 * @returns {string} the title case text.
 */
export function camelToTitle(camelCaseText) {
    return camelCaseText
        .replace(/([A-Z])/g, (match) => ` ${match}`)
        .replace(/^./, (match) => match.toUpperCase())
        .trim();
}

/**
 * This function checks if a given email is valid.
 * @param {string} email the email to check.
 * @returns {boolean} true if the email is valid, false otherwise.
 */
export function isEmailValid(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
