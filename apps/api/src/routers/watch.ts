/**
 * Watch Router
 *
 * tRPC router for CompanyWatch operations.
 * All procedures use organizationProtectedProcedure for multi-tenancy.
 *
 * [TASK-109] Watch tRPC Procedures
 */
import { router, organizationProtectedProcedure } from '../trpc/init';
import { WatchService } from '../services/watch.service';
import {
  watchAddInputSchema,
  watchRemoveInputSchema,
  watchUpdateInputSchema,
  watchListInputSchema,
  watchIsWatchedInputSchema,
} from '@trato-hive/shared';

export const watchRouter = router({
  /**
   * watch.add - Add company to watch list
   * Auth: organizationProtectedProcedure
   * Creates a new CompanyWatch entry for the current user
   */
  add: organizationProtectedProcedure
    .input(watchAddInputSchema)
    .mutation(async ({ ctx, input }) => {
      const watchService = new WatchService(ctx.db);
      return watchService.add(input, ctx.session.user.id, ctx.organizationId);
    }),

  /**
   * watch.remove - Remove company from watch list
   * Auth: organizationProtectedProcedure
   */
  remove: organizationProtectedProcedure
    .input(watchRemoveInputSchema)
    .mutation(async ({ ctx, input }) => {
      const watchService = new WatchService(ctx.db);
      return watchService.remove(input.companyId, ctx.session.user.id, ctx.organizationId);
    }),

  /**
   * watch.update - Update watch entry (notes, tags, priority)
   * Auth: organizationProtectedProcedure
   */
  update: organizationProtectedProcedure
    .input(watchUpdateInputSchema)
    .mutation(async ({ ctx, input }) => {
      const watchService = new WatchService(ctx.db);
      return watchService.update(input, ctx.session.user.id, ctx.organizationId);
    }),

  /**
   * watch.list - List watched companies with pagination and filters
   * Auth: organizationProtectedProcedure
   * Returns paginated list of watched companies for the current user
   */
  list: organizationProtectedProcedure
    .input(watchListInputSchema)
    .query(async ({ ctx, input }) => {
      const watchService = new WatchService(ctx.db);
      return watchService.list(input, ctx.session.user.id, ctx.organizationId);
    }),

  /**
   * watch.isWatched - Check if company is in watch list
   * Auth: organizationProtectedProcedure
   * Returns { isWatched: boolean, watch: CompanyWatch | null }
   */
  isWatched: organizationProtectedProcedure
    .input(watchIsWatchedInputSchema)
    .query(async ({ ctx, input }) => {
      const watchService = new WatchService(ctx.db);
      return watchService.isWatched(input.companyId, ctx.session.user.id, ctx.organizationId);
    }),
});
