import express from 'express';
import userRouter from './users.js';
import postRouter from './posts.js';
import fileRouter from './files.js';
import authRouter from './auth.js';
import { apiLimiter, authLimiter } from '../middlewares/index.js';
const router = express.Router();
// import mongoSanitize from 'express-mongo-sanitize';


// Mount routers
router.use('/users', apiLimiter, userRouter);
router.use('/posts', apiLimiter, postRouter);
router.use('/files', apiLimiter, fileRouter);
router.use('/auth', authLimiter, authRouter)

export default router;