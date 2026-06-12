import { z } from 'zod';

export const createEventSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  date: z.string().datetime(),
  venue: z.string().min(2),
  capacity: z.number().int().positive(),
  status: z.enum(['draft', 'published']).optional().default('draft'),
});

export const updateEventSchema = createEventSchema.partial();

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});