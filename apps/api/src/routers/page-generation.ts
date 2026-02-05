/**
 * Page Generation Router
 *
 * [TASK-145] tRPC router for AI page generation.
 * Start/poll/cancel async generation jobs.
 */
import { z } from 'zod';
import { router, organizationProtectedProcedure } from '../trpc/init';
import { PageGenerationService } from '../services/page-generation.service';
import { createClaudeClient, createRAGService } from '@trato-hive/ai-core';
import {
  createEmbeddingServiceFromEnv,
  createVectorStoreFromEnv,
} from '@trato-hive/semantic-layer';

// =============================================================================
// Input Schemas
// =============================================================================

const startGenerationSchema = z.object({
  prompt: z.string().min(1).max(2000),
  template: z
    .enum(['dd-report', 'competitor-analysis', 'market-report', 'company-overview', 'custom'])
    .optional(),
  context: z
    .object({
      dealId: z.string().optional(),
      companyId: z.string().optional(),
      documentIds: z.array(z.string()).optional(),
    })
    .optional(),
  attachments: z
    .array(
      z.object({
        url: z.string(),
        name: z.string(),
        contentType: z.string(),
      })
    )
    .optional(),
  pageId: z.string(),
  dealId: z.string().optional(),
  enableWebSearch: z.boolean().optional(),
});

const pollProgressSchema = z.object({
  generationId: z.string(),
});

const cancelGenerationSchema = z.object({
  generationId: z.string(),
});

// =============================================================================
// Singleton Service (shared across requests for in-memory state)
// =============================================================================

let _service: PageGenerationService | null = null;

function getService(db: any): PageGenerationService {
  if (!_service) {
    const apiKey = process.env.ANTHROPIC_API_KEY || '';
    const llmClient = createClaudeClient(apiKey);
    const embeddings = createEmbeddingServiceFromEnv();
    const vectorStore = createVectorStoreFromEnv();

    _service = new PageGenerationService(db, {
      vectorStore,
      embeddings,
      llmClient,
    });
  }
  return _service;
}

// =============================================================================
// Router
// =============================================================================

export const pageGenerationRouter = router({
  /**
   * Start an async page generation job.
   * Returns a generationId to poll for progress.
   */
  startGeneration: organizationProtectedProcedure
    .input(startGenerationSchema)
    .mutation(async ({ ctx, input }) => {
      const service = getService(ctx.db);
      return service.startGeneration(
        {
          prompt: input.prompt,
          context: input.context,
          attachments: input.attachments,
          organizationId: ctx.organizationId,
          userId: ctx.session.user.id,
          pageId: input.pageId,
          dealId: input.dealId,
          enableWebSearch: input.enableWebSearch,
        },
        input.template
      );
    }),

  /**
   * Poll for generation progress.
   * Returns new events since the last poll.
   */
  pollProgress: organizationProtectedProcedure
    .input(pollProgressSchema)
    .query(async ({ ctx, input }) => {
      const service = getService(ctx.db);
      return service.getGenerationProgress(input.generationId);
    }),

  /**
   * Cancel an in-progress generation.
   */
  cancelGeneration: organizationProtectedProcedure
    .input(cancelGenerationSchema)
    .mutation(async ({ ctx, input }) => {
      const service = getService(ctx.db);
      return service.cancelGeneration(input.generationId);
    }),
});
