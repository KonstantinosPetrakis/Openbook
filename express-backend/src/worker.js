import http from "http";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import pg from "pg";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/postgres-adapter";
import { Emitter } from "@socket.io/postgres-emitter";

import router from "./router.js";
import { onUserConnected, authMiddleware } from "./socket.js";
import { checkToken } from "./middlewares.js";

dotenv.config();

const pool = new pg.Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT,
});

pool.query(`
    CREATE TABLE IF NOT EXISTS socket_io_attachments (
        id          bigserial UNIQUE,
        created_at  timestamptz DEFAULT NOW(),
        payload     bytea
    );
`);

pool.on("error", (err) => {
    console.error("Postgres error", err);
});

export const emitter = new Emitter(pool);

export function createServer(debug, port = 3000) {
    const app = express();
    const server = http.createServer(app);
    const io = new Server(server, { cors: { origin: "*" } });
    io.adapter(createAdapter(pool));

    app.use(cors());
    io.use(authMiddleware);
    app.use(checkToken);
    app.use(express.json());
    if (debug) {
        app.use("/public", express.static("public"));
        app.use("/private", express.static("private"));
    }
    app.use("/api", router);

    io.on("connection", onUserConnected);

    server.listen(port, () =>
        console.log(
            `[server]: Server is running at http://localhost:${port} from process ${process.pid}`
        )
    );
}
