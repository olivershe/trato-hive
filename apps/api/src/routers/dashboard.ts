/**
 * Dashboard Router
 *
 * tRPC router for dashboard aggregation queries.
 * All procedures use organizationProtectedProcedure for multi-tenancy.
 */
import { router, organizationProtectedProcedure } from '../trpc/init';
import { DashboardService } from '../services';
import {
  pipelineHealthInputSchema,
  recentActivitiesInputSchema,
  activitySummaryInputSchema,
  updateActivityStatusInputSchema,
} from '@trato-hive/shared';

export const dashboardRouter = router({
  /**
   * dashboard.pipelineHealth - Get pipeline stage metrics
   * Auth: organizationProtectedProcedure
   * Returns: StageMetric[], summary totals, breakdown by type
   */
  pipelineHealth: organizationProtectedProcedure
    .input(pipelineHealthInputSchema)
    .query(async ({ ctx, input }) => {
      const dashboardService = new DashboardService(ctx.db);
      return dashboardService.getPipelineHealth(ctx.organizationId, input);
    }),

  /**
   * dashboard.recentActivities - Get paginated activity feed
   * Auth: organizationProtectedProcedure
   * Returns: ActivityFeedItem[], pagination info
   */
  recentActivities: organizationProtectedProcedure
    .input(recentActivitiesInputSchema)
    .query(async ({ ctx, input }) => {
      const dashboardService = new DashboardService(ctx.db);
      return dashboardService.getRecentActivities(ctx.organizationId, input);
    }),

  /**
   * dashboard.activitySummary - Get activity counts by type
   * Auth: organizationProtectedProcedure
   * Returns: ActivitySummary[], total count, period
   */
  activitySummary: organizationProtectedProcedure
    .input(activitySummaryInputSchema)
    .query(async ({ ctx, input }) => {
      const dashboardService = new DashboardService(ctx.db);
      return dashboardService.getActivitySummary(ctx.organizationId, input);
    }),

  /**
   * dashboard.updateActivityStatus - Mark activity as read or dismissed
   * Auth: organizationProtectedProcedure
   * Returns: Updated Activity
   */
  updateActivityStatus: organizationProtectedProcedure
    .input(updateActivityStatusInputSchema)
    .mutation(async ({ ctx, input }) => {
      const dashboardService = new DashboardService(ctx.db);
      return dashboardService.updateActivityStatus(ctx.organizationId, input);
    }),
});
