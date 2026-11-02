import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const registerSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(60),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const skillItemSchema = z.object({
  skill: z.string().min(1, 'Skill name is required').max(60),
  domain: z.enum(['Technology', 'Creative Arts', 'Languages', 'Academics']),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'EXPERT'])
});

export const bookingSchema = z.object({
  mentorId: z.string().min(1),
  skillName: z.string().min(1),
  domain: z.enum(['Technology', 'Creative Arts', 'Languages', 'Academics']),
  scheduledTime: z.string().optional()
});
