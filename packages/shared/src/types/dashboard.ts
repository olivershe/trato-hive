/**
 * Dashboard Types
 * Aggregation data structures for Command Center dashboard
 */

import type { DealStageValue, DealTypeValue } from './deal'
import type { ActivityTypeValue } from './activity'

/**
 * StageMetric - Aggregated metrics for a single pipeline stage
 * Used for: PipelineHealthBlock chart data
 */
export interface StageMetric {
  stage: DealStageValue
  dealCount: number
  totalValue: number | null
  weightedValue: number | null // value * probability / 100
  avgProbability: number | null
}

/**
 * TypeMetric - Aggregated metrics by deal type
 */
export interface TypeMetric {
  type: DealTypeValue
  count: number
  value: number
}

/**
 * PipelineHealthResult - Complete pipeline overview
 * Used for: PipelineHealthBlock in Command Center
 */
export interface PipelineHealthResult {
  stages: StageMetric[]
  summary: {
    totalDeals: number
    totalValue: number
    totalWeightedValue: number
    avgProbability: number
  }
  byType: TypeMetric[]
}

/**
 * ActivityFeedItem - Single activity with user and deal context
 * Used for: InboxBlock activity feed
 */
export interface ActivityFeedItem {
  id: string
  type: ActivityTypeValue
  description: string
  metadata: unknown
  createdAt: Date
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  } | null
  deal: {
    id: string
    name: string
    stage: DealStageValue
  } | null
}

/**
 * RecentActivitiesResult - Paginated activity feed
 * Used for: InboxBlock in Command Center
 */
export interface RecentActivitiesResult {
  items: ActivityFeedItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    hasMore: boolean
  }
}

/**
 * ActivitySummary - Count for a single activity type
 */
export interface ActivitySummary {
  type: ActivityTypeValue
  count: number
  label: string
}

/**
 * ActivitySummaryResult - Activity counts by type with period
 * Used for: Activity stats in Command Center
 */
export interface ActivitySummaryResult {
  summary: ActivitySummary[]
  totalActivities: number
  period: {
    from: Date
    to: Date
  }
}
