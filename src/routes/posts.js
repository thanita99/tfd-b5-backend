import express from 'express';
import { createPost, deletePost, getAllPosts, getPostById, updatePost } from '../controllers/postController.js';
const postRouter = express.Router();

import { checkOwnership, createPostValidator, getPostValidation, verifyJWT } from '../middlewares/index.js';
import PostModel from '../models/postModel.js';
import passport from 'passport';

postRouter.use(passport.authenticate('jwt', { session: false }))
// postRouter.use(verifyJWT)

postRouter.get('/', getPostValidation, getAllPosts);

postRouter.get('/:id', getPostById);

postRouter.post('/', createPostValidator, createPost);

postRouter.put('/:id', checkOwnership(PostModel), updatePost);

postRouter.delete('/:id', checkOwnership(PostModel), deletePost);

export default postRouter;