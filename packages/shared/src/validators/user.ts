/**
 * User Validators
 */
import { z } from 'zod'

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').nullable().optional(),
  image: z.string().url('Invalid image URL').nullable().optional(),
  // For initial creation, a user might not have an org yet, or it might be passed
})

export type CreateUserInput = z.infer<typeof createUserSchema>

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export type LoginInput = z.infer<typeof loginSchema>

export const updateUserSchema = createUserSchema.partial().extend({
  id: z.string().cuid('Invalid user ID'),
})

export type UpdateUserInput = z.infer<typeof updateUserSchema>

export const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().nullable().optional(),
  image: z.string().url().nullable().optional(),
})

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>
