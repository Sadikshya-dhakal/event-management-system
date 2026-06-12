import type { Request, Response } from 'express';
import { User } from '../models/user.model.js';
import { hashPassword } from '../utils/bcrypt.js';

export async function registerController(req: Request, res: Response) {
  const { email, password } = req.body;

  const hashedPassword = await hashPassword(password);

  const createdUser = await User.create({ email, password: hashedPassword });

  return res.json({
    message: 'User created successfully',
    data: {
      user: createdUser,
    },
  });
}
