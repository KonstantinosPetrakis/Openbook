import express from "express";
import dotenv from "dotenv";

import router from "./router.js";
import { checkToken } from "./middlewares.js";
import { createStorageDirectories } from "./helpers.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

createStorageDirectories();
app.use(checkToken);
app.use(express.json());
app.use("/public", express.static("storage/public"));
app.use("/api", router);

app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
