import cluster from "cluster";
import dotenv from "dotenv";
import os from "os";

import { createStorageDirectories } from "./helpers.js";
import { createServer } from "./worker.js";

createStorageDirectories();
dotenv.config();
const DEBUG = process.env.DEBUG === "1";
const PORT = process.env.PORT || 3000;

if (cluster.isPrimary) {
    for (let i = 0; i < os.cpus().length; i++) cluster.fork();

    cluster.on("exit", (worker, code, signal) => {
        console.log(`Worker process ${worker.process.pid} died. Restarting...`);
        cluster.fork();
    });
} else createServer(DEBUG, PORT);
