/**
 * @trato-hive/ai-core Types
 *
 * Shared types for AI services
 */
import { z } from 'zod';

// =============================================================================
// LLM Response Types
// =============================================================================

export interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
}

export interface LLMResponse {
  content: string;
  tokensUsed: TokenUsage;
  model: string;
  cost: number;
  latencyMs: number;
  provider: 'claude' | 'openai' | 'kimi';
}

export interface LLMGenerateOptions {
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  maxRetries?: number;
}

// =============================================================================
// Error Types
// =============================================================================

export class LLMError extends Error {
  constructor(
    message: string,
    public readonly code: LLMErrorCode,
    public readonly provider: string,
    public readonly retryable: boolean = false,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

export type LLMErrorCode =
  | 'RATE_LIMIT'
  | 'API_ERROR'
  | 'TIMEOUT'
  | 'INVALID_REQUEST'
  | 'AUTHENTICATION'
  | 'CONTEXT_LENGTH'
  | 'CONTENT_FILTER'
  | 'UNKNOWN';

// =============================================================================
// Model Pricing (per 1M tokens as of Jan 2026)
// =============================================================================

export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // Claude models
  'claude-sonnet-4-5-20250514': { input: 3.0, output: 15.0 },
  'claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0 },
  'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
  'claude-3-opus-20240229': { input: 15.0, output: 75.0 },

  // OpenAI models
  'gpt-4-turbo': { input: 10.0, output: 30.0 },
  'gpt-4o': { input: 5.0, output: 15.0 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-3.5-turbo': { input: 0.5, output: 1.5 },

  // Default fallback
  default: { input: 3.0, output: 15.0 },
};

/**
 * Calculate cost for a given model and token usage
 */
export function calculateCost(model: string, tokens: TokenUsage): number {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING.default;
  const inputCost = (tokens.prompt / 1_000_000) * pricing.input;
  const outputCost = (tokens.completion / 1_000_000) * pricing.output;
  return Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000; // Round to 6 decimal places
}

// =============================================================================
// Retry Configuration
// =============================================================================

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
};

// =============================================================================
// Validation Schemas
// =============================================================================

export const llmConfigSchema = z.object({
  provider: z.enum(['claude', 'openai', 'kimi']),
  apiKey: z.string().min(1, 'API key is required'),
  model: z.string().optional(),
});

export const generateOptionsSchema = z.object({
  maxTokens: z.number().int().positive().max(100000).optional(),
  temperature: z.number().min(0).max(2).optional(),
  systemPrompt: z.string().optional(),
  maxRetries: z.number().int().min(0).max(10).optional(),
});

export type LLMConfig = z.infer<typeof llmConfigSchema>;
