/**
 * Streaming Service
 *
 * Real-time streaming for chat-like interactions using Vercel AI SDK v5.
 * Implements the hybrid approach: Vercel AI SDK for streaming UI, Anthropic SDK for backend.
 * Supports file attachments for multimodal AI (PDFs, images, etc.)
 */
import { streamText, type ModelMessage } from 'ai';
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

/**
 * File attachment for multimodal AI inputs
 * Supports PDFs, images (PNG, JPEG, GIF, WEBP), and text files
 */
export interface FileAttachment {
  url: string;
  contentType?: string;
  name?: string;
}

export interface StreamOptions {
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  onToken?: (token: string) => void;
  onFinish?: (result: StreamResult) => void;
  abortSignal?: AbortSignal;
  /** File attachments for multimodal analysis (PDFs, images, etc.) */
  attachments?: FileAttachment[];
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
    const messages: ModelMessage[] = [];

    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const model = this.getModel();
    let fullContent = '';

    const result = streamText({
      model: model as unknown as Parameters<typeof streamText>[0]['model'],
      messages,
      maxOutputTokens: options.maxTokens || 4096,
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
        prompt: usage?.inputTokens || 0,
        completion: usage?.outputTokens || 0,
        total: usage?.totalTokens || 0,
      },
      finishReason: finishReason || 'unknown',
    });
  }

  /**
   * Stream a chat conversation
   * Supports multi-turn conversations and file attachments
   */
  async *streamChat(
    messages: ModelMessage[],
    options: StreamOptions = {}
  ): AsyncGenerator<string> {
    const allMessages = [...messages];

    if (options.systemPrompt && allMessages[0]?.role !== 'system') {
      allMessages.unshift({ role: 'system', content: options.systemPrompt });
    }

    // Build messages with attachments if provided
    // Use async method to handle local URLs (converts to base64 for AI provider access)
    const messagesWithAttachments = await this.buildMessagesWithAttachmentsAsync(
      allMessages,
      options.attachments
    );

    const model = this.getModel();
    let fullContent = '';

    const result = streamText({
      model: model as unknown as Parameters<typeof streamText>[0]['model'],
      messages: messagesWithAttachments,
      maxOutputTokens: options.maxTokens || 4096,
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
        prompt: usage?.inputTokens || 0,
        completion: usage?.outputTokens || 0,
        total: usage?.totalTokens || 0,
      },
      finishReason: finishReason || 'unknown',
    });
  }

  /**
   * Build messages array with file attachments on the last user message
   * Uses Vercel AI SDK v6's parts array for multimodal input
   */
  private buildMessagesWithAttachments(
    messages: ModelMessage[],
    attachments?: FileAttachment[]
  ): ModelMessage[] {
    if (!attachments?.length) {
      return messages;
    }

    // Find the last user message to attach files to
    const result = [...messages];
    for (let i = result.length - 1; i >= 0; i--) {
      const msg = result[i];
      if (msg.role === 'user') {
        // In AI SDK v6, we use a content array with parts for multimodal content
        const textContent = typeof msg.content === 'string' ? msg.content : '';

        // Build parts array with text and file parts
        // AI SDK v6 FilePart uses 'data' (not 'url') which can be a URL string
        const parts: Array<{ type: 'text'; text: string } | { type: 'file'; data: string; mediaType: string }> = [
          { type: 'text', text: textContent },
          ...attachments.map((a) => ({
            type: 'file' as const,
            data: a.url, // AI SDK v6 accepts URLs in the 'data' field
            mediaType: a.contentType || 'application/octet-stream',
          })),
        ];

        result[i] = {
          role: 'user',
          content: parts,
        } as ModelMessage;
        break;
      }
    }

    return result;
  }

  /**
   * Build messages with attachments, fetching local URLs and converting to base64
   * This is needed because AI providers can't access localhost URLs
   */
  async buildMessagesWithAttachmentsAsync(
    messages: ModelMessage[],
    attachments?: FileAttachment[]
  ): Promise<ModelMessage[]> {
    if (!attachments?.length) {
      return messages;
    }

    // Fetch local URLs and convert to base64
    const processedAttachments = await Promise.all(
      attachments.map(async (a) => {
        // Check if URL is local (localhost, 127.0.0.1, or internal network)
        const isLocalUrl = a.url.includes('localhost') ||
                          a.url.includes('127.0.0.1') ||
                          a.url.includes('0.0.0.0') ||
                          a.url.includes('host.docker.internal');

        if (isLocalUrl) {
          try {
            // Fetch the file content
            const response = await fetch(a.url);
            if (!response.ok) {
              console.warn(`[StreamingService] Failed to fetch local file: ${a.url} - ${response.status}`);
              return null;
            }
            const buffer = await response.arrayBuffer();
            const base64 = Buffer.from(buffer).toString('base64');
            const dataUrl = `data:${a.contentType || 'application/octet-stream'};base64,${base64}`;
            return {
              ...a,
              url: dataUrl,
            };
          } catch (error) {
            console.error(`[StreamingService] Error fetching local file: ${a.url}`, error);
            return null;
          }
        }
        return a;
      })
    );

    // Filter out failed attachments
    const validAttachments = processedAttachments.filter((a): a is FileAttachment => a !== null);

    // Now use the synchronous method with processed attachments
    return this.buildMessagesWithAttachments(messages, validAttachments);
  }

  /**
   * Get the full stream result (for use in API routes)
   * Returns a Response-compatible stream for Next.js API routes
   */
  async getStreamResult(
    prompt: string,
    options: StreamOptions = {}
  ): Promise<ReturnType<typeof streamText>> {
    const messages: ModelMessage[] = [];

    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const model = this.getModel();

    return streamText({
      model: model as unknown as Parameters<typeof streamText>[0]['model'],
      messages,
      maxOutputTokens: options.maxTokens || 4096,
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
      const modelId = this.config.model || 'claude-sonnet-4-5-20250929';
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
    model: model || 'claude-sonnet-4-5-20250929',
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
 * Convert ChatMessage array to ModelMessage array
 */
export function toModelMessages(messages: ChatMessage[]): ModelMessage[] {
  return messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));
}

/**
 * @deprecated Use toModelMessages instead (renamed in AI SDK v5)
 */
export const toCoreMessages = toModelMessages;
