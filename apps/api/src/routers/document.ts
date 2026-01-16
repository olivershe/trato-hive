/**
 * Document Router
 *
 * tRPC router for document page operations and fact retrieval.
 * Complements the VDR router with page-specific functionality.
 *
 * [TASK-112] Document Page Template
 */
import { z } from 'zod';
import { router, organizationProtectedProcedure } from '../trpc/init';
import { DocumentService } from '../services/document.service';

// =============================================================================
// Input Schemas
// =============================================================================

const getWithPageInputSchema = z.object({
  documentId: z.string().min(1, 'Document ID is required'),
});

const getFactsInputSchema = z.object({
  documentId: z.string().min(1, 'Document ID is required'),
  limit: z.number().min(1).max(100).optional().default(50),
});

const createPageInputSchema = z.object({
  documentId: z.string().min(1, 'Document ID is required'),
});

// =============================================================================
// Router
// =============================================================================

export const documentRouter = router({
  /**
   * document.getWithPage - Get document with its associated page
   * Auth: organizationProtectedProcedure
   *
   * Returns document metadata along with the DOCUMENT_PAGE if it exists.
   * Used by the document detail page to load both document and page data.
   */
  getWithPage: organizationProtectedProcedure
    .input(getWithPageInputSchema)
    .query(async ({ ctx, input }) => {
      const service = new DocumentService(ctx.db);
      return service.getWithPage(input.documentId, ctx.organizationId);
    }),

  /**
   * document.getFacts - Get facts extracted from a document
   * Auth: organizationProtectedProcedure
   *
   * Returns facts in order: grouped by type, then by confidence.
   * Used by ExtractedFactsBlock to display document insights.
   */
  getFacts: organizationProtectedProcedure
    .input(getFactsInputSchema)
    .query(async ({ ctx, input }) => {
      const service = new DocumentService(ctx.db);
      return service.getFacts(input.documentId, ctx.organizationId, input.limit);
    }),

  /**
   * document.createPage - Create a document page
   * Auth: organizationProtectedProcedure
   *
   * Creates a DOCUMENT_PAGE with template blocks:
   * - DocumentViewerBlock
   * - Extracted Facts heading + block
   * - Q&A heading + QueryBlock
   *
   * If document doesn't have a dealId, creates a shadow deal.
   * Returns existing page if one already exists.
   */
  createPage: organizationProtectedProcedure
    .input(createPageInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new DocumentService(ctx.db);
      return service.createDocumentPage(
        input.documentId,
        ctx.organizationId,
        ctx.session.user.id
      );
    }),

  /**
   * document.ensurePage - Ensure document has a page, creating if needed
   * Auth: organizationProtectedProcedure
   *
   * Idempotent operation - safe to call multiple times.
   * Returns existing page or creates new one.
   */
  ensurePage: organizationProtectedProcedure
    .input(createPageInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new DocumentService(ctx.db);
      return service.ensureDocumentPage(
        input.documentId,
        ctx.organizationId,
        ctx.session.user.id
      );
    }),
});
