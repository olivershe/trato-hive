/**
 * SyncGroup Router
 *
 * tRPC endpoints for managing synced blocks across pages.
 */
import { z } from 'zod';
import { router, organizationProtectedProcedure } from '../trpc/init';
import { SyncGroupService } from '../services/sync-group.service';

export const syncGroupRouter = router({
  /**
   * Create a sync group for a block
   */
  create: organizationProtectedProcedure
    .input(z.object({ blockId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const service = new SyncGroupService(ctx.db);
      const syncGroupId = await service.createSyncGroup(
        input.blockId,
        ctx.organizationId
      );
      return { syncGroupId };
    }),

  /**
   * Get all blocks in a sync group
   */
  getBlocks: organizationProtectedProcedure
    .input(z.object({ syncGroupId: z.string() }))
    .query(async ({ ctx, input }) => {
      const service = new SyncGroupService(ctx.db);
      return service.getSyncGroupBlocks(input.syncGroupId, ctx.organizationId);
    }),

  /**
   * Create a synced copy of a block on another page
   */
  createCopy: organizationProtectedProcedure
    .input(
      z.object({
        sourceBlockId: z.string(),
        targetPageId: z.string().cuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const service = new SyncGroupService(ctx.db);
      return service.createSyncedCopy(
        input.sourceBlockId,
        input.targetPageId,
        ctx.session.user.id,
        ctx.organizationId
      );
    }),

  /**
   * Remove a block from its sync group
   */
  unlink: organizationProtectedProcedure
    .input(z.object({ blockId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const service = new SyncGroupService(ctx.db);
      await service.unlinkFromSyncGroup(input.blockId, ctx.organizationId);
      return { success: true };
    }),
});
