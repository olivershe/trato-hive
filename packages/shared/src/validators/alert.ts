/**
 * Alert Validators
 *
 * [TASK-120] AI Alerts InboxBlock
 *
 * Zod schemas for alert-related inputs.
 */

import { z } from 'zod'

/**
 * Alert list input schema
 */
export const alertListInputSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(50).default(10),
  includeSnoozed: z.boolean().default(false),
  includeDismissed: z.boolean().default(false),
})

export type AlertListInput = z.infer<typeof alertListInputSchema>

/**
 * Dismiss alert input schema
 */
export const dismissAlertInputSchema = z.object({
  alertId: z.string().min(1, 'Alert ID is required'),
})

export type DismissAlertInput = z.infer<typeof dismissAlertInputSchema>

/**
 * Snooze alert input schema
 */
export const snoozeAlertInputSchema = z.object({
  alertId: z.string().min(1, 'Alert ID is required'),
  hours: z.number().int().positive().max(168), // Max 1 week
})

export type SnoozeAlertInput = z.infer<typeof snoozeAlertInputSchema>
