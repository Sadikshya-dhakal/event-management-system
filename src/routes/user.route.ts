import { Router } from 'express';
import { updateUserController } from '../controllers/user.controller.js';

export const userRouter = Router();

userRouter.put('/:id', updateUserController);
