/**
 * Root tRPC Router
 *
 * This is the main router that combines all feature routers.
 *
 * Active routers:
 * - block - Block synchronization for editor
 * - deal - Deal CRUD operations
 *
 * Future routers:
 * - companyRouter - Company management
 * - documentRouter - Document handling
 * - diligenceRouter - VDR and Q&A
 * - discoveryRouter - Company sourcing
 *
 * @see apps/api/CLAUDE.md for router patterns
 */
import { router } from './init';
import { blockRouter } from '../routers/block';
import { dealsRouter } from '../routers/deals';

/**
 * Root application router
 */
export const appRouter = router({
  block: blockRouter,
  deal: dealsRouter,
});

/**
 * Type definition for the app router
 * This type is used by the tRPC client for end-to-end type safety
 */
export type AppRouter = typeof appRouter;
