import express from "express";

import userRouter from "./views/user.js";
import postRouter from "./views/post.js";
import notificationRouter from "./views/notification.js";

const router = express.Router();


router.use("/user", userRouter);
router.use('/post', postRouter);
router.use('/notification', notificationRouter);


export default router;