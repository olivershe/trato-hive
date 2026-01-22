/**
 * Custom Agent Executor
 *
 * Executes user-defined custom AI agents with file attachments.
 * Supports template variable interpolation and multimodal input.
 *
 * [TASK-128] Custom Agents Database + File Attachments
 */
import { z } from 'zod';
import type {
  StreamingService,
  FileAttachment,
  StreamOptions,
  StreamResult,
} from '@trato-hive/ai-core';
import type { AgentOutputFormat, AgentExecutionResult } from '@trato-hive/shared';

// =============================================================================
// Types & Configuration
// =============================================================================

export const customAgentConfigSchema = z.object({
  /** Maximum tokens for response */
  maxTokens: z.number().default(4000),
  /** Temperature for generation (0-1) */
  temperature: z.number().min(0).max(1).default(0.3),
});

export type CustomAgentConfig = z.infer<typeof customAgentConfigSchema>;

export interface CustomAgentDependencies {
  streaming: StreamingService;
}

/**
 * Agent definition from database
 */
export interface CustomAgentDefinition {
  id: string;
  name: string;
  promptTemplate: string;
  outputFormat: AgentOutputFormat;
}

/**
 * Context for template variable interpolation
 */
export interface AgentExecutionContext {
  deal?: {
    id: string;
    name: string;
    stage: string;
    value: string | null;
    currency: string;
    industry: string | null;
  };
  company?: {
    id: string;
    name: string;
    industry: string | null;
  };
  documents: {
    id: string;
    name: string;
    url: string;
    contentType: string;
  }[];
  user: {
    name: string;
  };
}

/**
 * Input for agent execution
 */
export interface CustomAgentInput {
  agent: CustomAgentDefinition;
  context: AgentExecutionContext;
  userPrompt?: string;
  attachments?: FileAttachment[];
}

// =============================================================================
// Custom Agent Executor Class
// =============================================================================

export class CustomAgentExecutor {
  private readonly config: CustomAgentConfig;
  private readonly deps: CustomAgentDependencies;

  constructor(
    deps: CustomAgentDependencies,
    config: Partial<CustomAgentConfig> = {}
  ) {
    this.deps = deps;
    this.config = customAgentConfigSchema.parse(config);
  }

  /**
   * Execute a custom agent with the given context and attachments
   * Returns the full response content
   */
  async execute(input: CustomAgentInput): Promise<AgentExecutionResult> {
    const startTime = Date.now();

    // 1. Build the system prompt with interpolated variables
    const systemPrompt = this.interpolateTemplate(
      input.agent.promptTemplate,
      input.context
    );

    // 2. Build the user message
    const userMessage = this.buildUserMessage(input);

    // 3. Prepare stream options with attachments
    const streamOptions: StreamOptions = {
      systemPrompt,
      maxTokens: this.config.maxTokens,
      temperature: this.config.temperature,
      attachments: input.attachments,
    };

    // 4. Collect the streamed response
    let content = '';
    let tokensUsed = {
      prompt: 0,
      completion: 0,
      total: 0,
    };

    for await (const chunk of this.deps.streaming.streamChat(
      [{ role: 'user', content: userMessage }],
      {
        ...streamOptions,
        onFinish: (result: StreamResult) => {
          tokensUsed = result.tokensUsed;
        },
      }
    )) {
      content += chunk;
    }

    // 5. Format the response based on output format
    const formattedContent = this.formatOutput(content, input.agent.outputFormat);

    return {
      content: formattedContent,
      format: input.agent.outputFormat,
      attachmentsUsed: input.attachments?.length ?? 0,
      tokensUsed,
      processingTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Stream the agent execution, yielding chunks as they arrive
   * Use this for real-time UI updates
   */
  async *stream(input: CustomAgentInput): AsyncGenerator<string> {
    const systemPrompt = this.interpolateTemplate(
      input.agent.promptTemplate,
      input.context
    );

    const userMessage = this.buildUserMessage(input);

    const streamOptions: StreamOptions = {
      systemPrompt,
      maxTokens: this.config.maxTokens,
      temperature: this.config.temperature,
      attachments: input.attachments,
    };

    for await (const chunk of this.deps.streaming.streamChat(
      [{ role: 'user', content: userMessage }],
      streamOptions
    )) {
      yield chunk;
    }
  }

  /**
   * Interpolate template variables with context values
   */
  private interpolateTemplate(
    template: string,
    context: AgentExecutionContext
  ): string {
    const now = new Date();

    const variables: Record<string, string> = {
      '{{dealName}}': context.deal?.name ?? 'Unknown Deal',
      '{{companyName}}': context.company?.name ?? 'Unknown Company',
      '{{industry}}': context.deal?.industry ?? context.company?.industry ?? 'Not specified',
      '{{stage}}': context.deal?.stage ?? 'Not specified',
      '{{dealValue}}': context.deal?.value
        ? `${context.deal.currency} ${context.deal.value}`
        : 'Not specified',
      '{{documentCount}}': context.documents.length.toString(),
      '{{documentList}}': context.documents.map(d => d.name).join(', ') || 'No documents',
      '{{userName}}': context.user.name,
      '{{date}}': now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    };

    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
    }

    return result;
  }

  /**
   * Build the user message content
   */
  private buildUserMessage(input: CustomAgentInput): string {
    const parts: string[] = [];

    // Add user's additional prompt if provided
    if (input.userPrompt) {
      parts.push(input.userPrompt);
    } else {
      parts.push('Execute the analysis based on the provided context and documents.');
    }

    // Add document context
    if (input.context.documents.length > 0) {
      parts.push('\n\nAttached documents:');
      for (const doc of input.context.documents) {
        parts.push(`- ${doc.name} (${doc.contentType})`);
      }
    }

    // Add deal context if available
    if (input.context.deal) {
      parts.push(`\n\nDeal Context:`);
      parts.push(`- Deal: ${input.context.deal.name}`);
      parts.push(`- Stage: ${input.context.deal.stage}`);
      if (input.context.deal.value) {
        parts.push(`- Value: ${input.context.deal.currency} ${input.context.deal.value}`);
      }
    }

    return parts.join('\n');
  }

  /**
   * Format output based on the specified format
   * Note: The model is instructed in the prompt template to output in the correct format
   * This method ensures consistent structure
   */
  private formatOutput(content: string, format: AgentOutputFormat): string {
    // For most formats, the model should already output correctly based on the prompt
    // We just do basic cleanup here
    switch (format) {
      case 'TABLE':
        // Ensure markdown table format
        if (!content.includes('|')) {
          // If no table found, wrap in a simple table format
          return `| Analysis |\n|---|\n${content.split('\n').map(line => `| ${line.trim()} |`).join('\n')}`;
        }
        return content;

      case 'BULLETS':
        // Ensure bullet points
        if (!content.includes('- ') && !content.includes('* ')) {
          return content.split('\n').filter(Boolean).map(line => `- ${line.trim()}`).join('\n');
        }
        return content;

      case 'JSON':
        // Try to extract JSON if present
        const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
        if (jsonMatch) {
          return jsonMatch[1].trim();
        }
        // Try to parse as-is
        try {
          JSON.parse(content);
          return content;
        } catch {
          // Wrap non-JSON content
          return JSON.stringify({ result: content });
        }

      case 'SUMMARY':
      case 'FREEFORM':
      default:
        return content;
    }
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a custom agent executor with dependencies
 */
export function createCustomAgentExecutor(
  deps: CustomAgentDependencies,
  config?: Partial<CustomAgentConfig>
): CustomAgentExecutor {
  return new CustomAgentExecutor(deps, config);
}
