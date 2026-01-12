/**
 * Page Router
 *
 * tRPC router for Notion-like page hierarchy within Deals.
 * Supports recursive nesting, wiki links, and breadcrumb navigation.
 */
import { router, organizationProtectedProcedure } from '../trpc/init';
import { PageService } from '../services/page.service';
import {
  createPageSchema,
  updatePageSchema,
  movePageSchema,
  getPageTreeSchema,
  getPageSchema,
  getBacklinksSchema,
  getBreadcrumbsSchema,
  deletePageSchema,
  syncPageLinksSchema,
} from '@trato-hive/shared';

export const pageRouter = router({
  /**
   * page.create - Create new page in deal
   * Auth: organizationProtectedProcedure
   */
  create: organizationProtectedProcedure
    .input(createPageSchema)
    .mutation(async ({ ctx, input }) => {
      const pageService = new PageService(ctx.db);
      return pageService.create(input, ctx.session.user.id, ctx.organizationId);
    }),

  /**
   * page.update - Update page metadata (title, icon, cover)
   * Auth: organizationProtectedProcedure
   */
  update: organizationProtectedProcedure
    .input(updatePageSchema)
    .mutation(async ({ ctx, input }) => {
      const pageService = new PageService(ctx.db);
      return pageService.update(input, ctx.organizationId);
    }),

  /**
   * page.delete - Delete page and all children
   * Auth: organizationProtectedProcedure
   */
  delete: organizationProtectedProcedure
    .input(deletePageSchema)
    .mutation(async ({ ctx, input }) => {
      const pageService = new PageService(ctx.db);
      await pageService.delete(input.id, ctx.organizationId);
      return { success: true };
    }),

  /**
   * page.move - Move page to new parent or reorder
   * Auth: organizationProtectedProcedure
   */
  move: organizationProtectedProcedure
    .input(movePageSchema)
    .mutation(async ({ ctx, input }) => {
      const pageService = new PageService(ctx.db);
      return pageService.move(input, ctx.organizationId);
    }),

  /**
   * page.get - Get single page with blocks
   * Auth: organizationProtectedProcedure
   */
  get: organizationProtectedProcedure
    .input(getPageSchema)
    .query(async ({ ctx, input }) => {
      const pageService = new PageService(ctx.db);
      return pageService.getWithBlocks(input.id, ctx.organizationId);
    }),

  /**
   * page.getTree - Get full page tree for deal sidebar
   * Auth: organizationProtectedProcedure
   */
  getTree: organizationProtectedProcedure
    .input(getPageTreeSchema)
    .query(async ({ ctx, input }) => {
      const pageService = new PageService(ctx.db);
      return pageService.getTree(input.dealId, ctx.organizationId);
    }),

  /**
   * page.getBacklinks - Get pages linking to this page
   * Auth: organizationProtectedProcedure
   */
  getBacklinks: organizationProtectedProcedure
    .input(getBacklinksSchema)
    .query(async ({ ctx, input }) => {
      const pageService = new PageService(ctx.db);
      return pageService.getBacklinks(input.pageId, ctx.organizationId);
    }),

  /**
   * page.getBreadcrumbs - Get breadcrumb navigation path
   * Auth: organizationProtectedProcedure
   */
  getBreadcrumbs: organizationProtectedProcedure
    .input(getBreadcrumbsSchema)
    .query(async ({ ctx, input }) => {
      const pageService = new PageService(ctx.db);
      return pageService.getBreadcrumbs(input.pageId, ctx.organizationId);
    }),

  /**
   * page.syncLinks - Update wiki links for a page
   * Auth: organizationProtectedProcedure
   * Called when page content is saved
   */
  syncLinks: organizationProtectedProcedure
    .input(syncPageLinksSchema)
    .mutation(async ({ ctx, input }) => {
      const pageService = new PageService(ctx.db);
      await pageService.syncLinks(input, ctx.organizationId);
      return { success: true };
    }),
});
