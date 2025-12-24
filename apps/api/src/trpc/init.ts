/**
 * tRPC Instance and Middleware
 *
 * Initializes the tRPC instance with context and defines middleware for:
 * - Authentication (protectedProcedure)
 * - Multi-tenancy enforcement (organizationProtectedProcedure)
 *
 * @see https://trpc.io/docs/server/middlewares
 */
import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { Context } from './context';

/**
 * Initialize tRPC with context type
 *
 * Configuration:
 * - transformer: SuperJSON (supports Date, Map, Set, BigInt, etc.)
 * - errorFormatter: Default shape (can be customized)
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

/**
 * Base router factory
 * Use this to create new routers
 */
export const router = t.router;

/**
 * Public procedure (no authentication required)
 * Use sparingly - most procedures should be protected
 *
 * @example
 * ```typescript
 * export const healthRouter = router({
 *   check: publicProcedure.query(() => ({ status: 'ok' })),
 * });
 * ```
 */
export const publicProcedure = t.procedure;

/**
 * Protected procedure middleware
 *
 * Enforces authentication by checking for valid session.
 * Throws UNAUTHORIZED (401) if no session exists.
 *
 * @throws {TRPCError} UNAUTHORIZED if no session
 *
 * @example
 * ```typescript
 * export const userRouter = router({
 *   me: protectedProcedure.query(async ({ ctx }) => {
 *     // ctx.session.user is guaranteed to exist
 *     return ctx.session.user;
 *   }),
 * });
 * ```
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }

  return next({
    ctx: {
      ...ctx,
      // Override session to be non-nullable for type safety
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

/**
 * Organization-protected procedure middleware
 *
 * Enforces multi-tenancy by:
 * 1. Requiring valid session (via protectedProcedure)
 * 2. Requiring organizationId in session
 * 3. Adding organizationId to context for easy access
 *
 * This is the CRITICAL middleware for multi-tenant isolation.
 * Use this for all procedures that access organization-specific data.
 *
 * @throws {TRPCError} UNAUTHORIZED if no session
 * @throws {TRPCError} FORBIDDEN if no organizationId in session
 *
 * @example
 * ```typescript
 * export const dealRouter = router({
 *   list: organizationProtectedProcedure
 *     .input(z.object({ page: z.number().default(1) }))
 *     .query(async ({ ctx, input }) => {
 *       // ctx.organizationId is guaranteed to exist
 *       const deals = await ctx.db.deal.findMany({
 *         where: { organizationId: ctx.organizationId }, // Multi-tenancy enforcement
 *         skip: (input.page - 1) * 10,
 *         take: 10,
 *       });
 *       return deals;
 *     }),
 * });
 * ```
 */
export const organizationProtectedProcedure = protectedProcedure.use(
  async ({ ctx, next }) => {
    if (!ctx.session.user.organizationId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You must belong to an organization to access this resource',
      });
    }

    return next({
      ctx: {
        ...ctx,
        // Add organizationId to context for convenience
        organizationId: ctx.session.user.organizationId,
      },
    });
  }
);
