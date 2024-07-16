import cuid from "cuid";

import {
    assertCallable,
    assertEqual,
    authFetch,
    createRandomEmail,
    URL,
    USER_PASSWORD,
    USERS_TO_CREATE,
} from "./helpers.js";

/**
 * This function creates a user with the given email, password, first name and last name.
 * @param {string} email the email of the user.
 * @param {string} password the password of the user.
 * @param {string} firstName the first name of the user.
 * @param {string} lastName the last name of the user.
 * @returns {Promise<string | undefined>} the id of the user or undefined if the request failed.
 */
async function createUser(email, password, firstName, lastName) {
    const response = await fetch(`${URL}/user/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, firstName, lastName }),
    });

    return response.ok ? (await response.json()).id : undefined;
}

/**
 * This function logs in a user with the given email and password.
 * @param {string} email the email of the user.
 * @param {string} password the password of the user.
 * @return {Promise<string | undefined>} the token of the user or undefined if the request failed.
 */
async function loginUser(email, password) {
    const response = await fetch(`${URL}/user/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });

    return response.ok ? (await response.json()).token : undefined;
}

/**
 * This function updates a user with the given token and fields.
 * @param {string} token the token of the user.
 * @param {object} fields a map of fields to update.
 * @returns {Promise<boolean>} whether the request was successful.
 */
async function updateUser(token, fields) {
    const response = await authFetch(`${URL}/user`, token, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
    });

    return response.ok;
}

/**
 * This function gets a user (its profile expect posts)
 * with the given token and id.
 * @param {string} token the token of the user.
 * @param {string} id the id of the user.
 * @returns {Promise<object | undefined>} the user or undefined if the request failed.
 */
export async function getUser(token, id) {
    const response = await authFetch(`${URL}/user/${id}`, token);
    return response.ok ? await response.json() : undefined;
}

/**
 * This function creates users and returns their ids and tokens
 * based on constants set on `tests/users.js`.
 * @returns { Promise<{userIds: Array<string>, tokens: Array<string>> } }
 * the ids and tokens of the users.
 */
export async function createUsers() {
    const userIds = [];
    const tokens = [];
    for (let i = 0; i < USERS_TO_CREATE; i++) {
        const email = createRandomEmail();
        userIds.push(await createUser(email, USER_PASSWORD, "first", "last"));
        tokens.push(await loginUser(email, USER_PASSWORD));
    }

    return { userIds, tokens };
}

/**
 * This function searches for users based on the given token and query.
 * @param {string} token the auth token of the user.
 * @param {string} query the search query.
 * @returns {Promise<Array<object> | undefined>}
 * a promise that resolves to an array of users or undefined if the request failed.
 */
export async function searchUser(token, query) {
    const response = await authFetch(`${URL}/user/search/${query}`, token);
    return response.ok ? await response.json() : undefined;
}

/**
 * This function tests the user endpoints.
 */
export async function main() {
    const { userIds, tokens } = await createUsers();

    // Invalid email
    assertEqual(
        await createUser("test", "12345678", "Kostas", "Petrakis"),
        undefined
    );

    // Invalid password
    assertEqual(
        await createUser("test@example.com", "123", "Kostas", "Petrakis"),
        undefined
    );

    // Creation
    assertCallable(
        await createUser(createRandomEmail(), "12345678", "Kostas", "Petrakis"),
        (id) => typeof id === "string"
    );

    // Unauthorized update
    assertEqual(await updateUser("123", { firstName: "John" }), false);

    // Update and filtration
    assertEqual(
        await updateUser(tokens[0], {
            firstName: "John",
            lastName: "Doe",
        }),
        true
    );

    assertCallable(
        await getUser(tokens[0], userIds[0]),
        (u) => u.firstName == "John" && u.lastName == "Doe"
    );

    const randomPrefix = cuid();
    const appendPrefix = (s) => `${randomPrefix}${s}`;
    const names = ["John Doe", "Jane Doe", "Alice Box", "Bob Box"];
    for (const name of names)
        await createUser(
            appendPrefix(`${name.split(" ")[0]}@example.com`),
            "12345678",
            appendPrefix(name.split(" ")[0]),
            appendPrefix(name.split(" ")[1])
        );

    assertCallable(
        await searchUser(tokens[0], appendPrefix("doe")),
        (users) => users.length === 2
    );
    assertCallable(
        await searchUser(tokens[0], appendPrefix("box")),
        (users) => users.length === 2
    );
    assertCallable(
        await searchUser(tokens[0], appendPrefix("alice")),
        (users) => users.length === 1
    );
}
