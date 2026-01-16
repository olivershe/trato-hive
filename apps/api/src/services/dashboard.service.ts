/**
 * Dashboard Service
 *
 * Business logic for dashboard aggregations.
 * Provides pipeline health metrics and activity feeds for Command Center.
 * Enforces multi-tenancy via organizationId on all operations.
 */
import type { PrismaClient, DealStage, DealType, ActivityType, ActivityStatus, Activity } from '@trato-hive/db';
import { TRPCError } from '@trpc/server';
import {
  DealStage as DealStageEnum,
  DealType as DealTypeEnum,
  ActivityType as ActivityTypeEnum,
  type PipelineHealthInput,
  type RecentActivitiesInput,
  type ActivitySummaryInput,
  type UpdateActivityStatusInput,
} from '@trato-hive/shared';

// Local type definitions for dashboard aggregations
// (Defined locally to avoid shared package bundling issues)

export interface StageMetric {
  stage: DealStage;
  dealCount: number;
  totalValue: number | null;
  weightedValue: number | null;
  avgProbability: number | null;
}

export interface TypeMetric {
  type: DealType;
  count: number;
  value: number;
}

export interface PipelineHealthResult {
  stages: StageMetric[];
  summary: {
    totalDeals: number;
    totalValue: number;
    totalWeightedValue: number;
    avgProbability: number;
  };
  byType: TypeMetric[];
}

export interface ActivityFeedItem {
  id: string;
  type: ActivityType;
  description: string;
  metadata: unknown;
  status: ActivityStatus;
  statusChangedAt: Date | null;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
  deal: {
    id: string;
    name: string;
    stage: DealStage;
  } | null;
}

export interface RecentActivitiesResult {
  items: ActivityFeedItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
}

export interface ActivitySummary {
  type: ActivityType;
  count: number;
  label: string;
}

export interface ActivitySummaryResult {
  summary: ActivitySummary[];
  totalActivities: number;
  period: {
    from: Date;
    to: Date;
  };
}

// Human-readable labels for activity types
const ACTIVITY_LABELS: Record<string, string> = {
  DOCUMENT_UPLOADED: 'Documents Uploaded',
  DOCUMENT_PROCESSED: 'Documents Processed',
  DEAL_CREATED: 'Deals Created',
  DEAL_STAGE_CHANGED: 'Stage Changes',
  COMPANY_ADDED: 'Companies Added',
  AI_QUERY: 'AI Queries',
  USER_ACTION: 'User Actions',
  AI_SUGGESTION_ACCEPTED: 'AI Suggestions Accepted',
  AI_SUGGESTION_DISMISSED: 'AI Suggestions Dismissed',
  QA_APPROVED: 'Q&A Approved',
  QA_EDITED: 'Q&A Edited',
  QA_REJECTED: 'Q&A Rejected',
};

export class DashboardService {
  constructor(private db: PrismaClient) {}

  /**
   * Get pipeline health metrics
   * Multi-tenancy: Filters by organizationId
   */
  async getPipelineHealth(
    organizationId: string,
    input?: PipelineHealthInput
  ): Promise<PipelineHealthResult> {
    const includeClosedDeals = input?.includeClosedDeals ?? false;

    // Build where clause
    const where: Record<string, unknown> = {
      organizationId,
    };

    if (input?.type) {
      where.type = input.type;
    }

    // Exclude closed deals if not requested
    if (!includeClosedDeals) {
      where.stage = {
        notIn: ['CLOSED_WON', 'CLOSED_LOST'],
      };
    }

    // Get all deals matching criteria
    const deals = await this.db.deal.findMany({
      where,
      select: {
        stage: true,
        type: true,
        value: true,
        probability: true,
      },
    });

    // Initialize all stages
    const stageMap = new Map<DealStage, StageMetric>();
    Object.values(DealStageEnum).forEach((stage) => {
      stageMap.set(stage as DealStage, {
        stage: stage as DealStage,
        dealCount: 0,
        totalValue: null,
        weightedValue: null,
        avgProbability: null,
      });
    });

    // Calculate metrics per stage
    const probabilitySum: Record<string, number> = {};
    const probabilityCount: Record<string, number> = {};

    for (const deal of deals) {
      const metric = stageMap.get(deal.stage)!;
      metric.dealCount++;

      if (deal.value !== null) {
        const value = Number(deal.value);
        metric.totalValue = (metric.totalValue ?? 0) + value;

        const probability = deal.probability ?? 50; // Default 50% if not set
        metric.weightedValue = (metric.weightedValue ?? 0) + (value * probability) / 100;
      }

      if (deal.probability !== null) {
        probabilitySum[deal.stage] = (probabilitySum[deal.stage] ?? 0) + deal.probability;
        probabilityCount[deal.stage] = (probabilityCount[deal.stage] ?? 0) + 1;
      }
    }

    // Calculate average probabilities
    for (const [stage, metric] of stageMap) {
      if (probabilityCount[stage]) {
        metric.avgProbability = probabilitySum[stage] / probabilityCount[stage];
      }
    }

    // Aggregate by type
    const typeMap = new Map<DealType, { count: number; value: number }>();
    Object.values(DealTypeEnum).forEach((type) => {
      typeMap.set(type as DealType, { count: 0, value: 0 });
    });

    for (const deal of deals) {
      const typeMetric = typeMap.get(deal.type)!;
      typeMetric.count++;
      if (deal.value !== null) {
        typeMetric.value += Number(deal.value);
      }
    }

    // Calculate summary
    const totalValue = deals.reduce((sum, d) => sum + (d.value ? Number(d.value) : 0), 0);
    const totalWeightedValue = deals.reduce((sum, d) => {
      if (d.value === null) return sum;
      const prob = d.probability ?? 50;
      return sum + (Number(d.value) * prob) / 100;
    }, 0);
    const totalProbabilitySum = deals.reduce((sum, d) => sum + (d.probability ?? 0), 0);
    const dealsWithProbability = deals.filter((d) => d.probability !== null).length;

    return {
      stages: Array.from(stageMap.values()),
      summary: {
        totalDeals: deals.length,
        totalValue,
        totalWeightedValue,
        avgProbability: dealsWithProbability > 0 ? totalProbabilitySum / dealsWithProbability : 0,
      },
      byType: Array.from(typeMap.entries()).map(([type, data]) => ({
        type,
        count: data.count,
        value: data.value,
      })),
    };
  }

