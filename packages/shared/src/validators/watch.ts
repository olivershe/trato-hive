/**
 * Watch List Validators
 * Zod schemas for CompanyWatch CRUD operations.
 * [TASK-109]
 */
import { z } from 'zod'

/** Priority: 0 = low, 1 = medium, 2 = high */
export const watchPrioritySchema = z.number().int().min(0).max(2).default(0)
export type WatchPriority = z.infer<typeof watchPrioritySchema>

const companyIdSchema = z.string().cuid('Invalid company ID')

export const watchAddInputSchema = z.object({
  companyId: companyIdSchema,
  notes: z.string().max(2000).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  priority: watchPrioritySchema.optional(),
})
export type WatchAddInput = z.infer<typeof watchAddInputSchema>

export const watchRemoveInputSchema = z.object({
  companyId: companyIdSchema,
})
export type WatchRemoveInput = z.infer<typeof watchRemoveInputSchema>

export const watchUpdateInputSchema = z.object({
  companyId: companyIdSchema,
  notes: z.string().max(2000).optional().nullable(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  priority: watchPrioritySchema.optional(),
})
export type WatchUpdateInput = z.infer<typeof watchUpdateInputSchema>

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

export const watchIsWatchedInputSchema = z.object({
  companyId: companyIdSchema,
})
export type WatchIsWatchedInput = z.infer<typeof watchIsWatchedInputSchema>
