/**
 * Dashboard Validators
 * Input schemas for dashboard aggregation queries
 */
import { z } from 'zod'
import { DealType } from '../types/deal'

const dealTypeValues = Object.values(DealType) as [string, ...string[]]

/**
 * Pipeline Health Input - Filter options for pipeline metrics
 */
export const pipelineHealthInputSchema = z
  .object({
    type: z
      .enum(dealTypeValues, { errorMap: () => ({ message: 'Invalid deal type' }) })
      .optional(),
    includeClosedDeals: z.boolean().default(false),
  })
  .optional()

export type PipelineHealthInput = z.infer<typeof pipelineHealthInputSchema>

/**
 * Recent Activities Input - Pagination with time filter
 */
export const recentActivitiesInputSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(50).default(20),
  hoursBack: z.number().int().positive().max(168).default(48), // Max 7 days
})

export type RecentActivitiesInput = z.infer<typeof recentActivitiesInputSchema>

/**
 * Activity Summary Input - Time range filter
 */
export const activitySummaryInputSchema = z.object({
  hoursBack: z.number().int().positive().max(720).default(48), // Max 30 days
})

export type ActivitySummaryInput = z.infer<typeof activitySummaryInputSchema>
