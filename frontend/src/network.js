const API = "http://localhost:3000/api";

/**
 * A wrapper around fetch to make a POST request.
 * @param {string} url the url to send the request to.
 * @param {object} data the data to send in the request.
 * @returns {Promise<Response>} the response of the request.
 */
function post(url, data) {
    return fetch(`${API}/${url}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
}

/**
 * This function requests the server by using the stored token.
 * @param {string} url the url to send the request to.
 * @param {string} method the http method to use.
 * @param {object} data the data to send in the request.
 * @param {object} headers the headers to send in the request.
 * @returns {Promise<Response> | null} the response of the request or null if the token is not stored.
 */
function authFetch(url, method = "GET", data = {}, headers = {}) {
    const body = method == "GET" ? {} : { body: JSON.stringify(data) };
    const user = localStorage.getItem("user");
    const token = user ? JSON.parse(user).token : null;
    
    if (!token) return null;

    return fetch(`${API}/${url}`, {
        method,
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            ...headers,
            ...body
        },
    });
}

/**
 * A wrapper around authFetch to make a POST request.
 * @param {url} url the url to send the request to.
 * @param {url} data the data to send in the request.
 * @returns {Promise<Response> | null} the response of the request or null if the token is not stored.
 */
function authPatch(url, data) {
    return authFetch(url, "PATCH", data);
}

/**
 * This function registers the user.
 * @param {string} email the email of the user
 * @param {string} firstName the first name of the user
 * @param {string} lastName the last name of the user
 * @param {string} password the password of the user
 * @returns {Promise<string | null>} the id of the user, null if the user could not be registered.
 */
export async function registerUser(email, firstName, lastName, password) {
    const response = await post("user/register", {
        email,
        firstName,
        lastName,
        password,
    });
    return response.status == 201 ? (await response.json()).id : null;
}

/**
 * This function logs in the user.
 * @param {string} email the email of the user
 * @param {string} password the password of the user
 * @returns {Promise<{id: string, token: string} | null>} basic user data or null if the login failed.
 */
export async function loginUser(email, password) {
    const response = await post("user/login", { email, password });
    return response.status == 200 ? await response.json() : null;
}

/**
 * This function updates the user with the give
 * @param {object} user the user object to update.
 * @returns {Promise<boolean>} true if the user was updated, false otherwise.
 */
export async function updateUser(user) {
    const response = await authPatch("/user", user);
    return response.status == 200;
}

/**
 * This function gets the user with the given id.
 * @param {string} id the id of the user to get.
 * @returns {Promise<object | null>} the user object, null if the user could not be found.
 */
export async function getUser(id) {
    const response = await authFetch(`user/${id}`);
    return response.status == 200 ? await response.json() : null;
}


