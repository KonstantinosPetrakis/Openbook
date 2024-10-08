import { io } from "socket.io-client";

const SERVER =
    import.meta.env.VITE_SOCKET_ENDPOINT === "/"
        ? `${window.location.host}/`
        : import.meta.env.VITE_SOCKET_ENDPOINT;
        
const API = import.meta.env.VITE_API_ENDPOINT;
const BACKEND_TYPE = import.meta.env.VITE_BACKEND_TYPE;

const SOCKET_PYTHON_CALLBACKS = {};

/**
 * A wrapper around fetch to make a POST request.
 * @param {string} url the url to send the request to.
 * @param {object} data the data to send in the request.
 * @returns {Promise<Response>} the response of the request.
 */
function post(url, data) {
    return fetch(`${API}${url}`, {
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
export function authFetch(url, method = "GET", data = {}, headers = {}) {
    const body =
        method === "GET"
            ? undefined
            : data instanceof FormData
            ? data
            : JSON.stringify(data);

    const user = localStorage.getItem("user");
    const token = user ? JSON.parse(user).token : null;

    if (!token) return null;

    return fetch(`${API}${url}`, {
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

/**
 * This function formats the source of a server file to allow the frontend server to
 * be different from the backend server.
 * @param {string | null | undefined} fileSrc the source of the file as returned from the server.
 * @returns {string | null} the source of the file formatted correctly, null if the fileSrc is null or undefined.
 */
function formatServerSrc(fileSrc) {
    if (!fileSrc) return null;
    if (fileSrc.startsWith("/")) fileSrc = fileSrc.substring(1);
    return `http://${SERVER}${fileSrc}`; // Server includes the slash at the end.
}

/**
 * This function formats the files of a user to apply defaults and format the source.
 * @param {object} user the unformatted user object.
 * @returns {object} the formatted user object.
 */
function formatUser(user) {
    user.profileImage = user.profileImage
        ? formatServerSrc(user.profileImage)
        : "/images/default-profile.png";
    user.backgroundImage = user.backgroundImage
        ? formatServerSrc(user.backgroundImage)
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
    return response?.status == 201 ? (await response.json()).id : null;
}

/**
 * This function logs in the user.
 * @param {string} email the email of the user
 * @param {string} password the password of the user
 * @returns {Promise<{id: string, token: string} | null>} basic user data or null if the login failed.
 */
export async function loginUser(email, password) {
    const response = await post("user/login", { email, password });
    return response?.status == 200 ? await response.json() : null;
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
    if (response?.status !== 200) return null;
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
    if (response?.status !== 200) return [];
    return (await response.json()).items.map(formatUser);
}

/**
 * This function sends or accepts a friend request with the given user.
 * @param {string} userId the id of the user to send/accept the friend request.
 * @returns {Promise<boolean>} true if the request was sent, false otherwise.
 */
export async function addFriend(userId) {
    const response = await authFetch(`friendship/add/${userId}`, "POST");
    return [200, 201].includes(response?.status);
}

/**
 * This function deletes a friend, or denies or cancels a friend request.
 * @param {string} userId the id of the user to delete the friendship record.
 * @returns {Promise<boolean>} true if the friend record was deleted, false otherwise.
 */
export async function deleteFriend(userId) {
    const response = await authFetch(`friendship/remove/${userId}`, "DELETE");
    return response?.status === 200;
}

/**
 * This functions gets the notifications of the user.
 * @param {number} page the page to get, default is 1.
 * @returns {Promise<Array<object>>} the notifications of the user.
 */
export async function getNotifications(page = 1) {
    const response = await authFetch(`notification/?page=${page}`);
    if (response?.status !== 200) return [];

    return (await response.json()).items.map((n) => {
        n.data = formatUser(n.data);
        return n;
    });
}

/**
 * This function marks a notification as read.
 * @param {string} notificationId the id of the notification to mark as read.
 * @returns {Promise<boolean>} true if the notification was marked as read, false otherwise.
 */
export async function readNotification(notificationId) {
    const response = await authPatch(`notification/read/${notificationId}`);
    return response?.status === 200;
}

/**
 * This function gets the count of unread notifications.
 * @returns {Promise<number>} the count of unread notifications.
 */
export async function getUnreadNotificationCount() {
    const response = await authFetch("notification/count");
    return response?.status === 200 ? await response.json() : 0;
}

/**
 * This function gets the friends of the user.
 * @returns {Promise<Array<object>>} the friends of the user.
 */
export async function getFriends() {
    const response = await authFetch("friendship");
    return response?.status === 200 ? await response.json() : [];
}

/**
 * This function creates a socket connection to the server.
 * @returns {Socket | null} the socket connection or null if the user is not logged in.
 */
export async function createSocket() {
    const tokenStore = localStorage.getItem("user");
    if (!tokenStore) return null;

    if (BACKEND_TYPE === "python") {
        const socket = new WebSocket("ws://" + SERVER + "ws");

        return new Promise(
            (resolve) =>
                (socket.onopen = () => {
                    socket.send(
                        JSON.stringify({
                            token: JSON.parse(tokenStore).token,
                        })
                    );

                    socket.on = (event, func) => {
                        const realHandler = (e) => {
                            const data = JSON.parse(e.data);
                            if (data.event === event) func(data.data);
                        };

                        SOCKET_PYTHON_CALLBACKS[func] = realHandler;
                        socket.addEventListener("message", realHandler);
                    };

                    socket.off = (event, func) => {
                        socket.removeEventListener(
                            "message",
                            SOCKET_PYTHON_CALLBACKS[func]
                        );
                    };

                    resolve(socket);
                })
        );
    }

    const token = JSON.parse(tokenStore).token;
    return token
        ? io(SERVER, { auth: { token }, transports: ["websocket"] })
        : null;
}

/**
 * This function creates a post with the given content and files.
 * @param {string} content the content of the post.
 * @param {Array<File>} files the files to attach to the post.
 * @returns {Promise<string | null>} the id of the post, null if the post could not be created.
 */
export async function createPost(content, files) {
    const form = new FormData();
    form.append("content", content);
    files.forEach((f) => form.append("files", f));
    const r = await authFetch("post", "POST", form);
    return r.status === 201 ? (await r.json()).id : null;
}

/**
 * This function gets a post by id.
 * @param {string} id the id of the post.
 * @returns {Promise<object | null>} the post object, null if the post could not be found.
 */
export async function getPost(id) {
    const response = await authFetch(`post/${id}`);
    if (response?.status !== 200) return null;
    const data = await response.json();
    data.author = formatUser(data.author);
    data.files = data.files.map(formatServerSrc);
    return data;
}

/**
 * This function gets the comments of a post.
 * @param {string} postId the id of the post to get the comments of.
 * @param {number} page the page to get, default is 1.
 * @returns {Promise<Array<object>>} the comments of the post.
 */
export async function getPostComments(postId, page = 1) {
    const response = await authFetch(`post/${postId}/comments?page=${page}`);
    if (response?.status !== 200) return [];
    return (await response.json()).items.map((c) => {
        c.author = formatUser(c.author);
        c.file = formatServerSrc(c.file);
        return c;
    });
}

/**
 * This function likes a post.
 * @param {string} id the id of the post to like.
 * @returns {Promise<boolean | null>} true if the post was liked, false if the post was unliked, null if the post could not be liked.
 */
export async function likePost(id) {
    const response = await authFetch(`post/like/${id}`, "POST");
    return [200, 201].includes(response?.status) || null;
}

/**
 * This function comments on a post.
 * @param {string} postId the id of the post to comment on.
 * @param {string} content the content of the comment to post.
 * @param {File} file the file to attach to the comment.
 * @returns {Promise<string | null>} the id of the comment, null if the comment could not be posted.
 */
export async function commentPost(postId, content = "", file = null) {
    if (!content && !file) return null;

    const form = new FormData();
    form.append("content", content);
    if (file) form.append("file", file);
    const response = await authFetch(`post/comment/${postId}`, "POST", form);
    return response?.status === 201 ? (await response.json()).id : null;
}

/**
 * This function deletes a post.
 * @param {string} postId the id of the post to delete.
 * @returns {Promise<boolean>} true if the post was deleted, false otherwise.
 */
export async function deletePost(postId) {
    const response = await authFetch(`post/${postId}`, "DELETE");
    return response?.status === 200;
}

/**
 * This function deletes a comment.
 * @param {string} commentId the id of the comment to delete.
 * @returns {Promise<boolean>} true if the comment was deleted, false otherwise.
 */
export async function deleteComment(commentId) {
    const response = await authFetch(`post/comment/${commentId}`, "DELETE");
    return response?.status === 200;
}

/**
 * This function gets the feed of the user.
 * @param {number} page the page to get, default is 1.
 * @returns {Promise<Array<object>>} the feed of the user.
 */
export async function getFeed(page = 1) {
    const response = await authFetch(`post/feed?page=${page}`);
    if (response?.status !== 200) return [];
    return (await response.json()).items.map((p) => {
        p.author = formatUser(p.author);
        p.files = p.files.map(formatServerSrc);
        return p;
    });
}

/**
 * This function gets the posts of a specific user.
 * @param {string} userId the id of the user to get the posts of.
 * @param {number} page the page to get, default is 1.
 */
export async function getPostsOfUser(userId, page = 1) {
    const response = await authFetch(`post/ofUser/${userId}?page=${page}`);
    if (response?.status !== 200) return [];
    return (await response.json()).items.map((p) => {
        p.author = formatUser(p.author);
        p.files = p.files.map(formatServerSrc);
        return p;
    });
}

/**
 * This function gets the last chats the session user had.
 * @param {number} page the page to get, default is 1.
 * @returns {Promise<Array<object>>} the chats of the user.
 */
export async function getChats(page = 1) {
    const response = await authFetch(`message/chats?page=${page}`);
    if (response?.status !== 200) return [];
    return (await response.json()).map((c) => formatUser(c));
}

/**
 * This function fetches a private file from the server.
 * @param {string} fileUrl the url of the file to fetch.
 * @returns {Promise<string | null>} the url of the file in localhost.
 */
export async function getPrivateFile(fileUrl) {
    if (!fileUrl) return null;

    if (fileUrl.startsWith("/")) fileUrl = fileUrl.substring(1);

    const response = await authFetch(fileUrl);
    return URL.createObjectURL(await response.blob());
}

/**
 * This function sends a message to a user.
 * @param {string} recipientId the id of the user to send the message to.
 * @param {string} content the content of the message. Default is an empty string.
 * @param {File | null} file a file to attach to the message. Default is null.
 * @returns {Promise<boolean>} true if the message was sent, false otherwise.
 */
export async function sendMessage(recipientId, content = "", file = null) {
    const form = new FormData();
    form.append("recipientId", recipientId);
    if (content) form.append("content", content);
    if (file) form.append("file", file);
    const response = await authFetch("message", "POST", form);
    return response?.status === 201;
}

/**
 * This function gets the messages of a chat.
 * @param {string} friendId the id of the friend that the user has a chat with.
 * @param {number} page the page to get, default is 1.
 * @returns
 */
export async function getMessages(friendId, page = 1) {
    const response = await authFetch(`message/${friendId}?page=${page}`);
    if (response?.status !== 200) return [];
    const data = (await response.json()).items;
    return await Promise.all(
        data.map(async (m) => {
            m.file = await getPrivateFile(m.file);
            return m;
        })
    );
}

/**
 * This function gets the count of unread messages.
 * @returns {Promise<number>} the count of unread messages.
 */
export async function getUnreadMessageCount() {
    const response = await authFetch("message/unread");
    return response?.status === 200 ? await response.json() : 0;
}
