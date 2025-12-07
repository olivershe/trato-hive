/**
 * Common Zod validators
 */
import { z } from 'zod'

// Email validator
export const emailSchema = z.string().email('Invalid email address')

// UUID validator
export const uuidSchema = z.string().uuid('Invalid UUID')

// CUID validator
export const cuidSchema = z.string().cuid('Invalid CUID')

// Pagination schemas
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
})

export type PaginationInput = z.infer<typeof paginationSchema>

// Sort order schema
export const sortOrderSchema = z.enum(['asc', 'desc']).default('desc')

export type SortOrder = z.infer<typeof sortOrderSchema>

// Date range schema
export const dateRangeSchema = z.object({
  from: z.date(),
  to: z.date(),
})

export type DateRange = z.infer<typeof dateRangeSchema>
