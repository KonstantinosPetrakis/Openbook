import { Socket } from "socket.io";
import jwt from "jsonwebtoken";

import { emitter } from "./worker.js";
import prisma from "./db.js";

/**
 * This is a middleware function that checks if the user is authenticated.
 * @param {Socket} socket the socket object,
 * @param {function} next the next function to call.
 */
export async function authMiddleware(socket, next) {
    const token = socket.handshake.auth.token;
    try {
        const payload = jwt.verify(token, process.env.SECRET || "");
        if (!payload.id) return next(new Error("Unauthorized"));

        socket.user = await prisma.user.update({
            where: { id: payload.id },
            data: { socketId: socket.id },
        });
        if (!socket.user) return next(new Error("Unauthorized"));
    } catch (error) {
        return next(new Error("Unauthorized"));
    }

    next();
}

/**
 * This function is called when a user connects to the socket.
 * Currently it only listens for the disconnect event and removes the user from the map.
 * @param {Socket} socket the socket object.
 */
export async function onUserConnected(socket) {
    socket.on("disconnect", async () => {
        await prisma.user.update({
            where: { id: socket.user.id },
            data: { socketId: null },
        });
    });
}

/**
 * This function sends a message to the user.
 * @param {object} messageData the message data.
 */
export async function updateUserForNewMessage(messageData) {
    const socketId = (
        await prisma.user.findUnique({
            where: { id: messageData.recipientId },
        })
    ).socketId;

    emitter.to(socketId).emit("NEW_MESSAGE", messageData);
}

/**
 * This function updates the user that a new message has been received so
 * they can pull the new notifications.
 * @param {string} userId the user id.
 */
export async function updateUserForNewNotification(userId) {
    const socketId = (await prisma.user.findUnique({ where: { id: userId } }))
        .socketId;

    emitter.to(socketId).emit("NEW_NOTIFICATION");
}
