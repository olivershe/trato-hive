/**
 * Alerts Service
 *
 * [TASK-120] AI Alerts InboxBlock
 *
 * Business logic for pipeline alerts. Analyzes deal state to generate
 * actionable alerts (e.g., stale deals, pending documents, follow-ups).
 *
 * Note: Alert persistence (dismiss/snooze) is currently in-memory.
 * Future: Persist to database for cross-session retention.
 */

import type { PrismaClient, DealStage } from '@trato-hive/db';
import type {
  AlertListInput,
  DismissAlertInput,
  SnoozeAlertInput,
} from '@trato-hive/shared';
import {
  AlertType,
  AlertPriority,
  AlertStatus,
  type AlertPriorityValue,
  type DealAlert,
  type AlertListResult,
} from '@trato-hive/shared';

// Threshold for stale deals (days in same stage)
const STALE_DEAL_THRESHOLD_DAYS = 14;

// In-memory alert state (stub for future persistence)
const dismissedAlerts = new Set<string>();
const snoozedAlerts = new Map<string, Date>();

export class AlertsService {
  constructor(private db: PrismaClient) {}

  /**
   * Generate alert ID from deal and type
   */
  private generateAlertId(dealId: string, type: string): string {
    return `${type}:${dealId}`;
  }

  /**
   * Check if alert is dismissed
   */
  private isDismissed(alertId: string): boolean {
    return dismissedAlerts.has(alertId);
  }

  /**
   * Check if alert is snoozed (and still within snooze period)
   */
  private isSnoozed(alertId: string): Date | null {
    const snoozeUntil = snoozedAlerts.get(alertId);
    if (!snoozeUntil) return null;
    if (snoozeUntil <= new Date()) {
      // Snooze expired, remove it
      snoozedAlerts.delete(alertId);
      return null;
    }
    return snoozeUntil;
  }

  /**
   * Calculate alert priority based on days overdue
   */
  private calculatePriority(daysInStage: number): AlertPriorityValue {
    if (daysInStage >= 30) return AlertPriority.URGENT;
    if (daysInStage >= 21) return AlertPriority.HIGH;
    if (daysInStage >= 14) return AlertPriority.MEDIUM;
    return AlertPriority.LOW;
  }

  /**
   * Format stage name for display
   */
  private formatStageName(stage: string): string {
    return stage
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Get list of active alerts for organization
   */
  async getAlerts(
    input: AlertListInput,
    organizationId: string
  ): Promise<AlertListResult> {
    const { page, pageSize, includeSnoozed, includeDismissed } = input;

    // Query deals that may trigger alerts
    // Focus on active deals (not closed)
    const activeStages: DealStage[] = [
      'SOURCING',
      'INITIAL_REVIEW',
      'PRELIMINARY_DUE_DILIGENCE',
      'DEEP_DUE_DILIGENCE',
      'NEGOTIATION',
      'CLOSING',
    ];

    const deals = await this.db.deal.findMany({
      where: {
        organizationId,
        stage: { in: activeStages },
      },
      select: {
        id: true,
        name: true,
        stage: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'asc' }, // Oldest first (most stale)
    });

    const now = new Date();
    const alerts: DealAlert[] = [];

    // Generate alerts for stale deals
    for (const deal of deals) {
      const daysInStage = Math.floor(
        (now.getTime() - deal.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysInStage >= STALE_DEAL_THRESHOLD_DAYS) {
        const alertId = this.generateAlertId(deal.id, AlertType.STAGE_OVERDUE);
        const snoozeUntil = this.isSnoozed(alertId);
        const isDismissed = this.isDismissed(alertId);

        // Filter based on input flags
        if (isDismissed && !includeDismissed) continue;
        if (snoozeUntil && !includeSnoozed) continue;

        const priority = this.calculatePriority(daysInStage);

        alerts.push({
          id: alertId,
          dealId: deal.id,
          dealName: deal.name,
          type: AlertType.STAGE_OVERDUE,
          priority,
          status: isDismissed
            ? AlertStatus.DISMISSED
            : snoozeUntil
              ? AlertStatus.SNOOZED
              : AlertStatus.ACTIVE,
          message: `"${deal.name}" has been in ${this.formatStageName(deal.stage)} for ${daysInStage} days`,
          metadata: {
            daysInStage,
            currentStage: deal.stage,
          },
          snoozeUntil,
          createdAt: deal.updatedAt,
        });
      }
    }

    // Sort by priority (URGENT > HIGH > MEDIUM > LOW), then by days
    const priorityOrder: Record<AlertPriorityValue, number> = {
      URGENT: 0,
      HIGH: 1,
      MEDIUM: 2,
      LOW: 3,
    };
    alerts.sort((a, b) => {
      const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (pDiff !== 0) return pDiff;
      return (b.metadata.daysInStage || 0) - (a.metadata.daysInStage || 0);
    });

    // Paginate
    const total = alerts.length;
    const start = (page - 1) * pageSize;
    const paginatedAlerts = alerts.slice(start, start + pageSize);

    return {
      items: paginatedAlerts,
      pagination: {
        page,
        pageSize,
        total,
        hasMore: start + pageSize < total,
      },
    };
  }

  /**
   * Dismiss an alert (stub - in-memory)
   */
  async dismissAlert(
    input: DismissAlertInput,
    _organizationId: string
  ): Promise<{ success: boolean }> {
    dismissedAlerts.add(input.alertId);
    return { success: true };
  }

  /**
   * Snooze an alert for specified hours (stub - in-memory)
   */
  async snoozeAlert(
    input: SnoozeAlertInput,
    _organizationId: string
  ): Promise<{ success: boolean; snoozeUntil: Date }> {
    const snoozeUntil = new Date();
    snoozeUntil.setHours(snoozeUntil.getHours() + input.hours);
    snoozedAlerts.set(input.alertId, snoozeUntil);
    return { success: true, snoozeUntil };
  }
}
