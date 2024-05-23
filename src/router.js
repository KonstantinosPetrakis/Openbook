import express from "express";

import userRouter from "./views/user.js";
import postRouter from "./views/post.js";


const router = express.Router();


router.use("/user", userRouter);
router.use('/post', postRouter);


export default router;