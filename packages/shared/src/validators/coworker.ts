/**
 * Coworker (Hive Copilot) Validators
 *
 * Zod schemas for Coworker chat API.
 */
import { z } from 'zod';

// =============================================================================
// Input Schemas
// =============================================================================

/**
 * Chat message input schema
 */
export const coworkerChatInputSchema = z.object({
  message: z.string().min(1, 'Message is required').max(5000, 'Message too long'),
  conversationId: z.string().cuid().optional(),
  context: z
    .object({
      dealId: z.string().cuid().optional(),
      companyId: z.string().cuid().optional(),
    })
    .optional(),
});

/**
 * Get conversation input schema
 */
export const getConversationInputSchema = z.object({
  conversationId: z.string().cuid(),
});

/**
 * List conversations input schema
 */
export const listConversationsInputSchema = z.object({
  limit: z.number().int().positive().max(50).default(20),
  cursor: z.string().cuid().optional(),
});

// =============================================================================
// Output Schemas (for documentation/validation)
// =============================================================================

/**
 * UI Block schema — describes an interactive component to render inline
 */
export const uiBlockSchema = z.object({
  component: z.string(),
  props: z.record(z.unknown()),
  initialState: z.record(z.unknown()).optional(),
  layout: z.enum(['inline', 'full-width']).optional(),
});

/**
 * Executed action schema
 */
export const executedActionSchema = z.object({
  tool: z.string(),
  input: z.record(z.unknown()),
  result: z.object({
    success: z.boolean(),
    message: z.string(),
    data: z.unknown().optional(),
    ui: uiBlockSchema.optional(),
  }),
});

/**
 * Chat response schema
 */
export const coworkerChatResponseSchema = z.object({
  message: z.string(),
  executedActions: z.array(executedActionSchema),
  conversationId: z.string().cuid(),
  metadata: z.object({
    toolCallCount: z.number(),
    totalTokens: z.number(),
    totalCost: z.number(),
    processingTimeMs: z.number(),
  }),
});

/**
 * Conversation message schema
 */
export const conversationMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  timestamp: z.string().datetime(),
  executedActions: z.array(executedActionSchema).optional(),
});

/**
 * Conversation schema
 */
export const conversationSchema = z.object({
  id: z.string().cuid(),
  title: z.string().optional().nullable(),
  messages: z.array(conversationMessageSchema),
  context: z
    .object({
      dealId: z.string().cuid().optional(),
      companyId: z.string().cuid().optional(),
    })
    .optional()
    .nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// =============================================================================
// Type Exports
// =============================================================================

export type CoworkerChatInput = z.infer<typeof coworkerChatInputSchema>;
export type GetConversationInput = z.infer<typeof getConversationInputSchema>;
export type ListConversationsInput = z.infer<typeof listConversationsInputSchema>;
export type ExecutedAction = z.infer<typeof executedActionSchema>;
export type CoworkerChatResponse = z.infer<typeof coworkerChatResponseSchema>;
export type ConversationMessage = z.infer<typeof conversationMessageSchema>;
export type Conversation = z.infer<typeof conversationSchema>;
