/**
 * LLM Client Service
 *
 * Production-ready LLM client with retry logic, cost tracking, and error handling.
 * Supports Claude (primary) and OpenAI/Kimi (fallback).
 */
import Anthropic from '@anthropic-ai/sdk';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { z } from 'zod';

import {
  type LLMConfig,
  type LLMResponse,
  type LLMGenerateOptions,
  type LLMStreamOptions,
  type LLMStreamChunk,
  type LLMStreamResult,
  type LLMToolGenerateOptions,
  type LLMToolResponse,
  type TokenUsage,
  type RetryConfig,
  type ToolCall,
  type ToolResult,
  type ConversationMessage,
  type AssistantContent,
  LLMError,
  calculateCost,
  DEFAULT_RETRY_CONFIG,
  llmConfigSchema,
} from './types';

// =============================================================================
// LLM Client Class
// =============================================================================

export class LLMClient {
  private claude?: Anthropic;
  private langchainModel?: ChatOpenAI;
  private readonly config: LLMConfig;
  private readonly retryConfig: RetryConfig;

  constructor(config: LLMConfig, retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG) {
    // Validate config
    const validated = llmConfigSchema.parse(config);
    this.config = validated;
    this.retryConfig = retryConfig;

    if (validated.provider === 'claude') {
      this.claude = new Anthropic({
        apiKey: validated.apiKey,
      });
    } else if (validated.provider === 'openai' || validated.provider === 'kimi') {
      this.langchainModel = new ChatOpenAI({
        modelName: validated.model || 'gpt-4-turbo',
        openAIApiKey: validated.apiKey,
      });
    }
  }

