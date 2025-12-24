/**
 * Root tRPC Router
 *
 * This is the main router that combines all feature routers.
 * Feature routers will be added in Phase 8 (Backend Implementation).
 *
 * Future routers:
 * - dealRouter - Deal CRUD operations
 * - companyRouter - Company management
 * - documentRouter - Document handling
 * - diligenceRouter - VDR and Q&A
 * - discoveryRouter - Company sourcing
 *
 * @see apps/api/CLAUDE.md for router patterns
 */
import { router } from './init';

/**
 * Root application router
 *
 * Feature routers will be added here:
 * @example
 * ```typescript
 * import { dealRouter } from './routers/deals';
 * import { companyRouter } from './routers/companies';
 *
 * export const appRouter = router({
 *   deal: dealRouter,
 *   company: companyRouter,
 * });
 * ```
 */
export const appRouter = router({
  // Feature routers will be added in Phase 8
});

/**
 * Type definition for the app router
 * This type is used by the tRPC client for end-to-end type safety
 */
export type AppRouter = typeof appRouter;
