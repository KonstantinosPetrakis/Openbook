import fs from "fs";
import express from "express";
import SwaggerUi from "swagger-ui-express";
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

app.use(
    "/docs",
    SwaggerUi.serve,
    SwaggerUi.setup(JSON.parse(fs.readFileSync("docs/swagger.json", "utf-8")), {
        swaggerOptions: { persistAuthorization: true },
    })
);
app.use("/api", router);

app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
