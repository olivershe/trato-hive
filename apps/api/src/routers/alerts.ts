/**
 * Alerts Router
 *
 * [TASK-120] AI Alerts InboxBlock
 *
 * tRPC router for pipeline alerts. Provides procedures for listing,
 * dismissing, and snoozing alerts.
 */

import { router, organizationProtectedProcedure } from '../trpc/init';
import { AlertsService } from '../services/alerts.service';
import {
  alertListInputSchema,
  dismissAlertInputSchema,
  snoozeAlertInputSchema,
} from '@trato-hive/shared';

export const alertsRouter = router({
  /**
   * List active alerts for the current organization
   */
  list: organizationProtectedProcedure
    .input(alertListInputSchema)
    .query(async ({ ctx, input }) => {
      const service = new AlertsService(ctx.db);
      return service.getAlerts(input, ctx.organizationId);
    }),

  /**
   * Dismiss an alert (remove from active list)
   */
  dismiss: organizationProtectedProcedure
    .input(dismissAlertInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new AlertsService(ctx.db);
      return service.dismissAlert(input, ctx.organizationId);
    }),

  /**
   * Snooze an alert for a specified number of hours
   */
  snooze: organizationProtectedProcedure
    .input(snoozeAlertInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new AlertsService(ctx.db);
      return service.snoozeAlert(input, ctx.organizationId);
    }),
});
