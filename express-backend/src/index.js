import express from "express";
import dotenv from "dotenv";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";

import router from "./router.js";
import { onUserConnected, authMiddleware } from "./socket.js";
import { checkToken } from "./middlewares.js";
import { createStorageDirectories } from "./helpers.js";

dotenv.config();

const port = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const io = new Server(server);


createStorageDirectories();
app.use(cors());
io.use(authMiddleware);
app.use(checkToken);
app.use(express.json());
app.use("/api", router);    

io.on("connection", onUserConnected);

server.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});