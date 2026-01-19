/**
 * Root tRPC Router
 *
 * This is the main router that combines all feature routers.
 *
 * Active routers:
 * - block - Block synchronization for editor
 * - company - Company CRUD operations [TASK-106]
 * - deal - Deal CRUD operations
 * - database - Inline database CRUD operations
 * - dashboard - Pipeline health and activity metrics
 * - diligence - AI Q&A with citations
 * - vdr - Virtual Data Room document management
 * - generator - Document export (PPTX/DOCX)
 * - sourcing - Company search and discovery
 *
 * @see apps/api/CLAUDE.md for router patterns
 */
import { router } from './init';
import { blockRouter } from '../routers/block';
import { companyRouter } from '../routers/company';
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
import { searchRouter } from '../routers/search';
import { watchRouter } from '../routers/watch';
import { documentRouter } from '../routers/document';
import { qaRouter } from '../routers/qa';
import { alertsRouter } from '../routers/alerts';

/**
 * Root application router
 */
export const appRouter = router({
  block: blockRouter,
  company: companyRouter,
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
  search: searchRouter,
  watch: watchRouter,
  document: documentRouter,
  qa: qaRouter,
  alerts: alertsRouter,
});

/**
 * Type definition for the app router
 * This type is used by the tRPC client for end-to-end type safety
 */
export type AppRouter = typeof appRouter;
