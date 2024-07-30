import express from "express";

import userRouter from "./views/user.js";
import postRouter from "./views/post.js";
import notificationRouter from "./views/notification.js";
import messageRouter from "./views/message.js";
import privateRouter from "./views/private.js";
import publicRouter from "./views/public.js";
import friendshipRouter from "./views/friendship.js";

const router = express.Router();

router.use("/user", userRouter);
router.use("/post", postRouter);
router.use("/notification", notificationRouter);
router.use("/message", messageRouter);
router.use("/private", privateRouter);
router.use("/public", publicRouter);
router.use("/friendship", friendshipRouter);

export default router;
