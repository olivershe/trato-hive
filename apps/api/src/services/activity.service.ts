/**
 * Activity Service
 *
 * Handles audit logging for the Activity table.
 * All mutations should log activities for compliance and tracking.
 */
import type { PrismaClient, ActivityType } from '@trato-hive/db';

export interface LogActivityParams {
  userId: string;
  dealId?: string;
  type: ActivityType;
  description: string;
  metadata?: Record<string, unknown>;
}

export class ActivityService {
  constructor(private db: PrismaClient) {}

  /**
   * Log an activity for audit trail
   *
   * @param params - Activity details
   * @returns Created activity record
   */
  async log(params: LogActivityParams) {
    const { userId, dealId, type, description, metadata } = params;

    return this.db.activity.create({
      data: {
        userId,
        dealId,
        type,
        description,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
      },
    });
  }

  /**
   * Get activities for a deal
   *
   * @param dealId - Deal ID to fetch activities for
   * @param limit - Maximum number of activities to return
   * @returns List of activities with user info
   */
  async getByDealId(dealId: string, limit = 50) {
    return this.db.activity.findMany({
      where: { dealId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
