/**
 * Watch List Validators
 *
 * Zod schemas for CompanyWatch CRUD operations.
 * Used by: apps/api/src/routers/watch.ts
 *
 * [TASK-109] Watch tRPC Procedures
 */
import { z } from 'zod'

/**
 * Watch priority levels
 * 0 = low, 1 = medium, 2 = high
 */
export const watchPrioritySchema = z.number().int().min(0).max(2).default(0)

export type WatchPriority = z.infer<typeof watchPrioritySchema>

/**
 * Add company to watch list
 */
export const watchAddInputSchema = z.object({
  companyId: z.string().cuid('Invalid company ID'),
  notes: z.string().max(2000).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  priority: watchPrioritySchema.optional(),
})

export type WatchAddInput = z.infer<typeof watchAddInputSchema>

/**
 * Remove company from watch list
 */
export const watchRemoveInputSchema = z.object({
  companyId: z.string().cuid('Invalid company ID'),
})

export type WatchRemoveInput = z.infer<typeof watchRemoveInputSchema>

/**
 * Update watch entry (notes, tags, priority)
 */
export const watchUpdateInputSchema = z.object({
  companyId: z.string().cuid('Invalid company ID'),
  notes: z.string().max(2000).optional().nullable(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  priority: watchPrioritySchema.optional(),
})

export type WatchUpdateInput = z.infer<typeof watchUpdateInputSchema>

/**
 * List watched companies with pagination and filters
 */
export const watchListInputSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(50).default(20),
  filter: z.object({
    priority: watchPrioritySchema.optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
  sort: z.object({
    field: z.enum(['createdAt', 'priority', 'companyName']).default('createdAt'),
    order: z.enum(['asc', 'desc']).default('desc'),
  }).optional(),
})

export type WatchListInput = z.infer<typeof watchListInputSchema>

/**
 * Check if company is watched
 */
export const watchIsWatchedInputSchema = z.object({
  companyId: z.string().cuid('Invalid company ID'),
})

export type WatchIsWatchedInput = z.infer<typeof watchIsWatchedInputSchema>