  /**
   * Get recent activities (org-wide)
   * Multi-tenancy: Filters through Deal relation to organizationId
   */
  async getRecentActivities(
    organizationId: string,
    input: RecentActivitiesInput
  ): Promise<RecentActivitiesResult> {
    const { page, pageSize, hoursBack } = input;
    const excludeDismissed = (input as { excludeDismissed?: boolean }).excludeDismissed ?? true;
    const skip = (page - 1) * pageSize;

    const since = new Date();
    since.setHours(since.getHours() - hoursBack);

    // Build where clause
    const where: Record<string, unknown> = {
      createdAt: { gte: since },
      deal: { organizationId },
    };

    // Exclude dismissed activities by default
    if (excludeDismissed) {
      where.status = { not: 'DISMISSED' };
    }

    // Get activities for deals belonging to this organization
    const [activities, total] = await Promise.all([
      this.db.activity.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          deal: {
            select: {
              id: true,
              name: true,
              stage: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.db.activity.count({ where }),
    ]);

    return {
      items: activities.map((a) => ({
        id: a.id,
        type: a.type,
        description: a.description,
        metadata: a.metadata,
        status: a.status,
        statusChangedAt: a.statusChangedAt,
        createdAt: a.createdAt,
        user: a.user,
        deal: a.deal
          ? {
              id: a.deal.id,
              name: a.deal.name,
              stage: a.deal.stage,
            }
          : null,
      })),
      pagination: {
        page,
        pageSize,
        total,
        hasMore: skip + activities.length < total,
      },
    };
  }

  /**
   * Update activity status (mark as read or dismissed)
   * Multi-tenancy: Validates activity belongs to organization via Deal
   */
  async updateActivityStatus(
    organizationId: string,
    input: UpdateActivityStatusInput
  ): Promise<Activity> {
    const { activityId, status } = input;

    // Verify activity belongs to this organization (via Deal relation)
    const activity = await this.db.activity.findFirst({
      where: {
        id: activityId,
        deal: { organizationId },
      },
    });

    if (!activity) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Activity not found or access denied',
      });
    }

    // Update the activity status
    return this.db.activity.update({
      where: { id: activityId },
      data: {
        status,
        statusChangedAt: new Date(),
      },
    });
  }

  /**
   * Get activity summary (counts by type)
   * Multi-tenancy: Filters through Deal relation to organizationId
   */
  async getActivitySummary(
    organizationId: string,
    input: ActivitySummaryInput
  ): Promise<ActivitySummaryResult> {
    const { hoursBack } = input;

    const since = new Date();
    const to = new Date();
    since.setHours(since.getHours() - hoursBack);

    // Group by type - only for activities linked to org's deals
    const activities = await this.db.activity.groupBy({
      by: ['type'],
      where: {
        createdAt: { gte: since },
        deal: { organizationId },
      },
      _count: { id: true },
    });

    // Build summary with all types (including zeros)
    const typeCountMap = new Map<string, number>();
    for (const a of activities) {
      typeCountMap.set(a.type, a._count.id);
    }

    const summary = Object.values(ActivityTypeEnum).map((type) => ({
      type: type as ActivityType,
      count: typeCountMap.get(type) ?? 0,
      label: ACTIVITY_LABELS[type] || type,
    }));

    const totalActivities = activities.reduce((sum, a) => sum + a._count.id, 0);

    return {
      summary,
      totalActivities,
      period: {
        from: since,
        to,
      },
    };
  }
}
