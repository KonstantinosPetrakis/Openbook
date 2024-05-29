import {
    assertCallable,
    assertEqual,
    authFetch,
    createRandomEmail,
    URL,
    USER_PASSWORD,
    USERS_TO_CREATE,
} from "./helpers.js";

async function createUser(email, password, firstName, lastName) {
    const response = await fetch(`${URL}/user/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, firstName, lastName }),
    });

    return (await response.json()).id;
}

async function loginUser(email, password) {
    const response = await fetch(`${URL}/user/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });

    return (await response.json()).token;
}

async function updateUser(token, fields) {
    const response = await authFetch(`${URL}/user`, token, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
    });

    return response.ok;
}

async function getUser(token, id) {
    const response = await authFetch(`${URL}/user/${id}`, token);
    return await response.json();
}

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
}
