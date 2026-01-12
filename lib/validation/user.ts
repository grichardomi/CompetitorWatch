import { z } from 'zod';
import { PASSWORD_REQUIREMENTS } from '@/lib/auth/password';

/**
 * Password schema with strength requirements
 */
export const passwordSchema = z
  .string()
  .min(
    PASSWORD_REQUIREMENTS.minLength,
    `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`
  )
  .max(
    PASSWORD_REQUIREMENTS.maxLength,
    `Password must be no more than ${PASSWORD_REQUIREMENTS.maxLength} characters`
  )
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/\d/, 'Password must contain at least one number');

/**
 * Sign up schema
 */
export const signUpSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  email: z
    .string()
    .email('Invalid email address')
    .toLowerCase()
    .trim(),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

/**
 * User profile update schema
 */
export const userProfileUpdateSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .trim()
    .optional(),
  email: z
    .string()
    .email('Invalid email address')
    .toLowerCase()
    .trim()
    .optional(),
});

/**
 * Password change schema
 */
export const passwordChangeSchema = z.object({
  currentPassword: z.string().optional(), // Optional for OAuth users setting first password
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

/**
 * Account deletion schema
 */
export const accountDeletionSchema = z.object({
  confirmText: z
    .string()
    .refine((val) => val === 'DELETE', {
      message: 'You must type DELETE to confirm',
    }),
  password: z.string().optional(), // Required for password users, validated in API
});

/**
 * Email validation schema
 */
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .toLowerCase()
  .trim();

/**
 * Name validation schema
 */
export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters')
  .trim();
