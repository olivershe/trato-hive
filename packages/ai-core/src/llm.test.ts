/**
 * LLM Client Unit Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateCost,
  LLMError,
  DEFAULT_RETRY_CONFIG,
  MODEL_PRICING,
  type TokenUsage,
} from './types';
import { LLMClient, createLLMClient, createClaudeClient, createOpenAIClient } from './llm';

// Mock Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn(),
    },
  })),
}));

// Mock LangChain
vi.mock('@langchain/openai', () => ({
  ChatOpenAI: vi.fn().mockImplementation(() => ({
    invoke: vi.fn(),
  })),
}));

describe('calculateCost', () => {
  it('should calculate cost correctly for Claude Sonnet', () => {
    const tokens: TokenUsage = { prompt: 1000, completion: 500, total: 1500 };
    const cost = calculateCost('claude-sonnet-4-5-20250929', tokens);

    // Input: 1000 tokens * $3.0/1M = $0.003
    // Output: 500 tokens * $15.0/1M = $0.0075
    // Total: $0.0105
    expect(cost).toBeCloseTo(0.0105, 6);
  });

  it('should calculate cost correctly for GPT-4 Turbo', () => {
    const tokens: TokenUsage = { prompt: 1000, completion: 500, total: 1500 };
    const cost = calculateCost('gpt-4-turbo', tokens);

    // Input: 1000 tokens * $10.0/1M = $0.01
    // Output: 500 tokens * $30.0/1M = $0.015
    // Total: $0.025
    expect(cost).toBeCloseTo(0.025, 6);
  });

  it('should use default pricing for unknown models', () => {
    const tokens: TokenUsage = { prompt: 1000, completion: 500, total: 1500 };
    const cost = calculateCost('unknown-model', tokens);

    // Uses default pricing (same as Claude Sonnet)
    expect(cost).toBeCloseTo(0.0105, 6);
  });

  it('should handle zero tokens', () => {
    const tokens: TokenUsage = { prompt: 0, completion: 0, total: 0 };
    const cost = calculateCost('claude-sonnet-4-5-20250929', tokens);
    expect(cost).toBe(0);
  });

  it('should handle large token counts', () => {
    const tokens: TokenUsage = { prompt: 1000000, completion: 500000, total: 1500000 };
    const cost = calculateCost('claude-sonnet-4-5-20250929', tokens);

    // Input: 1M tokens * $3.0/1M = $3.0
    // Output: 500K tokens * $15.0/1M = $7.5
    // Total: $10.5
    expect(cost).toBeCloseTo(10.5, 6);
  });
});

describe('LLMError', () => {
  it('should create error with correct properties', () => {
    const error = new LLMError('Test error', 'RATE_LIMIT', 'claude', true);

    expect(error.message).toBe('Test error');
    expect(error.code).toBe('RATE_LIMIT');
    expect(error.provider).toBe('claude');
    expect(error.retryable).toBe(true);
    expect(error.name).toBe('LLMError');
  });

  it('should include cause when provided', () => {
    const cause = new Error('Original error');
    const error = new LLMError('Wrapper error', 'API_ERROR', 'openai', true, cause);

    expect(error.cause).toBe(cause);
  });
});

describe('MODEL_PRICING', () => {
  it('should have pricing for Claude models', () => {
    expect(MODEL_PRICING['claude-sonnet-4-5-20250929']).toBeDefined();
    expect(MODEL_PRICING['claude-3-haiku-20240307']).toBeDefined();
    expect(MODEL_PRICING['claude-3-opus-20240229']).toBeDefined();
  });

  it('should have pricing for OpenAI models', () => {
    expect(MODEL_PRICING['gpt-4-turbo']).toBeDefined();
    expect(MODEL_PRICING['gpt-4o']).toBeDefined();
    expect(MODEL_PRICING['gpt-4o-mini']).toBeDefined();
  });

  it('should have default pricing', () => {
    expect(MODEL_PRICING.default).toBeDefined();
  });
});

describe('DEFAULT_RETRY_CONFIG', () => {
  it('should have sensible defaults', () => {
    expect(DEFAULT_RETRY_CONFIG.maxRetries).toBe(3);
    expect(DEFAULT_RETRY_CONFIG.initialDelayMs).toBe(1000);
    expect(DEFAULT_RETRY_CONFIG.maxDelayMs).toBe(30000);
    expect(DEFAULT_RETRY_CONFIG.backoffMultiplier).toBe(2);
  });
});

describe('LLMClient', () => {
  describe('constructor', () => {
    it('should validate config with Zod', () => {
      expect(() => {
        new LLMClient({
          provider: 'claude',
          apiKey: '', // Invalid: empty string
        });
      }).toThrow();
    });

    it('should accept valid Claude config', () => {
      const client = new LLMClient({
        provider: 'claude',
        apiKey: 'test-key',
      });

      expect(client.provider).toBe('claude');
      expect(client.model).toBe('claude-sonnet-4-5-20250929');
    });

    it('should accept valid OpenAI config', () => {
      const client = new LLMClient({
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4o',
      });

      expect(client.provider).toBe('openai');
      expect(client.model).toBe('gpt-4o');
    });

    it('should reject invalid provider', () => {
      expect(() => {
        new LLMClient({
          provider: 'invalid' as 'claude',
          apiKey: 'test-key',
        });
      }).toThrow();
    });
  });

  describe('factory functions', () => {
    it('createLLMClient should create client with config', () => {
      const client = createLLMClient({
        provider: 'claude',
        apiKey: 'test-key',
      });

      expect(client).toBeInstanceOf(LLMClient);
      expect(client.provider).toBe('claude');
    });

    it('createClaudeClient should create Claude client', () => {
      const client = createClaudeClient('test-key');

      expect(client).toBeInstanceOf(LLMClient);
      expect(client.provider).toBe('claude');
      expect(client.model).toBe('claude-sonnet-4-5-20250929');
    });

    it('createClaudeClient should accept custom model', () => {
      const client = createClaudeClient('test-key', 'claude-3-haiku-20240307');

      expect(client.model).toBe('claude-3-haiku-20240307');
    });

    it('createOpenAIClient should create OpenAI client', () => {
      const client = createOpenAIClient('test-key');

      expect(client).toBeInstanceOf(LLMClient);
      expect(client.provider).toBe('openai');
      expect(client.model).toBe('gpt-4-turbo');
    });
  });
});

describe('Error Classification', () => {
  let client: LLMClient;

  beforeEach(() => {
    client = new LLMClient({
      provider: 'claude',
      apiKey: 'test-key',
    });
  });

  // Access private method for testing
  const classifyError = (client: LLMClient, error: Error): LLMError => {
    return (client as unknown as { classifyError: (e: Error) => LLMError }).classifyError(error);
  };

  it('should classify rate limit errors as retryable', () => {
    const error = new Error('Rate limit exceeded - 429');
    const classified = classifyError(client, error);

    expect(classified.code).toBe('RATE_LIMIT');
    expect(classified.retryable).toBe(true);
  });

  it('should classify authentication errors as non-retryable', () => {
    const error = new Error('401 Unauthorized - Invalid API key');
    const classified = classifyError(client, error);

    expect(classified.code).toBe('AUTHENTICATION');
    expect(classified.retryable).toBe(false);
  });

  it('should classify timeout errors as retryable', () => {
    const error = new Error('Request timed out');
    const classified = classifyError(client, error);

    expect(classified.code).toBe('TIMEOUT');
    expect(classified.retryable).toBe(true);
  });

  it('should classify 500 errors as retryable', () => {
    const error = new Error('Internal server error - 500');
    const classified = classifyError(client, error);

    expect(classified.code).toBe('API_ERROR');
    expect(classified.retryable).toBe(true);
  });

  it('should classify context length errors as non-retryable', () => {
    const error = new Error('Context length exceeded - too long');
    const classified = classifyError(client, error);

    expect(classified.code).toBe('CONTEXT_LENGTH');
    expect(classified.retryable).toBe(false);
  });

  it('should classify content filter errors as non-retryable', () => {
    const error = new Error('Content blocked by safety filter');
    const classified = classifyError(client, error);

    expect(classified.code).toBe('CONTENT_FILTER');
    expect(classified.retryable).toBe(false);
  });

  it('should classify unknown errors as non-retryable', () => {
    const error = new Error('Some random error');
    const classified = classifyError(client, error);

    expect(classified.code).toBe('UNKNOWN');
    expect(classified.retryable).toBe(false);
  });
});
