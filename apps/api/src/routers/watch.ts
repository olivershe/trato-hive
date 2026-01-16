/**
 * Watch Router - tRPC router for CompanyWatch operations
 * [TASK-109]
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

function createWatchService(ctx: { db: any }) {
  return new WatchService(ctx.db);
}

export const watchRouter = router({
  add: organizationProtectedProcedure
    .input(watchAddInputSchema)
    .mutation(({ ctx, input }) =>
      createWatchService(ctx).add(input, ctx.session.user.id, ctx.organizationId)
    ),

  remove: organizationProtectedProcedure
    .input(watchRemoveInputSchema)
    .mutation(({ ctx, input }) =>
      createWatchService(ctx).remove(input.companyId, ctx.session.user.id, ctx.organizationId)
    ),

  update: organizationProtectedProcedure
    .input(watchUpdateInputSchema)
    .mutation(({ ctx, input }) =>
      createWatchService(ctx).update(input, ctx.session.user.id, ctx.organizationId)
    ),

  list: organizationProtectedProcedure
    .input(watchListInputSchema)
    .query(({ ctx, input }) =>
      createWatchService(ctx).list(input, ctx.session.user.id, ctx.organizationId)
    ),

  isWatched: organizationProtectedProcedure
    .input(watchIsWatchedInputSchema)
    .query(({ ctx, input }) =>
      createWatchService(ctx).isWatched(input.companyId, ctx.session.user.id, ctx.organizationId)
    ),
});
