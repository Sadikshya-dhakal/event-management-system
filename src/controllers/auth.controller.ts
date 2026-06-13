import type { Request, Response } from 'express';
import { User } from '../models/user.model.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { environment } from '../environment.js';


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

    // FIX: Add explicit select('+password') to get the hidden field
    const user = await User.findOne({ email: normalizedEmail }).select('+password').lean();

    console.log('USER FOUND:', user);  // Debug: Check if user exists
    console.log('PASSWORD EXISTS:', !!user?.password);  // Debug: Check if password exists

    if (!user) {
      return res.status(401).json({
        message: 'Invalid credentials',
      });
    }

    // FIX: Check if password field exists
    if (!user.password) {
      return res.status(500).json({
        message: 'Database error: Password not found. Please register again.',
      });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    
    console.log('PASSWORD MATCH:', isMatch);  // Debug: Check if passwords match

    if (!isMatch) {
      return res.status(401).json({
        message: 'Invalid credentials',
      });
    }

    // Generate token
    const secret = environment.JWT_SECRET || 'secret';
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
    console.error('LOGIN ERROR:', err);  // Debug: Log full error
    return res.status(500).json({
      message: err.message,
    });
  }
}