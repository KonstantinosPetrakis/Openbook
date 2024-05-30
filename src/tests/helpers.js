export const URL = "http:/localhost:3000/api/";
export const USER_PASSWORD = "password";
export const USERS_TO_CREATE = 10;
const VERBOSE = false;


export async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function authFetch(url, token, options) {
    return await fetch(url, {
        ...options,
        headers: {
            ...(options?.headers || {}),
            Authorization: `Bearer ${token}`,
        },
    });
}

export function assertEqual(actual, expected) {
    if (JSON.stringify(actual) === JSON.stringify(expected)) {
        if (VERBOSE) console.log(`✅ ${actual} = ${expected}`);
    } else {
        console.error(`❌ ${actual} != ${expected}`);
        process.exit(1);
    }
}


export function assertCallable(actual, callback) {
    if (callback(actual)) {
        if (VERBOSE) console.log(`✅ ${actual} passed callback`);
    } else {
        console.error(`❌ ${actual} failed callback`);
        process.exit(1);
    }
}


export function createRandomEmail() {
    return `${crypto.randomUUID()}@example.com`;
}