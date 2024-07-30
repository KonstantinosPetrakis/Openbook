export const URL = "http://localhost:3000/api/";
export const USER_PASSWORD = "password";
export const USERS_TO_CREATE = 10;
const VERBOSE = false;

/**
 * This function sleeps for a given amount of milliseconds.
 * @param {number} ms the number of milliseconds to sleep.
 * @returns {Promise<void>} a promise that resolves after the given amount of milliseconds.
 */
export async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * This function fetches a URL with the given options.
 * Essentially a wrapper around fetch that provides authentication via a token.
 * @param {string} url the URL to fetch.
 * @param {string} token the token to authenticate with.
 * @param {object} options other options to pass to fetch.
 * @returns {Promise<Response>} a promise that resolves with the response from the fetch.
 */
export async function authFetch(url, token, options) {
    return await fetch(url, {
        ...options,
        headers: {
            ...(options?.headers || {}),
            Authorization: `Bearer ${token}`,
        },
    });
}

/**
 * This function fetches a public file from the server.
 * @param {string} relativeURL the relative URL of the file (e.g /private/token)
 * @param {string} token the access token for the user.
 * @returns {Promise<Response>} a promise that resolves with the response from the fetch.
 */
export async function getPrivateFile(relativeURL, token) {
    return await authFetch(`${URL}${relativeURL}`, token);
}

/**
 * This function checks if 2 objects are equal.
 * If they are not equal, the function will print an error message and exit the process.
 * @param {object} actual the actual object.
 * @param {object} expected the expected object.
 */
export function assertEqual(actual, expected) {
    if (JSON.stringify(actual) === JSON.stringify(expected)) {
        if (VERBOSE) console.log(`✅ ${actual} = ${expected}`);
    } else {
        console.error(`❌ ${JSON.stringify(actual, null, 4)} != ${JSON.stringify(expected, null, 4)}`);
        process.exit(1);
    }
}

/**
 * This function checks if a value passes a callback.
 * @param {value} actual the value to check.
 * @param {function} callback the callback to check the value with.
 */
export function assertCallable(actual, callback) {
    if (callback(actual)) {
        if (VERBOSE) console.log(`✅ ${actual} passed callback`);
    } else {
        console.error(`❌ ${actual} failed callback`);
        process.exit(1);
    }
}

/**
 * This function returns a random file blob.
 * @param {number} size the size of the file in megabytes.
 * @param {string} mimeType the mime type of the file (default is image/png).
 * @returns {Promise<Blob>} a promise that resolves with a random image blob.
 */
export async function randomFileBlob(size, mimeType = "image/png") {
    return new Blob([new ArrayBuffer(size * 10 ** 6)], { type: mimeType });
}

/**
 * This function creates a random email.
 * @return {string} the random email.
 */
export function createRandomEmail() {
    return `${crypto.randomUUID()}@example.com`;
}
