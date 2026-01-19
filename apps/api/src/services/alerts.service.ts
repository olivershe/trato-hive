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
  type AlertStatusValue,
  type DealAlert,
  type AlertListResult,
} from '@trato-hive/shared';

const STALE_DEAL_THRESHOLD_DAYS = 14;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

const ACTIVE_STAGES: DealStage[] = [
  'SOURCING',
  'INITIAL_REVIEW',
  'PRELIMINARY_DUE_DILIGENCE',
  'DEEP_DUE_DILIGENCE',
  'NEGOTIATION',
  'CLOSING',
];

const PRIORITY_ORDER: Record<AlertPriorityValue, number> = {
  URGENT: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

// In-memory alert state (stub for future persistence)
const dismissedAlerts = new Set<string>();
const snoozedAlerts = new Map<string, Date>();

function generateAlertId(dealId: string, type: string): string {
  return `${type}:${dealId}`;
}

function formatStageName(stage: string): string {
  return stage
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

function calculateDaysInStage(updatedAt: Date, now: Date): number {
  return Math.floor((now.getTime() - updatedAt.getTime()) / MS_PER_DAY);
}

function calculatePriority(daysInStage: number): AlertPriorityValue {
  if (daysInStage >= 30) return AlertPriority.URGENT;
  if (daysInStage >= 21) return AlertPriority.HIGH;
  if (daysInStage >= 14) return AlertPriority.MEDIUM;
  return AlertPriority.LOW;
}

function getAlertStatus(isDismissed: boolean, snoozeUntil: Date | null): AlertStatusValue {
  if (isDismissed) return AlertStatus.DISMISSED;
  if (snoozeUntil) return AlertStatus.SNOOZED;
  return AlertStatus.ACTIVE;
}

function checkSnoozed(alertId: string): Date | null {
  const snoozeUntil = snoozedAlerts.get(alertId);
  if (!snoozeUntil) return null;

  if (snoozeUntil <= new Date()) {
    snoozedAlerts.delete(alertId);
    return null;
  }
  return snoozeUntil;
}

export class AlertsService {
  constructor(private db: PrismaClient) {}

  async getAlerts(input: AlertListInput, organizationId: string): Promise<AlertListResult> {
    const { page, pageSize, includeSnoozed, includeDismissed } = input;

    const deals = await this.db.deal.findMany({
      where: {
        organizationId,
        stage: { in: ACTIVE_STAGES },
      },
      select: {
        id: true,
        name: true,
        stage: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'asc' },
    });

    const now = new Date();
    const alerts: DealAlert[] = [];

    for (const deal of deals) {
      const daysInStage = calculateDaysInStage(deal.updatedAt, now);

      if (daysInStage < STALE_DEAL_THRESHOLD_DAYS) continue;

      const alertId = generateAlertId(deal.id, AlertType.STAGE_OVERDUE);
      const snoozeUntil = checkSnoozed(alertId);
      const isDismissed = dismissedAlerts.has(alertId);

      if (isDismissed && !includeDismissed) continue;
      if (snoozeUntil && !includeSnoozed) continue;

      alerts.push({
        id: alertId,
        dealId: deal.id,
        dealName: deal.name,
        type: AlertType.STAGE_OVERDUE,
        priority: calculatePriority(daysInStage),
        status: getAlertStatus(isDismissed, snoozeUntil),
        message: `"${deal.name}" has been in ${formatStageName(deal.stage)} for ${daysInStage} days`,
        metadata: {
          daysInStage,
          currentStage: deal.stage,
        },
        snoozeUntil,
        createdAt: deal.updatedAt,
      });
    }

    alerts.sort((a, b) => {
      const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return (b.metadata.daysInStage || 0) - (a.metadata.daysInStage || 0);
    });

    const total = alerts.length;
    const start = (page - 1) * pageSize;

    return {
      items: alerts.slice(start, start + pageSize),
      pagination: {
        page,
        pageSize,
        total,
        hasMore: start + pageSize < total,
      },
    };
  }

  async dismissAlert(input: DismissAlertInput, _organizationId: string): Promise<{ success: boolean }> {
    dismissedAlerts.add(input.alertId);
    return { success: true };
  }

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
