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
  type TokenUsage,
  type RetryConfig,
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

    const model = this.config.model || 'claude-sonnet-4-5-20250514';

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
    return this.config.model || (this.config.provider === 'claude' ? 'claude-sonnet-4-5-20250514' : 'gpt-4-turbo');
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
    model: model || 'claude-sonnet-4-5-20250514',
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