  /**
   * Generate completion with retry logic and full response metadata
   */
  async generate(prompt: string, options: LLMGenerateOptions = {}): Promise<LLMResponse> {
    const maxRetries = options.maxRetries ?? this.retryConfig.maxRetries;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const startTime = Date.now();

        if (this.config.provider === 'claude') {
          return await this.generateClaude(prompt, options, startTime);
        } else {
          return await this.generateLangChain(prompt, options, startTime);
        }
      } catch (error) {
        lastError = error as Error;
        const llmError = this.classifyError(error as Error);

        // Don't retry non-retryable errors
        if (!llmError.retryable || attempt === maxRetries) {
          throw llmError;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.retryConfig.initialDelayMs * Math.pow(this.retryConfig.backoffMultiplier, attempt),
          this.retryConfig.maxDelayMs
        );

        await this.sleep(delay);
      }
    }

    throw new LLMError(
      `Failed after ${maxRetries + 1} attempts: ${lastError?.message}`,
      'UNKNOWN',
      this.config.provider,
      false,
      lastError
    );
  }

  /**
   * Stream completion with retry logic, yielding text chunks as they arrive.
   * Returns a final LLMStreamResult with token usage after the generator completes.
   *
   * Usage:
   *   const stream = llm.streamGenerate(prompt, options);
   *   for await (const chunk of stream) { process(chunk.text); }
   *   // After loop, stream.result contains token usage
   */
  async *streamGenerate(
    prompt: string,
    options: LLMStreamOptions = {}
  ): AsyncGenerator<LLMStreamChunk, LLMStreamResult> {
    if (this.config.provider !== 'claude') {
      throw new LLMError(
        'Streaming is only supported with Claude provider',
        'INVALID_REQUEST',
        this.config.provider
      );
    }

    if (!this.claude) {
      throw new LLMError('Claude client not initialized', 'INVALID_REQUEST', 'claude');
    }

    const maxRetries = options.maxRetries ?? this.retryConfig.maxRetries;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const model = this.config.model || 'claude-sonnet-4-5-20250929';
        const tokensUsed: TokenUsage = { prompt: 0, completion: 0, total: 0 };

        const stream = this.claude.messages.stream({
          model,
          max_tokens: options.maxTokens || 4096,
          temperature: options.temperature,
          system: options.systemPrompt,
          messages: [{ role: 'user', content: prompt }],
        });

        // Handle abort signal
        if (options.abortSignal) {
          options.abortSignal.addEventListener('abort', () => {
            stream.abort();
          }, { once: true });
        }

        for await (const event of stream) {
          // Check abort between events
          if (options.abortSignal?.aborted) break;

          if (event.type === 'message_start' && event.message.usage) {
            tokensUsed.prompt = event.message.usage.input_tokens;
          }

          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            yield { text: event.delta.text };
          }

          if (event.type === 'message_delta' && event.usage) {
            tokensUsed.completion = event.usage.output_tokens;
          }
        }

        tokensUsed.total = tokensUsed.prompt + tokensUsed.completion;
        return { tokensUsed };
      } catch (error) {
        // Don't retry if aborted
        if (options.abortSignal?.aborted) {
          return { tokensUsed: { prompt: 0, completion: 0, total: 0 } };
        }

        lastError = error as Error;
        const llmError = this.classifyError(error as Error);

        if (!llmError.retryable || attempt === maxRetries) {
          throw llmError;
        }

        const delay = Math.min(
          this.retryConfig.initialDelayMs * Math.pow(this.retryConfig.backoffMultiplier, attempt),
          this.retryConfig.maxDelayMs
        );

        await this.sleep(delay);
      }
    }

    throw new LLMError(
      `Failed after ${maxRetries + 1} attempts: ${lastError?.message}`,
      'UNKNOWN',
      this.config.provider,
      false,
      lastError
    );
  }

  /**
   * Generate with structured JSON output
   */
  async generateJSON<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    options: LLMGenerateOptions = {}
  ): Promise<{ data: T; response: LLMResponse }> {
    const jsonPrompt = `${prompt}

IMPORTANT: Respond with valid JSON only. No markdown, no code blocks, just the JSON object.`;

    const response = await this.generate(jsonPrompt, options);

    try {
      // Try to extract JSON from the response
      const jsonMatch = response.content.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const validated = schema.parse(parsed);

      return { data: validated, response };
    } catch (error) {
      throw new LLMError(
        `Failed to parse JSON response: ${(error as Error).message}`,
        'INVALID_REQUEST',
        this.config.provider,
        false,
        error as Error
      );
    }
  }

  /**
   * Generate completion with tool calling support (Claude only)
   * Supports multi-turn conversations with tool use and tool results
   */
  async generateWithTools(options: LLMToolGenerateOptions): Promise<LLMToolResponse> {
    if (this.config.provider !== 'claude') {
      throw new LLMError(
        'Tool calling is only supported with Claude provider',
        'INVALID_REQUEST',
        this.config.provider
      );
    }

    const maxRetries = options.maxRetries ?? this.retryConfig.maxRetries;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const startTime = Date.now();
        return await this.generateClaudeWithTools(options, startTime);
      } catch (error) {
        lastError = error as Error;
        const llmError = this.classifyError(error as Error);

        if (!llmError.retryable || attempt === maxRetries) {
          throw llmError;
        }

        const delay = Math.min(
          this.retryConfig.initialDelayMs * Math.pow(this.retryConfig.backoffMultiplier, attempt),
          this.retryConfig.maxDelayMs
        );

        await this.sleep(delay);
      }
    }

    throw new LLMError(
      `Failed after ${maxRetries + 1} attempts: ${lastError?.message}`,
      'UNKNOWN',
      this.config.provider,
      false,
      lastError
    );
  }

  /**
   * Continue a tool-enabled conversation with tool results
   */
  async continueWithToolResults(
    previousMessages: ConversationMessage[],
    assistantResponse: AssistantContent[],
    toolResults: ToolResult[],
    options: LLMToolGenerateOptions
  ): Promise<LLMToolResponse> {
    // Build messages array with previous context, assistant response, and tool results
    const messages: ConversationMessage[] = [
      ...previousMessages,
      { role: 'assistant' as const, content: assistantResponse },
      {
        role: 'user' as const,
        content: toolResults.map((r) => ({
          type: 'tool_result' as const,
          tool_use_id: r.tool_use_id,
          content: r.content,
          is_error: r.is_error,
        })),
      },
    ];

    return this.generateWithTools({
      ...options,
      messages,
    });
  }

  /**
   * Generate completion with tools using Claude
   */
  private async generateClaudeWithTools(
    options: LLMToolGenerateOptions,
    startTime: number
  ): Promise<LLMToolResponse> {
    if (!this.claude) {
      throw new LLMError('Claude client not initialized', 'INVALID_REQUEST', 'claude');
    }

    const model = this.config.model || 'claude-sonnet-4-5-20250929';

    // Build messages - either from provided messages or from a simple prompt
    const messages = options.messages || [];

    // Build Anthropic-compatible messages
    // The Anthropic SDK expects specific content block types, so we construct them directly
    const anthropicMessages: Anthropic.Messages.MessageParam[] = messages.map((m) => {
      if (m.role === 'user') {
        if (typeof m.content === 'string') {
          return { role: 'user' as const, content: m.content };
        }
        // Tool results - construct as ToolResultBlockParam array
        const toolResultContent: Anthropic.Messages.ToolResultBlockParam[] = m.content.map((c) => ({
          type: 'tool_result' as const,
          tool_use_id: c.tool_use_id,
          content: c.content,
          is_error: c.is_error,
        }));
        return {
          role: 'user' as const,
          content: toolResultContent,
        };
      }
      // Assistant message
      if (typeof m.content === 'string') {
        return { role: 'assistant' as const, content: m.content };
      }
      // Assistant message with content blocks
      type AssistantContentBlock = Anthropic.Messages.TextBlockParam | Anthropic.Messages.ToolUseBlockParam;
      const assistantContent: AssistantContentBlock[] = m.content.map((c): AssistantContentBlock => {
        if (c.type === 'text') {
          return { type: 'text' as const, text: c.text };
        }
        return {
          type: 'tool_use' as const,
          id: c.id,
          name: c.name,
          input: c.input,
        };
      });
      return {
        role: 'assistant' as const,
        content: assistantContent,
      };
    });

    // Build request params
    const requestParams: Anthropic.Messages.MessageCreateParamsNonStreaming = {
      model,
      max_tokens: options.maxTokens || 4096,
      messages: anthropicMessages,
    };

    // Add system prompt if provided
    if (options.systemPrompt) {
      requestParams.system = options.systemPrompt;
    }

    // Add temperature if provided
    if (options.temperature !== undefined) {
      requestParams.temperature = options.temperature;
    }

    // Add tools if provided
    if (options.tools && options.tools.length > 0) {
      requestParams.tools = options.tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.input_schema as Anthropic.Messages.Tool.InputSchema,
      }));

      // Add tool_choice if provided
      if (options.tool_choice) {
        if (typeof options.tool_choice === 'string') {
          requestParams.tool_choice =
            options.tool_choice === 'auto'
              ? { type: 'auto' }
              : { type: 'any' };
        } else {
          requestParams.tool_choice = {
            type: 'tool',
            name: options.tool_choice.name,
          };
        }
      }
    }

    const response = await this.claude.messages.create(requestParams);

    // Extract text content and tool calls
    let textContent = '';
    const toolCalls: ToolCall[] = [];

    for (const block of response.content) {
      if (block.type === 'text') {
        textContent += block.text;
      } else if (block.type === 'tool_use') {
        toolCalls.push({
          id: block.id,
          name: block.name,
          input: block.input as Record<string, unknown>,
        });
      }
    }

    const tokensUsed: TokenUsage = {
      prompt: response.usage.input_tokens,
      completion: response.usage.output_tokens,
      total: response.usage.input_tokens + response.usage.output_tokens,
    };

    return {
      content: textContent,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      stopReason: response.stop_reason as LLMToolResponse['stopReason'],
      tokensUsed,
      model,
      cost: calculateCost(model, tokensUsed),
      latencyMs: Date.now() - startTime,
      provider: 'claude',
    };
  }

  /**
   * Generate completion using Claude
   */
  private async generateClaude(
    prompt: string,
    options: LLMGenerateOptions,
    startTime: number
  ): Promise<LLMResponse> {
    if (!this.claude) {
      throw new LLMError('Claude client not initialized', 'INVALID_REQUEST', 'claude');
    }

    const model = this.config.model || 'claude-sonnet-4-5-20250929';

    const response = await this.claude.messages.create({
      model,
      max_tokens: options.maxTokens || 4096,
      temperature: options.temperature,
      system: options.systemPrompt,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    const text = content.type === 'text' ? content.text : '';

    const tokensUsed: TokenUsage = {
      prompt: response.usage.input_tokens,
      completion: response.usage.output_tokens,
      total: response.usage.input_tokens + response.usage.output_tokens,
    };

    return {
      content: text,
      tokensUsed,
      model,
      cost: calculateCost(model, tokensUsed),
      latencyMs: Date.now() - startTime,
      provider: 'claude',
    };
  }

  /**
   * Generate completion using LangChain (for OpenAI/Kimi)
   */
  private async generateLangChain(
    prompt: string,
    options: LLMGenerateOptions,
    startTime: number
  ): Promise<LLMResponse> {
    if (!this.langchainModel) {
      throw new LLMError('LangChain model not initialized', 'INVALID_REQUEST', this.config.provider);
    }

    const model = this.config.model || 'gpt-4-turbo';
    const messages = [];

    if (options.systemPrompt) {
      messages.push(new SystemMessage(options.systemPrompt));
    }
    messages.push(new HumanMessage(prompt));

    const response = await this.langchainModel.invoke(messages);

    const text = typeof response.content === 'string' ? response.content : '';

    // LangChain may provide usage metadata
    const usage = response.usage_metadata;
    const tokensUsed: TokenUsage = {
      prompt: usage?.input_tokens || this.estimateTokens(prompt),
      completion: usage?.output_tokens || this.estimateTokens(text),
      total: (usage?.input_tokens || 0) + (usage?.output_tokens || 0) || this.estimateTokens(prompt + text),
    };

    return {
      content: text,
      tokensUsed,
      model,
      cost: calculateCost(model, tokensUsed),
      latencyMs: Date.now() - startTime,
      provider: this.config.provider === 'kimi' ? 'kimi' : 'openai',
    };
  }

  /**
   * Classify error into LLMError with appropriate code
   */
  private classifyError(error: Error): LLMError {
    const message = error.message.toLowerCase();

    // Rate limit errors
    if (message.includes('rate limit') || message.includes('429') || message.includes('too many requests')) {
      return new LLMError(error.message, 'RATE_LIMIT', this.config.provider, true, error);
    }

    // Authentication errors
    if (message.includes('401') || message.includes('unauthorized') || message.includes('invalid api key')) {
      return new LLMError(error.message, 'AUTHENTICATION', this.config.provider, false, error);
    }

    // Context length errors
    if (message.includes('context length') || message.includes('too long') || message.includes('max tokens')) {
      return new LLMError(error.message, 'CONTEXT_LENGTH', this.config.provider, false, error);
    }

    // Content filter errors
    if (message.includes('content filter') || message.includes('safety') || message.includes('blocked')) {
      return new LLMError(error.message, 'CONTENT_FILTER', this.config.provider, false, error);
    }

    // Timeout errors
    if (message.includes('timeout') || message.includes('timed out') || message.includes('econnreset')) {
      return new LLMError(error.message, 'TIMEOUT', this.config.provider, true, error);
    }

    // API errors (generally retryable)
    if (message.includes('500') || message.includes('502') || message.includes('503') || message.includes('504')) {
      return new LLMError(error.message, 'API_ERROR', this.config.provider, true, error);
    }

    // Unknown errors
    return new LLMError(error.message, 'UNKNOWN', this.config.provider, false, error);
  }

  /**
   * Estimate token count (rough approximation: 4 chars per token)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get current provider
   */
  get provider(): string {
    return this.config.provider;
  }

  /**
   * Get current model
   */
  get model(): string {
    return this.config.model || (this.config.provider === 'claude' ? 'claude-sonnet-4-5-20250929' : 'gpt-4-turbo');
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create an LLM client with the specified configuration
 */
export function createLLMClient(config: LLMConfig, retryConfig?: RetryConfig): LLMClient {
  return new LLMClient(config, retryConfig);
}

/**
 * Create a Claude client with default settings
 */
export function createClaudeClient(apiKey: string, model?: string): LLMClient {
  return new LLMClient({
    provider: 'claude',
    apiKey,
    model: model || 'claude-sonnet-4-5-20250929',
  });
}

/**
 * Create an OpenAI client with default settings
 */
export function createOpenAIClient(apiKey: string, model?: string): LLMClient {
  return new LLMClient({
    provider: 'openai',
    apiKey,
    model: model || 'gpt-4-turbo',
  });
}
