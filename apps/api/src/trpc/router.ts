/**
 * Root tRPC Router
 *
 * This is the main router that combines all feature routers.
 *
 * Active routers:
 * - block - Block synchronization for editor
 * - deal - Deal CRUD operations
 * - database - Inline database CRUD operations
 * - dashboard - Pipeline health and activity metrics
 * - diligence - AI Q&A with citations
 * - vdr - Virtual Data Room document management
 * - generator - Document export (PPTX/DOCX)
 * - sourcing - Company search and discovery
 *
 * Future routers:
 * - companyRouter - Company CRUD operations
 *
 * @see apps/api/CLAUDE.md for router patterns
 */
import { router } from './init';
import { blockRouter } from '../routers/block';
import { dealsRouter } from '../routers/deals';
import { databasesRouter } from '../routers/databases';
import { dashboardRouter } from '../routers/dashboard';
import { diligenceRouter } from '../routers/diligence';
import { vdrRouter } from '../routers/vdr';
import { generatorRouter } from '../routers/generator';
import { sourcingRouter } from '../routers/sourcing';
import { pageRouter } from '../routers/page';
import { syncGroupRouter } from '../routers/sync-group';
import { userRouter } from '../routers/user';

/**
 * Root application router
 */
export const appRouter = router({
  block: blockRouter,
  deal: dealsRouter,
  database: databasesRouter,
  dashboard: dashboardRouter,
  diligence: diligenceRouter,
  vdr: vdrRouter,
  generator: generatorRouter,
  sourcing: sourcingRouter,
  page: pageRouter,
  syncGroup: syncGroupRouter,
  user: userRouter,
});

/**
 * Type definition for the app router
 * This type is used by the tRPC client for end-to-end type safety
 */
export type AppRouter = typeof appRouter;
