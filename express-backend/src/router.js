import express from "express";
import dotenv from "dotenv";

import userRouter from "./views/user.js";
import postRouter from "./views/post.js";
import notificationRouter from "./views/notification.js";
import messageRouter from "./views/message.js";
import privateRouter from "./views/private.js";
import friendshipRouter from "./views/friendship.js";

dotenv.config();
const DEBUG = process.env.DEBUG === "true";
const router = express.Router();

router.use("/user", userRouter);
router.use("/post", postRouter);
router.use("/notification", notificationRouter);
router.use("/message", messageRouter);
router.use("/friendship", friendshipRouter);
if (!DEBUG) router.use("/private", privateRouter);

export default router;
