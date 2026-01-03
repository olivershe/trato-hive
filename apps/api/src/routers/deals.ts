/**
 * Deals Router
 *
 * tRPC router for Deal CRUD operations.
 * All procedures use organizationProtectedProcedure for multi-tenancy.
 */
import { z } from 'zod';
import { router, organizationProtectedProcedure } from '../trpc/init';
import { DealService, ActivityService } from '../services';
import {
  dealListInputSchema,
  dealGetInputSchema,
  routerCreateDealSchema,
  routerUpdateDealSchema,
} from '@trato-hive/shared';
import { ActivityType } from '@trato-hive/db';

export const dealsRouter = router({
  /**
   * deal.list - List deals with pagination and filtering
   * Auth: organizationProtectedProcedure
   */
  list: organizationProtectedProcedure
    .input(dealListInputSchema)
    .query(async ({ ctx, input }) => {
      const dealService = new DealService(ctx.db);
      return dealService.list(input, ctx.organizationId);
    }),

  /**
   * deal.get - Get single deal by ID
   * Auth: organizationProtectedProcedure
   * Throws: NOT_FOUND if deal doesn't exist or belongs to different org
   */
  get: organizationProtectedProcedure
    .input(dealGetInputSchema)
    .query(async ({ ctx, input }) => {
      const dealService = new DealService(ctx.db);
      return dealService.getById(input.id, ctx.organizationId);
    }),

  /**
   * deal.getWithPage - Get deal with its Notion-style page and blocks
   * Auth: organizationProtectedProcedure
   * Used by: Editor view to load deal document
   */
  getWithPage: organizationProtectedProcedure
    .input(dealGetInputSchema)
    .query(async ({ ctx, input }) => {
      const dealService = new DealService(ctx.db);
      return dealService.getWithPage(input.id, ctx.organizationId);
    }),

  /**
   * deal.create - Create new deal with auto-created Page
   * Auth: organizationProtectedProcedure
   * Side effect: Creates Page + DealHeaderBlock, logs DEAL_CREATED activity
   */
  create: organizationProtectedProcedure
    .input(routerCreateDealSchema)
    .mutation(async ({ ctx, input }) => {
      const dealService = new DealService(ctx.db);
      const activityService = new ActivityService(ctx.db);

      const deal = await dealService.create(input, ctx.organizationId, ctx.session.user.id);

      // Audit log
      await activityService.log({
        userId: ctx.session.user.id,
        dealId: deal.id,
        type: ActivityType.DEAL_CREATED,
        description: `Created deal: ${deal.name}`,
        metadata: { stage: deal.stage, type: deal.type, value: deal.value },
      });

      return deal;
    }),

  /**
   * deal.update - Update existing deal
   * Auth: organizationProtectedProcedure
   * Side effect: Logs DEAL_STAGE_CHANGED if stage changed
   */
  update: organizationProtectedProcedure
    .input(routerUpdateDealSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const dealService = new DealService(ctx.db);
      const activityService = new ActivityService(ctx.db);

      // Get previous state for comparison
      const previousDeal = await dealService.getById(id, ctx.organizationId);

      const deal = await dealService.update(id, data, ctx.organizationId);

      // Log stage change if applicable
      if (data.stage && data.stage !== previousDeal.stage) {
        await activityService.log({
          userId: ctx.session.user.id,
          dealId: deal.id,
          type: ActivityType.DEAL_STAGE_CHANGED,
          description: `Stage changed: ${previousDeal.stage} → ${deal.stage}`,
          metadata: { previousStage: previousDeal.stage, newStage: deal.stage },
        });
      }

      return deal;
    }),

  /**
   * deal.getFactSheet - Get verifiable facts for deal
   * Auth: organizationProtectedProcedure
   * Joins: Deal → Company → Facts → Documents
   */
  getFactSheet: organizationProtectedProcedure
    .input(z.object({ dealId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const dealService = new DealService(ctx.db);
      return dealService.getFactSheet(input.dealId, ctx.organizationId);
    }),
});
