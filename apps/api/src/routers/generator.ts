/**
 * Generator Router
 *
 * tRPC router for document export (PPTX/DOCX) operations.
 */
import { router, organizationProtectedProcedure } from '../trpc/init'
import { exportPageInputSchema } from '@trato-hive/shared'
import { GeneratorService } from '../services/generator.service'

export const generatorRouter = router({
  /**
   * Export a page to PPTX or DOCX format
   *
   * Input:
   * - pageId: CUID of the page to export
   * - format: 'pptx' or 'docx'
   * - options: Optional export settings
   *
   * Returns:
   * - data: Base64-encoded file content
   * - filename: Suggested filename with extension
   * - mimeType: MIME type for the file
   * - pageTitle: Title of the exported page
   * - blockCount: Number of blocks exported
   * - citationCount: Number of citations included
   */
  exportPage: organizationProtectedProcedure
    .input(exportPageInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new GeneratorService(ctx.db)

      const result = await service.exportPage(
        input.pageId,
        input.format,
        ctx.organizationId,
        input.options ?? undefined
      )

      // Return base64-encoded data for direct download
      return {
        data: result.buffer.toString('base64'),
        filename: result.filename,
        mimeType: result.mimeType,
        pageTitle: result.pageTitle,
        blockCount: result.blockCount,
        citationCount: result.citationCount,
      }
    }),
})
