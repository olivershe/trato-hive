/**
 * Streaming Service
 *
 * Real-time streaming for chat-like interactions using Vercel AI SDK.
 * Implements the hybrid approach: Vercel AI SDK for streaming UI, Anthropic SDK for backend.
 */
import { streamText, type CoreMessage } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';

// =============================================================================
// Types
// =============================================================================

export interface StreamConfig {
  provider: 'claude' | 'openai';
  apiKey?: string; // Optional - uses env vars by default
  model?: string;
}

export interface StreamOptions {
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  onToken?: (token: string) => void;
  onFinish?: (result: StreamResult) => void;
  abortSignal?: AbortSignal;
}

export interface StreamResult {
  content: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  finishReason: 'stop' | 'length' | 'content-filter' | 'tool-calls' | 'error' | 'other' | 'unknown';
}

// =============================================================================
// Streaming Service Class
// =============================================================================

export class StreamingService {
  private readonly config: StreamConfig;

  constructor(config: StreamConfig) {
    this.config = config;
  }

  /**
   * Stream a response from the LLM
   * Returns an async generator that yields text chunks
   */
  async *streamResponse(prompt: string, options: StreamOptions = {}): AsyncGenerator<string> {
    const messages: CoreMessage[] = [];

    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const model = this.getModel();
    let fullContent = '';

    const result = streamText({
      model: model as unknown as Parameters<typeof streamText>[0]['model'],
      messages,
      maxTokens: options.maxTokens || 4096,
      temperature: options.temperature,
      abortSignal: options.abortSignal,
    });

    for await (const chunk of result.textStream) {
      fullContent += chunk;
      options.onToken?.(chunk);
      yield chunk;
    }

    // Get final result for metrics
    const finalResult = await result;
    const usage = await finalResult.usage;
    const finishReason = await finalResult.finishReason;

    options.onFinish?.({
      content: fullContent,
      tokensUsed: {
        prompt: usage?.promptTokens || 0,
        completion: usage?.completionTokens || 0,
        total: (usage?.promptTokens || 0) + (usage?.completionTokens || 0),
      },
      finishReason: finishReason || 'unknown',
    });
  }

  /**
   * Stream a chat conversation
   * Supports multi-turn conversations
   */
  async *streamChat(
    messages: CoreMessage[],
    options: StreamOptions = {}
  ): AsyncGenerator<string> {
    const allMessages = [...messages];

    if (options.systemPrompt && allMessages[0]?.role !== 'system') {
      allMessages.unshift({ role: 'system', content: options.systemPrompt });
    }

    const model = this.getModel();
    let fullContent = '';

    const result = streamText({
      model: model as unknown as Parameters<typeof streamText>[0]['model'],
      messages: allMessages,
      maxTokens: options.maxTokens || 4096,
      temperature: options.temperature,
      abortSignal: options.abortSignal,
    });

    for await (const chunk of result.textStream) {
      fullContent += chunk;
      options.onToken?.(chunk);
      yield chunk;
    }

    const finalResult = await result;
    const usage = await finalResult.usage;
    const finishReason = await finalResult.finishReason;

    options.onFinish?.({
      content: fullContent,
      tokensUsed: {
        prompt: usage?.promptTokens || 0,
        completion: usage?.completionTokens || 0,
        total: (usage?.promptTokens || 0) + (usage?.completionTokens || 0),
      },
      finishReason: finishReason || 'unknown',
    });
  }

  /**
   * Get the full stream result (for use in API routes)
   * Returns a Response-compatible stream for Next.js API routes
   */
  async getStreamResult(
    prompt: string,
    options: StreamOptions = {}
  ): Promise<ReturnType<typeof streamText>> {
    const messages: CoreMessage[] = [];

    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const model = this.getModel();

    return streamText({
      model: model as unknown as Parameters<typeof streamText>[0]['model'],
      messages,
      maxTokens: options.maxTokens || 4096,
      temperature: options.temperature,
      abortSignal: options.abortSignal,
    });
  }

  /**
   * Collect stream to string (for testing or when you need the full response)
   */
  async collectStream(prompt: string, options: StreamOptions = {}): Promise<StreamResult> {
    let content = '';
    let result: StreamResult | undefined;

    for await (const chunk of this.streamResponse(prompt, {
      ...options,
      onFinish: (r) => {
        result = r;
        options.onFinish?.(r);
      },
    })) {
      content += chunk;
    }

    return result || {
      content,
      tokensUsed: { prompt: 0, completion: 0, total: 0 },
      finishReason: 'unknown',
    };
  }

  /**
   * Get the appropriate model based on config
   */
  private getModel() {
    if (this.config.provider === 'claude') {
      const modelId = this.config.model || 'claude-sonnet-4-5-20250514';
      return anthropic(modelId);
    } else {
      const modelId = this.config.model || 'gpt-4-turbo';
      return openai(modelId);
    }
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a streaming service with the specified configuration
 */
export function createStreamingService(config: StreamConfig): StreamingService {
  return new StreamingService(config);
}

/**
 * Create a Claude streaming service with default settings
 */
export function createClaudeStreamingService(model?: string): StreamingService {
  return new StreamingService({
    provider: 'claude',
    model: model || 'claude-sonnet-4-5-20250514',
  });
}

/**
 * Create an OpenAI streaming service with default settings
 */
export function createOpenAIStreamingService(model?: string): StreamingService {
  return new StreamingService({
    provider: 'openai',
    model: model || 'gpt-4-turbo',
  });
}

// =============================================================================
// Utility Types for Frontend Integration
// =============================================================================

/**
 * Message type compatible with Vercel AI SDK's useChat hook
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: Date;
}

/**
 * Convert ChatMessage array to CoreMessage array
 */
export function toCoreMessages(messages: ChatMessage[]): CoreMessage[] {
  return messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));
}
