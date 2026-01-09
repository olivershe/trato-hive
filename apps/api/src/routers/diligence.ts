/**
 * Diligence Router
 *
 * tRPC router for AI-powered diligence Q&A using the DiligenceAgent.
 * All procedures use organizationProtectedProcedure for multi-tenancy.
 */
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, organizationProtectedProcedure } from '../trpc/init';
import {
  createDiligenceAgent,
  DiligenceAgentError,
} from '@trato-hive/agents';
import {
  createVectorStoreFromEnv,
  createEmbeddingServiceFromEnv,
} from '@trato-hive/semantic-layer';
import { createClaudeClient } from '@trato-hive/ai-core';

/**
 * Input schema for asking a question
 */
const askQuestionInputSchema = z.object({
  question: z.string().min(1).max(2000),
  companyId: z.string().cuid().optional(),
  dealId: z.string().cuid().optional(),
  documentIds: z.array(z.string().cuid()).optional(),
});

/**
 * Input schema for checking if a question can be answered
 */
const canAnswerInputSchema = z.object({
  question: z.string().min(1).max(2000),
  companyId: z.string().cuid().optional(),
  dealId: z.string().cuid().optional(),
});

/**
 * Input schema for generating a report
 */
const generateReportInputSchema = z.object({
  dealId: z.string().cuid(),
});

export const diligenceRouter = router({
  /**
   * diligence.askQuestion - Ask a question with RAG-based answer
   * Auth: organizationProtectedProcedure
   * Returns: Answer with citations (CitationBlock compatible)
   */
  askQuestion: organizationProtectedProcedure
    .input(askQuestionInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Create dependencies for the agent
        // Note: In production, these should be created once in context
        const vectorStore = createVectorStoreFromEnv();
        const embeddings = createEmbeddingServiceFromEnv();
        const apiKey = process.env.ANTHROPIC_API_KEY;

        if (!apiKey) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'ANTHROPIC_API_KEY not configured',
          });
        }

        const llmClient = createClaudeClient(apiKey);

        // Create the agent
        const agent = createDiligenceAgent({
          vectorStore,
          embeddings,
          llmClient,
          db: ctx.db,
        });

        // Execute the query
        const response = await agent.answerQuestion({
          question: input.question,
          organizationId: ctx.organizationId,
          companyId: input.companyId,
          dealId: input.dealId,
          documentIds: input.documentIds,
        });

        return response;
      } catch (error) {
        if (error instanceof DiligenceAgentError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error.message,
            cause: error,
          });
        }
        throw error;
      }
    }),

  /**
   * diligence.canAnswer - Check if a question can be answered
   * Auth: organizationProtectedProcedure
   * Returns: { canAnswer, relevantChunks, confidence }
   */
  canAnswer: organizationProtectedProcedure
    .input(canAnswerInputSchema)
    .query(async ({ ctx, input }) => {
      try {
        const vectorStore = createVectorStoreFromEnv();
        const embeddings = createEmbeddingServiceFromEnv();
        const apiKey = process.env.ANTHROPIC_API_KEY;

        if (!apiKey) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'ANTHROPIC_API_KEY not configured',
          });
        }

        const llmClient = createClaudeClient(apiKey);

        const agent = createDiligenceAgent({
          vectorStore,
          embeddings,
          llmClient,
          db: ctx.db,
        });

        return await agent.canAnswer({
          question: input.question,
          organizationId: ctx.organizationId,
          companyId: input.companyId,
          dealId: input.dealId,
        });
      } catch (error) {
        if (error instanceof DiligenceAgentError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error.message,
            cause: error,
          });
        }
        throw error;
      }
    }),

  /**
   * diligence.generateReport - Generate a comprehensive diligence report
   * Auth: organizationProtectedProcedure
   * Returns: Full diligence report with sections and citations
   */
  generateReport: organizationProtectedProcedure
    .input(generateReportInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const vectorStore = createVectorStoreFromEnv();
        const embeddings = createEmbeddingServiceFromEnv();
        const apiKey = process.env.ANTHROPIC_API_KEY;

        if (!apiKey) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'ANTHROPIC_API_KEY not configured',
          });
        }

        const llmClient = createClaudeClient(apiKey);

        const agent = createDiligenceAgent({
          vectorStore,
          embeddings,
          llmClient,
          db: ctx.db,
        });

        return await agent.generateReport(input.dealId, ctx.organizationId);
      } catch (error) {
        if (error instanceof DiligenceAgentError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error.message,
            cause: error,
          });
        }
        throw error;
      }
    }),
});
