import type { Request, Response } from 'express';
import { User } from '../models/user.model.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';


// REGISTER

export async function registerController(req: Request, res: Response) {
  try {
    console.log('REQ BODY:', req.body);

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password required',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        message: 'User already exists',
      });
    }

    // FIX: Hash directly using native bcrypt to avoid utility file bugs
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = await User.create({
      email: normalizedEmail,
      password: hashedPassword,
    });

    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      message: err.message,
    });
  }
}

// LOGIN

export async function loginController(req: Request, res: Response) {
  try {
    console.log('LOGIN BODY:', req.body);

    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password required',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Force Mongoose to select the hidden password field
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(401).json({
        message: 'Invalid credentials',
      });
    }

    // Fail gracefully with a helpful message instead of a bcrypt crash
    if (!user.password) {
      return res.status(500).json({
        message: 'Database error: This user record does not have a hashed password saved.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: 'Invalid credentials',
      });
    }

    const secret = process.env.JWT_SECRET || 'secret';
    const token = jwt.sign({ id: user._id }, secret, {
      expiresIn: '7d',
    });

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      message: err.message,
    });
  }
}
