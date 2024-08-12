import jwt from "jsonwebtoken";
import prisma from "./db.js";


function isPublicPath(path) {
    return ["register", "login", "docs", "public"].some((s) =>
        path.includes(s)
    );
}

function getToken(req) {
    return req.headers.authorization?.replace("Bearer ", "") || null;
}

function isValidPayload(payload) {
    return typeof payload !== "string" && payload.hasOwnProperty("id");
}

export async function checkToken(req, res, next) {
    if (!isPublicPath(req.path)) {
        const token = getToken(req);
        if (!token) return res.sendStatus(401);

        try {
            const payload = jwt.verify(token, process.env.SECRET || "");
            if (!isValidPayload(payload)) return res.sendStatus(401);

            req.user = await prisma.user.update({
                where: { id: payload.id },
                data: { lastActive: new Date() },
            });

            if (!req.user) return res.sendStatus(401);
        } catch (error) {
            return res.sendStatus(401);
        }
    }

    next();
}
