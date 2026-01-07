/**
 * Activity Types
 * Based on Prisma schema: packages/db/prisma/schema.prisma
 */

/**
 * ActivityType - Type of activity/audit event
 */
export const ActivityType = {
  DOCUMENT_UPLOADED: 'DOCUMENT_UPLOADED',
  DOCUMENT_PROCESSED: 'DOCUMENT_PROCESSED',
  DEAL_CREATED: 'DEAL_CREATED',
  DEAL_STAGE_CHANGED: 'DEAL_STAGE_CHANGED',
  COMPANY_ADDED: 'COMPANY_ADDED',
  AI_QUERY: 'AI_QUERY',
  USER_ACTION: 'USER_ACTION',
  AI_SUGGESTION_ACCEPTED: 'AI_SUGGESTION_ACCEPTED',
  AI_SUGGESTION_DISMISSED: 'AI_SUGGESTION_DISMISSED',
} as const

export type ActivityTypeValue = (typeof ActivityType)[keyof typeof ActivityType]

/**
 * Activity - Audit log entry (Layer 6: Governance)
 */
export interface Activity {
  id: string
  userId: string | null
  dealId: string | null
  type: ActivityTypeValue
  description: string
  metadata: unknown | null // JSON metadata
  createdAt: Date
}

/**
 * ActivityWithUser - Activity with user information
 * Used for: Activity timeline, audit logs
 */
export interface ActivityWithUser extends Activity {
  user: {
    id: string
    name: string | null
    email: string
  } | null
}

/**
 * ActivityWithDeal - Activity with deal context
 * Used for: Deal-specific activity feed
 */
export interface ActivityWithDeal extends Activity {
  deal: {
    id: string
    name: string
    stage: string
  } | null
}
