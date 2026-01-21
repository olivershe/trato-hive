/**
 * Action Agent
 *
 * Tool-calling AI agent for executing CRM actions via natural language.
 * Part of the Hive Copilot feature.
 */
import { z } from 'zod';
import type { PrismaClient } from '@trato-hive/db';
import {
  type LLMClient,
  type LLMToolResponse,
  type ToolResult,
  type AssistantContent,
  type ConversationMessage,
} from '@trato-hive/ai-core';

// Re-export types from search-tools for consistency
import type { SearchToolDeps } from './tools/search-tools';

import {
  ALL_TOOLS,
  executeUpdateDeal,
  executeCreateDeal,
  executeGetDealSummary,
  executeUpdateCompany,
  executeCreateCompany,
  executeSearchDeals,
  executeSearchKnowledge,
  executeCreateTask,
} from './tools';

// =============================================================================
// Configuration
// =============================================================================

export const actionAgentConfigSchema = z.object({
  /** Maximum tokens for LLM response */
  maxTokens: z.number().default(2000),
  /** LLM temperature */
  temperature: z.number().default(0.3),
  /** Maximum tool execution rounds */
  maxToolRounds: z.number().default(5),
  /** Always require confirmation before executing actions */
  requireConfirmation: z.boolean().default(true),
});

export type ActionAgentConfig = z.infer<typeof actionAgentConfigSchema>;

// =============================================================================
// Types
// =============================================================================

export interface ActionAgentDependencies extends Omit<SearchToolDeps, 'db'> {
  llmClient: LLMClient;
  db: PrismaClient;
}

export interface ActionContext {
  organizationId: string;
  userId: string;
  dealId?: string;
  companyId?: string;
}

export interface ActionResponse {
  /** Text response from the agent */
  message: string;
  /** Actions that were executed */
  executedActions: ExecutedAction[];
  /** Actions pending confirmation */
  pendingActions?: PendingAction[];
  /** Metadata about the response */
  metadata: ActionMetadata;
}

export interface ExecutedAction {
  tool: string;
  input: Record<string, unknown>;
  result: { success: boolean; message: string; data?: unknown };
}

export interface PendingAction {
  id: string;
  tool: string;
  input: Record<string, unknown>;
  description: string;
}

export interface ActionMetadata {
  toolCallCount: number;
  totalTokens: number;
  totalCost: number;
  processingTimeMs: number;
}

// =============================================================================
// Action Agent Class
// =============================================================================

export class ActionAgent {
  private readonly config: ActionAgentConfig;
  private readonly deps: ActionAgentDependencies;

  constructor(
    deps: ActionAgentDependencies,
    config: Partial<ActionAgentConfig> = {}
  ) {
    this.deps = deps;
    this.config = actionAgentConfigSchema.parse(config);
  }

  /**
   * Process a chat message and execute any required actions
   */
  async chat(
    userMessage: string,
    context: ActionContext,
    previousMessages: ConversationMessage[] = []
  ): Promise<ActionResponse> {
    const startTime = Date.now();
    const executedActions: ExecutedAction[] = [];
    let totalTokens = 0;
    let totalCost = 0;
    let toolCallCount = 0;

    // Build initial messages
    const messages: ConversationMessage[] = [
      ...previousMessages,
      { role: 'user', content: userMessage },
    ];

    // System prompt with context
    const systemPrompt = this.buildSystemPrompt(context);

    // Initial LLM call with tools
    let response = await this.deps.llmClient.generateWithTools({
      messages,
      tools: ALL_TOOLS,
      systemPrompt,
      maxTokens: this.config.maxTokens,
      temperature: this.config.temperature,
      tool_choice: 'auto',
    });

    totalTokens += response.tokensUsed.total;
    totalCost += response.cost;

    // Tool execution loop
    let rounds = 0;
    while (response.stopReason === 'tool_use' && rounds < this.config.maxToolRounds) {
      rounds++;
      toolCallCount += response.toolCalls?.length || 0;

      // Execute tools
      const toolResults = await this.executeTools(
        response.toolCalls || [],
        context,
        executedActions
      );

      // Build assistant content from response
      const assistantContent = this.buildAssistantContent(response);

      // Continue conversation with tool results
      response = await this.deps.llmClient.continueWithToolResults(
        messages,
        assistantContent,
        toolResults,
        {
          tools: ALL_TOOLS,
          systemPrompt,
          maxTokens: this.config.maxTokens,
          temperature: this.config.temperature,
          tool_choice: 'auto',
        }
      );

      totalTokens += response.tokensUsed.total;
      totalCost += response.cost;
    }

    return {
      message: response.content || 'I was unable to generate a response.',
      executedActions,
      metadata: {
        toolCallCount,
        totalTokens,
        totalCost,
        processingTimeMs: Date.now() - startTime,
      },
    };
  }

