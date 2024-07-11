import { Socket } from "socket.io";
import jwt from "jsonwebtoken";

import prisma from "./db.js";

const socketUserMap = {};

/**
 * This is a middleware function that checks if the user is authenticated.
 * @param {Socket} socket the socket object,
 * @param {function} next the next function to call.
 */
export async function authMiddleware(socket, next) {
    const token = socket.handshake.auth.token;
    try {
        const payload = jwt.verify(token, process.env.SECRET_KEY || "");
        if (!payload.id) return next(new Error("Unauthorized"));

        socket.user = await prisma.user.findUnique({
            where: { id: payload.id },
        });

        if (!socket.user) return next(new Error("Unauthorized"));
    } catch (error) {
        return next(new Error("Unauthorized"));
    }

    socketUserMap[socket.user.id] = socket;
    next();
}

/**
 * This function is called when a user connects to the socket.
 * Currently it only listens for the disconnect event and removes the user from the map.
 * @param {Socket} socket the socket object.
 */
export async function onUserConnected(socket) {
    socket.on("disconnect", () => delete socketUserMap[socket.user.id]);
}

/**
 * This function updates the user that a new message has been received so
 * they can pull the new messages.
 * @param {string} userId the user id.
 */
export function updateUserForNewMessage(userId) {
    const socket = socketUserMap[userId];
    if (socket) {
        socket.emit("NEW_MESSAGE");
    }
}

/**
 * This function updates the user that a new message has been received so
 * they can pull the new notifications.
 * @param {string} userId the user id.
 */
export function updateUserForNewNotification(userId) {
    const socket = socketUserMap[userId];
    if (socket) {
        socket.emit("NEW_NOTIFICATION");
    }
}
