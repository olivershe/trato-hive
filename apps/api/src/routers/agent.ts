/**
 * Agent Router - tRPC router for custom AI agent operations
 * [TASK-128] Custom Agents Database + File Attachments
 */
import { router, organizationProtectedProcedure } from '../trpc/init'
import { AgentService } from '../services/agent.service'
import {
  createAgentSchema,
  updateAgentSchema,
  getAgentSchema,
  deleteAgentSchema,
  listAgentsSchema,
  searchAgentsSchema,
  executeAgentSchema,
} from '@trato-hive/shared'
import { createCustomAgentExecutor } from '@trato-hive/agents'
import { createClaudeStreamingService } from '@trato-hive/ai-core'
import { createStorageClientFromEnv } from '@trato-hive/data-plane'

function createAgentService(ctx: { db: any }) {
  return new AgentService(ctx.db)
}

export const agentRouter = router({
  /**
   * Create a new custom agent
   */
  create: organizationProtectedProcedure
    .input(createAgentSchema)
    .mutation(({ ctx, input }) =>
      createAgentService(ctx).create(input, ctx.session.user.id, ctx.organizationId)
    ),

  /**
   * Get a single agent by ID
   */
  get: organizationProtectedProcedure
    .input(getAgentSchema)
    .query(({ ctx, input }) =>
      createAgentService(ctx).getById(input.id, ctx.organizationId)
    ),

  /**
   * Update an existing agent
   */
  update: organizationProtectedProcedure
    .input(updateAgentSchema)
    .mutation(({ ctx, input }) =>
      createAgentService(ctx).update(input, ctx.organizationId)
    ),

  /**
   * Delete an agent (system agents cannot be deleted)
   */
  delete: organizationProtectedProcedure
    .input(deleteAgentSchema)
    .mutation(async ({ ctx, input }) => {
      await createAgentService(ctx).delete(input.id, ctx.organizationId)
      return { success: true }
    }),

  /**
   * List agents with filtering and pagination
   */
  list: organizationProtectedProcedure
    .input(listAgentsSchema)
    .query(({ ctx, input }) =>
      createAgentService(ctx).list(input, ctx.organizationId)
    ),

  /**
   * Search agents for slash command autocomplete
   */
  search: organizationProtectedProcedure
    .input(searchAgentsSchema)
    .query(({ ctx, input }) =>
      createAgentService(ctx).search(input, ctx.organizationId)
    ),

  /**
   * Execute an agent with optional file attachments
   * Uses CustomAgentExecutor to call the AI with the agent's prompt template
   */
  execute: organizationProtectedProcedure
    .input(executeAgentSchema)
    .mutation(async ({ ctx, input }) => {
      const service = createAgentService(ctx)

      // Get agent
      const agent = await service.getById(input.agentId, ctx.organizationId)

      if (!agent.isActive) {
        throw new Error('Agent is not active')
      }

      // Get execution context (deal, company, documents)
      const context = await service.getExecutionContext(
        input.context,
        input.documentIds,
        ctx.organizationId
      )

      // Get current user for template interpolation
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { name: true },
      })

      // Track execution
      await service.trackExecution(agent.id)

      // Combine attachments from direct upload and selected documents
      const allAttachments = [
        ...(input.attachments ?? []),
        ...context.documents.map(d => ({
          url: d.url,
          contentType: d.contentType,
          name: d.name,
        })),
      ]

      // Resolve S3 keys to signed URLs for attachments
      // S3 keys don't start with http, so we need to convert them to presigned URLs
      const storageClient = createStorageClientFromEnv()
      const resolvedAttachments = await Promise.all(
        allAttachments.map(async (attachment) => {
          // If it's already a full URL, use it as-is
          if (attachment.url.startsWith('http://') || attachment.url.startsWith('https://')) {
            return attachment
          }
          // Otherwise, it's an S3 key - generate a presigned URL
          const signedUrl = await storageClient.getPresignedUrl(attachment.url, 3600) // 1 hour expiry
          return {
            ...attachment,
            url: signedUrl,
          }
        })
      )

      // Create the streaming service and executor
      const streaming = createClaudeStreamingService()
      const executor = createCustomAgentExecutor({ streaming })

      console.log('[Agent Execute] Starting execution for agent:', agent.name)
      console.log('[Agent Execute] Attachments count:', resolvedAttachments.length)

      try {
        // Execute the agent with the AI
        const result = await executor.execute({
          agent: {
            id: agent.id,
            name: agent.name,
            promptTemplate: agent.promptTemplate,
            outputFormat: agent.outputFormat,
          },
          context: {
            deal: context.deal ? {
              id: context.deal.id,
              name: context.deal.name,
              stage: context.deal.stage,
              value: context.deal.value?.toString() ?? null,
              currency: context.deal.currency ?? 'USD',
              industry: context.deal.industry ?? null,
            } : undefined,
            company: context.company ? {
              id: context.company.id,
              name: context.company.name,
              industry: context.company.industry ?? null,
            } : undefined,
            documents: context.documents,
            user: {
              name: user?.name ?? 'Unknown',
            },
          },
          userPrompt: input.userPrompt,
          attachments: resolvedAttachments,
        })

        console.log('[Agent Execute] Result content length:', result.content.length)
        console.log('[Agent Execute] Tokens used:', result.tokensUsed)

        if (!result.content) {
          throw new Error('No output generated. Check the stream for errors.')
        }

        return {
          content: result.content,
          format: result.format,
          attachmentsUsed: result.attachmentsUsed,
          tokensUsed: result.tokensUsed,
          processingTimeMs: result.processingTimeMs,
        }
      } catch (error) {
        console.error('[Agent Execute] Error:', error)
        throw error
      }
    }),

  /**
   * Get agent by slug (for direct lookup)
   */
  getBySlug: organizationProtectedProcedure
    .input(searchAgentsSchema.pick({ query: true }))
    .query(({ ctx, input }) =>
      createAgentService(ctx).getBySlug(input.query, ctx.organizationId)
    ),
})
