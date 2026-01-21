/**
 * Coworker Router
 *
 * tRPC router for Hive Copilot - the AI co-worker that can execute CRM actions.
 * All procedures use organizationProtectedProcedure for multi-tenancy.
 */
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import type { Prisma } from '@trato-hive/db';
import { router, organizationProtectedProcedure } from '../trpc/init';
import {
  coworkerChatInputSchema,
  getConversationInputSchema,
  listConversationsInputSchema,
} from '@trato-hive/shared';

// Type for stored conversation messages
export interface StoredMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  executedActions?: Array<{
    tool: string;
    input: Record<string, unknown>;
    result: { success: boolean; message: string; data?: unknown };
  }>;
}

// Type for stored conversation context
export interface StoredContext {
  dealId?: string;
  companyId?: string;
}

// Type alias for conversation message used in agent
type AgentMessage =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string };

export const coworkerRouter = router({
  /**
   * coworker.chat - Send a message to the Hive Copilot
   * Auth: organizationProtectedProcedure
   * Returns: Agent response with executed actions
   */
  chat: organizationProtectedProcedure
    .input(coworkerChatInputSchema)
    .mutation(async ({ ctx, input }) => {
      // Dynamic imports to handle modules without type declarations
      const { createActionAgent, ActionAgentError } = await import('@trato-hive/agents');
      const { createClaudeClient } = await import('@trato-hive/ai-core');

      try {
        // Validate API key
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'ANTHROPIC_API_KEY not configured',
          });
        }

        // Get or create conversation
        let conversation = null;
        let previousMessages: AgentMessage[] = [];

        if (input.conversationId) {
          conversation = await ctx.db.coworkerConversation.findFirst({
            where: {
              id: input.conversationId,
              organizationId: ctx.organizationId,
              userId: ctx.session.user.id,
            },
          });

          if (conversation) {
            // Build previous messages for context
            const storedMessages = conversation.messages as unknown as StoredMessage[];
            previousMessages = (storedMessages || []).map((m) => ({
              role: m.role,
              content: m.content,
            }));
          }
        }

        // Create the action agent
        const llmClient = createClaudeClient(apiKey);
        const agent = createActionAgent({
          llmClient,
          db: ctx.db,
          // Note: vectorStore and embeddings are optional
        });

        // Execute the chat
        const response = await agent.chat(
          input.message,
          {
            organizationId: ctx.organizationId,
            userId: ctx.session.user.id,
            dealId: input.context?.dealId,
            companyId: input.context?.companyId,
          },
          previousMessages
        );

        // Build new messages array
        const existingMessages = conversation
          ? (conversation.messages as unknown as StoredMessage[])
          : [];
        const newMessages: StoredMessage[] = [
          ...existingMessages,
          {
            role: 'user',
            content: input.message,
            timestamp: new Date().toISOString(),
          },
          {
            role: 'assistant',
            content: response.message,
            timestamp: new Date().toISOString(),
            executedActions: response.executedActions,
          },
        ];

        // Generate title from first message if new conversation
        const title = !conversation
          ? input.message.slice(0, 100) + (input.message.length > 100 ? '...' : '')
          : conversation.title;

        if (conversation) {
          // Update existing conversation
          await ctx.db.coworkerConversation.update({
            where: { id: conversation.id },
            data: {
              messages: newMessages as unknown as Prisma.InputJsonValue,
              updatedAt: new Date(),
            },
          });
        } else {
          // Create new conversation
          conversation = await ctx.db.coworkerConversation.create({
            data: {
              organizationId: ctx.organizationId,
              userId: ctx.session.user.id,
              title,
              messages: newMessages as unknown as Prisma.InputJsonValue,
              context: (input.context || null) as unknown as Prisma.InputJsonValue,
            },
          });
        }

        return {
          message: response.message,
          executedActions: response.executedActions,
          conversationId: conversation.id,
          metadata: response.metadata,
        };
      } catch (error: unknown) {
        // Check if this is an ActionAgentError
        if (
          error instanceof Error &&
          error.name === 'ActionAgentError'
        ) {
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
   * coworker.getConversation - Get a conversation by ID
   * Auth: organizationProtectedProcedure
   * Returns: Conversation with messages
   */
  getConversation: organizationProtectedProcedure
    .input(getConversationInputSchema)
    .query(async ({ ctx, input }) => {
      const conversation = await ctx.db.coworkerConversation.findFirst({
        where: {
          id: input.conversationId,
          organizationId: ctx.organizationId,
          userId: ctx.session.user.id,
        },
      });

      if (!conversation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Conversation not found',
        });
      }

      return {
        id: conversation.id,
        title: conversation.title,
        messages: conversation.messages as unknown as StoredMessage[],
        context: conversation.context as unknown as StoredContext | null,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      };
    }),

  /**
   * coworker.listConversations - List recent conversations
   * Auth: organizationProtectedProcedure
   * Returns: List of conversations (without full message history)
   */
  listConversations: organizationProtectedProcedure
    .input(listConversationsInputSchema)
    .query(async ({ ctx, input }) => {
      const conversations = await ctx.db.coworkerConversation.findMany({
        where: {
          organizationId: ctx.organizationId,
          userId: ctx.session.user.id,
        },
        orderBy: { updatedAt: 'desc' },
        take: input.limit,
        ...(input.cursor && {
          cursor: { id: input.cursor },
          skip: 1,
        }),
        select: {
          id: true,
          title: true,
          context: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return {
        conversations: conversations.map((c) => ({
          id: c.id,
          title: c.title,
          context: c.context as unknown as StoredContext | null,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        })),
        nextCursor:
          conversations.length === input.limit
            ? conversations[conversations.length - 1]?.id
            : undefined,
      };
    }),

  /**
   * coworker.deleteConversation - Delete a conversation
   * Auth: organizationProtectedProcedure
   */
  deleteConversation: organizationProtectedProcedure
    .input(z.object({ conversationId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const conversation = await ctx.db.coworkerConversation.findFirst({
        where: {
          id: input.conversationId,
          organizationId: ctx.organizationId,
          userId: ctx.session.user.id,
        },
      });

      if (!conversation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Conversation not found',
        });
      }

      await ctx.db.coworkerConversation.delete({
        where: { id: input.conversationId },
      });

      return { success: true };
    }),
});
