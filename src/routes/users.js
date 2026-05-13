import express from 'express';
import { createUser, deleteUser, getAllUsers, getUserById, updateUser } from '../controllers/userController.js';
const userRouter = express.Router();

import { authroize, createUserValidator, validateResult, verifyJWT } from '../middlewares/index.js';

// All routes start with /api/users

userRouter.use(verifyJWT)
userRouter.use(authroize('admin'))
// GET /api/users
userRouter.get('/', getAllUsers);

// GET /api/users/:id
userRouter.get('/:id', getUserById);

// POST /api/users
userRouter.post('/', createUserValidator, createUser);

// PUT /api/users/:id
userRouter.put('/:id', updateUser);

// DELETE /api/users/:id
userRouter.delete('/:id', deleteUser);

export default userRouter;