  /**
   * Execute tools and return results
   */
  private async executeTools(
    toolCalls: Array<{ id: string; name: string; input: Record<string, unknown> }>,
    context: ActionContext,
    executedActions: ExecutedAction[]
  ): Promise<ToolResult[]> {
    const results: ToolResult[] = [];

    for (const call of toolCalls) {
      try {
        const result = await this.executeTool(call.name, call.input, context);

        executedActions.push({
          tool: call.name,
          input: call.input,
          result,
        });

        results.push({
          tool_use_id: call.id,
          content: JSON.stringify(result),
          is_error: !result.success,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        executedActions.push({
          tool: call.name,
          input: call.input,
          result: { success: false, message: errorMessage },
        });

        results.push({
          tool_use_id: call.id,
          content: JSON.stringify({ success: false, message: errorMessage }),
          is_error: true,
        });
      }
    }

    return results;
  }

  /**
   * Execute a single tool
   */
  private async executeTool(
    toolName: string,
    input: Record<string, unknown>,
    context: ActionContext
  ): Promise<{ success: boolean; message: string; data?: unknown }> {
    const toolContext = {
      organizationId: context.organizationId,
      userId: context.userId,
    };

    const searchDeps = {
      db: this.deps.db,
      vectorStore: this.deps.vectorStore,
      embeddings: this.deps.embeddings,
    };

    switch (toolName) {
      // Deal tools
      case 'update_deal':
        return executeUpdateDeal(this.deps.db, input as Parameters<typeof executeUpdateDeal>[1], toolContext);
      case 'create_deal':
        return executeCreateDeal(this.deps.db, input as Parameters<typeof executeCreateDeal>[1], toolContext);
      case 'get_deal_summary':
        return executeGetDealSummary(this.deps.db, input as Parameters<typeof executeGetDealSummary>[1], toolContext);

      // Company tools
      case 'update_company':
        return executeUpdateCompany(this.deps.db, input as Parameters<typeof executeUpdateCompany>[1], toolContext);
      case 'create_company':
        return executeCreateCompany(this.deps.db, input as Parameters<typeof executeCreateCompany>[1], toolContext);

      // Search tools
      case 'search_deals':
        return executeSearchDeals(searchDeps, input as Parameters<typeof executeSearchDeals>[1], toolContext);
      case 'search_knowledge':
        return executeSearchKnowledge(searchDeps, input as Parameters<typeof executeSearchKnowledge>[1], toolContext);
      case 'create_task':
        return executeCreateTask(searchDeps, input as Parameters<typeof executeCreateTask>[1], toolContext);

      default:
        return {
          success: false,
          message: `Unknown tool: ${toolName}`,
        };
    }
  }

  /**
   * Build system prompt with context
   */
  private buildSystemPrompt(context: ActionContext): string {
    let contextInfo = '';

    if (context.dealId) {
      contextInfo += `\nCurrent deal context: Deal ID ${context.dealId}`;
    }
    if (context.companyId) {
      contextInfo += `\nCurrent company context: Company ID ${context.companyId}`;
    }

    return `You are Hive Copilot, an AI assistant for an M&A CRM platform called Trato Hive. You help users manage deals, companies, documents, and tasks through natural language.

Your capabilities:
- Create and update deals and companies
- Search for deals and knowledge in the database
- Create tasks and reminders
- Answer questions about deals using the knowledge base

Guidelines:
1. Be concise and professional in your responses.
2. When taking actions that modify data (create, update), always confirm what you did.
3. Use the search tools to find information before making assumptions.
4. If you're unsure about a request, ask for clarification.
5. Always respect data access boundaries - you can only access data within the user's organization.
${contextInfo}

Organization ID: ${context.organizationId}
User ID: ${context.userId}`;
  }

  /**
   * Build assistant content from LLM response
   */
  private buildAssistantContent(response: LLMToolResponse): AssistantContent[] {
    const content: AssistantContent[] = [];

    // Add text if present
    if (response.content) {
      content.push({ type: 'text', text: response.content });
    }

    // Add tool calls
    if (response.toolCalls) {
      for (const call of response.toolCalls) {
        content.push({
          type: 'tool_use',
          id: call.id,
          name: call.name,
          input: call.input,
        });
      }
    }

    return content;
  }
}

// =============================================================================
// Error Class
// =============================================================================

export type ActionAgentErrorCode =
  | 'CONFIG_ERROR'
  | 'TOOL_EXECUTION_ERROR'
  | 'LLM_ERROR'
  | 'CONTEXT_ERROR'
  | 'UNKNOWN';

export class ActionAgentError extends Error {
  constructor(
    message: string,
    public readonly code: ActionAgentErrorCode,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'ActionAgentError';
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create an action agent with dependencies
 */
export function createActionAgent(
  deps: ActionAgentDependencies,
  config?: Partial<ActionAgentConfig>
): ActionAgent {
  return new ActionAgent(deps, config);
}
