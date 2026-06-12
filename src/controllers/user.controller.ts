import type { Request, Response } from 'express';
import { User } from '../models/user.model.js';

export async function updateUserController(req: Request, res: Response) {
  const { email, password } = req.body;
  const { id } = req.params;

  const updatedUser = await User.findByIdAndUpdate(id, { email, password });

  return res.json({
    message: 'User updated successfully',
    data: {
      user: updatedUser,
    },
  });
}

export async function getUsers(_req: Request, _res: Response) {
  return await User.find();
}
