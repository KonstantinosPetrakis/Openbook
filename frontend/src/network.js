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
 * @param {object} data the data to send in the request, if isn't a FormData object it will be stringified as JSON.
 * @param {object} headers the headers to send in the request.
 * @returns {Promise<Response> | null} the response of the request or null if the token is not stored.
 */
function authFetch(url, method = "GET", data = {}, headers = {}) {
    const body =
        method === "GET"
            ? undefined
            : data instanceof FormData
            ? data
            : JSON.stringify(data);

    const user = localStorage.getItem("user");
    const token = user ? JSON.parse(user).token : null;

    if (!token) return null;

    return fetch(`${API}/${url}`, {
        method,
        headers: {
            Authorization: `Bearer ${token}`,
            ...headers,
        },
        body,
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

function formatUser(user) {
    user.profileImage = user.profileImage
        ? `${API}/${user.profileImage}`
        : "/images/default-profile.png";
    user.backgroundImage = user.backgroundImage
        ? `${API}/${user.backgroundImage}`
        : "/images/default-background.png";
    return user;
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
 * @param {object} data the data to update the user with.
 * @returns {Promise<boolean | object>} true if the user was updated, an object with the error messages otherwise.
 */
export async function updateUser(data) {
    const form = new FormData();
    for (let key in data)
        form.append(
            key,
            ["profileImage", "backgroundImage"].includes(key)
                ? await (await fetch(data[key])).blob() // base64 to blob
                : data[key]
        );

    return (await authPatch("user", form)).status === 200;
}

/**
 * This function gets the user with the given id.
 * @param {string} id the id of the user to get.
 * @returns {Promise<object | null>} the user object, null if the user could not be found.
 */
export async function getUser(id) {
    const response = await authFetch(`user/${id}`);
    if (response.status !== 200) return null;
    return formatUser(await response.json());
}

/**
 * This function searches for users with the given query.
 * @param {string} query the query to search for, could be first name, last name or email.
 * @param {number} page the page to get, default is 1.
 * @returns {promise<Array<object>>} the users that match the query.
 */
export async function searchUser(query, page = 1) {
    if (!query) return [];
    const response = await authFetch(`user/search/${query}?page=${page}`);
    if (response.status !== 200) return [];
    return (await response.json()).map(formatUser);
}

/**
 * This function sends or accepts a friend request with the given user.
 * @param {string} userId the id of the user to send/accept the friend request.
 * @returns {Promise<boolean>} true if the request was sent, false otherwise.
 */
export async function addFriend(userId) {
    const response = await authFetch(`user/addFriend/${userId}`, "POST");
    return [200, 201].includes(response.status);
}

/**
 * This function deletes a friend, or denies or cancels a friend request.
 * @param {string} userId the id of the user to delete the friendship record.
 * @returns {Promise<boolean>} true if the friend record was deleted, false otherwise.
 */
export async function deleteFriend(userId) {
    const response = await authFetch(`user/deleteFriend/${userId}`, "DELETE");
    return response.status === 200;
}

/**
 * This functions gets the notifications of the user.
 * @param {number} page the page to get, default is 1.
 * @returns {Promise<Array<object>>} the notifications of the user.
 */
export async function getNotifications(page = 1) {
    const response = await authFetch(`notification/?page=${page}`);
    return response.status === 200 ? await response.json() : [];
}

/**
 * This function marks a notification as read.
 * @param {string} notificationId the id of the notification to mark as read.
 * @returns {Promise<boolean>} true if the notification was marked as read, false otherwise.
 */
export async function readNotification(notificationId) {
    const response = await authPatch(`notification/read/${notificationId}`);
    return response.status === 200;
}
