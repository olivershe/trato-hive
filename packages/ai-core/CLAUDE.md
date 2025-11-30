# AI Core Package (@trato-hive/ai-core)

**Parent:** Root CLAUDE.md
**Purpose:** TIC (Trato Intelligence Core) - LLM orchestration, embeddings, streaming, and citation extraction
**Last Updated:** 2025-11-18
**Layer Mapping:** Layer 3 (TIC Core - Reasoning Engine)

---

## 1. Purpose

The `@trato-hive/ai-core` package is the **Trato Intelligence Core (TIC)** - the AI reasoning engine that powers all intelligent features in Trato Hive. It provides:

1. **Flexible LLM Orchestration:** Provider-agnostic interface supporting Anthropic Claude (primary) and Google Gemini (alternative)
2. **Embedding Generation:** OpenAI text-embedding-3-large (3,072 dimensions) for semantic search
3. **Streaming Responses:** Real-time text generation using Vercel AI SDK
4. **Citation Extraction:** Link LLM outputs to source documents (golden thread)
5. **RAG Integration:** Combine retrieved facts with prompts for verifiable answers
6. **Prompt Library:** Structured templates with parameterization for consistency

**Key Characteristics:**
- **Provider flexibility** - Swap Anthropic ↔ Gemini via config (no code changes)
- **Citation-first** - Every AI output links back to source documents
- **Token tracking** - Monitor usage and costs across providers
- **Type-safe** - Full TypeScript with strict mode
- **Testable** - Mockable interfaces for unit/integration tests

**Used By:** `packages/agents` (workflow orchestration), `packages/semantic-layer` (fact extraction), `apps/api` (tRPC endpoints)

---

## 2. Ownership

**AI/ML Engineering Team** - All changes require:
1. Security review for prompt templates
2. Cost analysis for new LLM features
3. Evaluation metrics (accuracy, latency, cost)

**Breaking Changes:** Provider interface changes require migration guide.

---

## 3. Technology Stack

**LLM Providers:**
- **Primary:** Anthropic Claude (Sonnet 4.5) via @anthropic-ai/sdk 0.32.1
- **Alternative:** Google Gemini via @langchain/google-genai (through LangChain)

**Embeddings:**
- OpenAI text-embedding-3-large (3,072 dims) via @langchain/openai 0.3.12

**Streaming:**
- Vercel AI SDK 4.3.19 (@ai-sdk/anthropic for Claude streaming)

**Framework:**
- LangChain 0.3.11 (provider abstraction layer)
- Zod 3.23.8 (schema validation)

**Build & Test:**
- tsup 8.3.5 (CJS + ESM), TypeScript 5.6.3 (strict mode)
- Vitest 2.1.8

---

## 4. Architecture

### Directory Structure

```
packages/ai-core/src/
├── providers/
│   ├── anthropic.ts      # Claude Sonnet 4.5 provider
│   ├── gemini.ts         # Gemini provider (via LangChain)
│   └── types.ts          # Provider interfaces
├── embeddings/
│   ├── openai.ts         # OpenAI embedding service
│   └── cache.ts          # Embedding cache layer
├── streaming/
│   └── vercel-ai.ts      # Vercel AI SDK streaming service
├── rag/
│   ├── context.ts        # RAG context builder
│   └── citations.ts      # Citation extraction
├── prompts/
│   ├── templates/        # YAML/JSON prompt templates
│   └── compiler.ts       # Prompt assembly engine
├── llm.ts                # Main LLM service (provider router)
└── index.ts              # Package exports
```

### LLM Provider Flow

```
User Request
    ↓
LLMService.generate(prompt, options)
    ↓
Provider Selection (config.DEFAULT_LLM_PROVIDER)
    ↓
┌─────────────────┬─────────────────┐
│ Anthropic       │ Gemini          │
│ (Claude Sonnet) │ (via LangChain) │
└─────────────────┴─────────────────┘
    ↓
Retry Logic (exponential backoff, 3 attempts)
    ↓
Token Usage Tracking
    ↓
Return Response + Metadata
```

---

## 5. Environment Variables

**Required:**

```bash
# LLM Providers (configure at least one)
ANTHROPIC_API_KEY=sk-ant-api03-xxx  # Primary: Claude Sonnet 4.5
# OR
GEMINI_API_KEY=xxx                   # Alternative: Gemini

# Embeddings (required for semantic search)
OPENAI_API_KEY=sk-xxx                # text-embedding-3-large

# Configuration
DEFAULT_LLM_PROVIDER=anthropic       # Options: 'anthropic' | 'gemini'
DEFAULT_MODEL=claude-sonnet-4-5-20250929
DEFAULT_TEMPERATURE=0.2              # 0.0-1.0 (0.2 factual, 0.7 creative)
MAX_TOKENS_DEFAULT=4096
```

**Optional:**

```bash
# Streaming
ENABLE_STREAMING=true                # Enable Vercel AI SDK streaming

# Rate Limiting
LLM_MAX_RETRIES=3
LLM_RETRY_DELAY_MS=1000             # Initial retry delay (exponential backoff)

# Cost Tracking
ENABLE_COST_TRACKING=true
COST_PER_1K_INPUT_TOKENS=0.003      # Claude Sonnet pricing
COST_PER_1K_OUTPUT_TOKENS=0.015
```

---

## 6. LLM Service (Flexible Provider Pattern)

### Provider Interface

```typescript
// src/providers/types.ts
import { z } from 'zod';

export const llmRequestSchema = z.object({
  prompt: z.string().min(1),
  systemPrompt: z.string().optional(),
  temperature: z.number().min(0).max(1).default(0.2),
  maxTokens: z.number().positive().default(4096),
  stopSequences: z.array(z.string()).optional(),
});

export type LLMRequest = z.infer<typeof llmRequestSchema>;

export interface LLMResponse {
  text: string;
  stopReason: 'end_turn' | 'max_tokens' | 'stop_sequence';
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: 'anthropic' | 'gemini';
  latencyMs: number;
}

export interface LLMProvider {
  name: 'anthropic' | 'gemini';
  generate(request: LLMRequest): Promise<LLMResponse>;
  stream(request: LLMRequest): AsyncIterable<string>;
}
```

### Anthropic Provider (Primary)

```typescript
// src/providers/anthropic.ts
import Anthropic from '@anthropic-ai/sdk';
import type { LLMProvider, LLMRequest, LLMResponse } from './types';

export class AnthropicProvider implements LLMProvider {
  readonly name = 'anthropic' as const;
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();

    const response = await this.client.messages.create({
      model: process.env.DEFAULT_MODEL || 'claude-sonnet-4-5-20250929',
      max_tokens: request.maxTokens,
      temperature: request.temperature,
      messages: [
        ...(request.systemPrompt ? [{ role: 'system' as const, content: request.systemPrompt }] : []),
        { role: 'user' as const, content: request.prompt },
      ],
      stop_sequences: request.stopSequences,
    });

    const textContent = response.content.find(block => block.type === 'text');

    return {
      text: textContent?.type === 'text' ? textContent.text : '',
      stopReason: response.stop_reason as 'end_turn' | 'max_tokens' | 'stop_sequence',
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      model: response.model,
      provider: 'anthropic',
      latencyMs: Date.now() - startTime,
    };
  }

  async *stream(request: LLMRequest): AsyncIterable<string> {
    const stream = await this.client.messages.stream({
      model: process.env.DEFAULT_MODEL || 'claude-sonnet-4-5-20250929',
      max_tokens: request.maxTokens,
      temperature: request.temperature,
      messages: [
        ...(request.systemPrompt ? [{ role: 'system' as const, content: request.systemPrompt }] : []),
        { role: 'user' as const, content: request.prompt },
      ],
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text;
      }
    }
  }
}
```

### Gemini Provider (Alternative)

```typescript
// src/providers/gemini.ts
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import type { LLMProvider, LLMRequest, LLMResponse } from './types';

export class GeminiProvider implements LLMProvider {
  readonly name = 'gemini' as const;
  private model: ChatGoogleGenerativeAI;

  constructor(apiKey: string) {
    this.model = new ChatGoogleGenerativeAI({
      apiKey,
      modelName: 'gemini-2.0-flash-exp',
      temperature: 0.2,
    });
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();

    const messages = [
      ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
      { role: 'user', content: request.prompt },
    ];

    const response = await this.model.invoke(messages, {
      temperature: request.temperature,
      maxOutputTokens: request.maxTokens,
    });

    return {
      text: response.content as string,
      stopReason: 'end_turn',
      usage: {
        inputTokens: response.usage_metadata?.input_tokens || 0,
        outputTokens: response.usage_metadata?.output_tokens || 0,
        totalTokens: response.usage_metadata?.total_tokens || 0,
      },
      model: 'gemini-2.0-flash-exp',
      provider: 'gemini',
      latencyMs: Date.now() - startTime,
    };
  }

  async *stream(request: LLMRequest): AsyncIterable<string> {
    const messages = [
      ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
      { role: 'user', content: request.prompt },
    ];

    const stream = await this.model.stream(messages);

    for await (const chunk of stream) {
      yield chunk.content as string;
    }
  }
}
```

### LLM Service with Retry Logic

```typescript
// src/llm.ts
import { AnthropicProvider } from './providers/anthropic';
import { GeminiProvider } from './providers/gemini';
import type { LLMProvider, LLMRequest, LLMResponse } from './providers/types';

export class LLMService {
  private provider: LLMProvider;

  constructor(providerName: 'anthropic' | 'gemini') {
    const apiKey = providerName === 'anthropic'
      ? process.env.ANTHROPIC_API_KEY!
      : process.env.GEMINI_API_KEY!;

    this.provider = providerName === 'anthropic'
      ? new AnthropicProvider(apiKey)
      : new GeminiProvider(apiKey);
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    return this.retryWithBackoff(async () => {
      return await this.provider.generate(request);
    });
  }

  async *stream(request: LLMRequest): AsyncIterable<string> {
    yield* this.provider.stream(request);
  }

  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    initialDelayMs = 1000
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxRetries - 1) {
          const delay = initialDelayMs * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }
}

// Factory function
export function createLLMService(providerName?: 'anthropic' | 'gemini'): LLMService {
  const provider = providerName || (process.env.DEFAULT_LLM_PROVIDER as 'anthropic' | 'gemini') || 'anthropic';
  return new LLMService(provider);
}
```

---

## 7. Embedding Service

```typescript
// src/embeddings/openai.ts
import { OpenAIEmbeddings } from '@langchain/openai';

export class EmbeddingService {
  private embeddings: OpenAIEmbeddings;
  private cache: Map<string, number[]> = new Map();

  constructor(apiKey: string) {
    this.embeddings = new OpenAIEmbeddings({
      apiKey,
      modelName: 'text-embedding-3-large',
      dimensions: 3072,
    });
  }

  async generate(text: string): Promise<number[]> {
    // Check cache
    const cached = this.cache.get(text);
    if (cached) return cached;

    // Generate embedding
    const embedding = await this.embeddings.embedQuery(text);

    // Cache result
    this.cache.set(text, embedding);

    return embedding;
  }

  async batchGenerate(texts: string[]): Promise<number[][]> {
    // Check which texts are not cached
    const uncached = texts.filter(text => !this.cache.has(text));

    if (uncached.length > 0) {
      // Batch generate embeddings for uncached texts
      const newEmbeddings = await this.embeddings.embedDocuments(uncached);

      // Cache results
      uncached.forEach((text, i) => {
        this.cache.set(text, newEmbeddings[i]);
      });
    }

    // Return all embeddings (from cache)
    return texts.map(text => this.cache.get(text)!);
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export function createEmbeddingService(): EmbeddingService {
  return new EmbeddingService(process.env.OPENAI_API_KEY!);
}
```

---

## 8. Streaming Service (Vercel AI SDK)

```typescript
// src/streaming/vercel-ai.ts
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

export interface StreamOptions {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export class StreamingService {
  async *streamCompletion(options: StreamOptions): AsyncIterable<string> {
    const result = streamText({
      model: anthropic('claude-sonnet-4-5-20250929'),
      prompt: options.prompt,
      system: options.systemPrompt,
      temperature: options.temperature || 0.2,
      maxTokens: options.maxTokens || 4096,
    });

    for await (const textPart of result.textStream) {
      yield textPart;
    }
  }

  async streamToString(options: StreamOptions): Promise<string> {
    let fullText = '';

    for await (const chunk of this.streamCompletion(options)) {
      fullText += chunk;
    }

    return fullText;
  }
}

export function createStreamingService(): StreamingService {
  return new StreamingService();
}
```

---

## 9. Citation Extraction

```typescript
// src/rag/citations.ts
import type { Fact } from '@trato-hive/shared';

export interface Citation {
  factId: string;
  sourceDocumentId: string;
  pageNumber: number;
  excerpt: string;
  confidence: number;
}

export class CitationExtractor {
  /**
   * Extract citation markers like [1], [2] from LLM output
   */
  extractMarkers(text: string): number[] {
    const regex = /\[(\d+)\]/g;
    const markers: number[] = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      markers.push(parseInt(match[1], 10));
    }

    return [...new Set(markers)]; // Deduplicate
  }

  /**
   * Link citation markers to facts
   */
  linkCitations(text: string, facts: Fact[]): Citation[] {
    const markers = this.extractMarkers(text);

    return markers
      .map(marker => {
        const fact = facts[marker - 1]; // Citations are 1-indexed
        if (!fact) return null;

        return {
          factId: fact.id,
          sourceDocumentId: fact.sourceDocumentId,
          pageNumber: fact.pageNumber,
          excerpt: fact.excerpt,
          confidence: fact.confidence,
        };
      })
      .filter((citation): citation is Citation => citation !== null);
  }
}

export function createCitationExtractor(): CitationExtractor {
  return new CitationExtractor();
}
```

---

## 10. Prompt Engineering

### Prompt Library Structure

```typescript
// src/prompts/types.ts
export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  userPromptTemplate: string;
  temperature: number;
  maxTokens: number;
  variables: string[]; // Placeholder names like {query}, {context}
}

// Example: Fact Extraction Prompt
export const FACT_EXTRACTION_PROMPT: PromptTemplate = {
  id: 'fact-extraction',
  name: 'Fact Extraction',
  description: 'Extract verifiable facts from document chunks',
  systemPrompt: `You are a fact extraction specialist for M&A due diligence.
Extract ONLY verifiable facts from the provided document excerpt.
Each fact MUST include:
1. Subject-predicate-object triple
2. Page number where it appears
3. Exact excerpt (verbatim quote)
4. Confidence score (0-1)

Return facts as JSON array. DO NOT infer or extrapolate beyond what is explicitly stated.`,
  userPromptTemplate: `Document: {documentName}
Page {pageNumber}

Excerpt:
---
{excerpt}
---

Extract all verifiable facts as JSON.`,
  temperature: 0.0, // Highly factual
  maxTokens: 2048,
  variables: ['documentName', 'pageNumber', 'excerpt'],
};
```

### Prompt Compiler

```typescript
// src/prompts/compiler.ts
import type { PromptTemplate } from './types';

export class PromptCompiler {
  compile(template: PromptTemplate, variables: Record<string, string>): string {
    let compiled = template.userPromptTemplate;

    // Replace variables
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{${key}}`;
      compiled = compiled.replace(new RegExp(placeholder, 'g'), value);
    }

    return compiled;
  }

  validate(template: PromptTemplate, variables: Record<string, string>): boolean {
    return template.variables.every(variable => variable in variables);
  }
}

export function createPromptCompiler(): PromptCompiler {
  return new PromptCompiler();
}
```

---

## 11. RAG Integration

```typescript
// src/rag/context.ts
import type { Fact } from '@trato-hive/shared';
import { LLMService } from '../llm';
import { CitationExtractor, createCitationExtractor } from './citations';

export interface RAGContext {
  query: string;
  facts: Fact[];
  maxContextTokens: number;
}

export interface RAGResponse {
  answer: string;
  citations: { factId: string; excerpt: string }[];
  tokensUsed: number;
}

export class RAGService {
  buildContextPrompt(context: RAGContext): string {
    let prompt = `Question: ${context.query}\n\nRelevant Facts:\n`;

    context.facts.forEach((fact, index) => {
      prompt += `\n[${index + 1}] ${fact.content}`;
      prompt += `\n    Source: ${fact.sourceDocumentId}, Page ${fact.pageNumber}`;
      prompt += `\n    Excerpt: "${fact.excerpt}"`;
    });

    prompt += `\n\nProvide a comprehensive answer citing facts using [1], [2], etc. markers.`;

    return prompt;
  }

  async query(context: RAGContext, llmService: LLMService): Promise<RAGResponse> {
    const prompt = this.buildContextPrompt(context);

    const response = await llmService.generate({
      prompt,
      systemPrompt: 'You are an M&A analyst. Answer questions using ONLY the provided facts. Always cite sources using [1], [2] notation.',
      temperature: 0.2,
      maxTokens: context.maxContextTokens,
    });

    const extractor = createCitationExtractor();
    const citations = extractor.linkCitations(response.text, context.facts);

    return {
      answer: response.text,
      citations: citations.map(c => ({ factId: c.factId, excerpt: c.excerpt })),
      tokensUsed: response.usage.totalTokens,
    };
  }
}

export function createRAGService(): RAGService {
  return new RAGService();
}
```

---

## 12. Exported Interfaces

```typescript
// src/index.ts
export { LLMService, createLLMService } from './llm';
export { EmbeddingService, createEmbeddingService } from './embeddings/openai';
export { StreamingService, createStreamingService } from './streaming/vercel-ai';
export { RAGService, createRAGService } from './rag/context';
export { CitationExtractor, createCitationExtractor } from './rag/citations';
export { PromptCompiler, createPromptCompiler, FACT_EXTRACTION_PROMPT } from './prompts';

export type {
  LLMRequest,
  LLMResponse,
  LLMProvider,
} from './providers/types';

export type {
  StreamOptions,
} from './streaming/vercel-ai';

export type {
  Citation,
} from './rag/citations';

export type {
  RAGContext,
  RAGResponse,
} from './rag/context';

export type {
  PromptTemplate,
} from './prompts/types';
```

---

## 13. Integration Examples

### From semantic-layer (Fact Extraction)

```typescript
import { createLLMService, createEmbeddingService, FACT_EXTRACTION_PROMPT } from '@trato-hive/ai-core';

export async function extractFactsFromChunk(chunk: DocumentChunk) {
  const llm = createLLMService('anthropic');
  const embeddings = createEmbeddingService();

  // Extract facts using LLM
  const response = await llm.generate({
    prompt: FACT_EXTRACTION_PROMPT.userPromptTemplate
      .replace('{documentName}', chunk.documentName)
      .replace('{pageNumber}', chunk.pageNumber.toString())
      .replace('{excerpt}', chunk.content),
    systemPrompt: FACT_EXTRACTION_PROMPT.systemPrompt,
    temperature: 0.0,
  });

  const facts = JSON.parse(response.text);

  // Generate embeddings for facts
  const factTexts = facts.map((f: any) => f.content);
  const factEmbeddings = await embeddings.batchGenerate(factTexts);

  return { facts, embeddings: factEmbeddings };
}
```

### From agents (Workflow Orchestration)

```typescript
import { createLLMService, createStreamingService } from '@trato-hive/ai-core';

export async function generateDealSummary(dealId: string) {
  const streaming = createStreamingService();

  // Stream summary generation
  for await (const chunk of streaming.streamCompletion({
    prompt: `Summarize deal ${dealId} focusing on financial metrics, risks, and opportunities.`,
    systemPrompt: 'You are an M&A analyst. Always cite sources.',
    temperature: 0.3,
  })) {
    // Send chunks to client via WebSocket
    sendToClient(chunk);
  }
}
```

### From apps/api (tRPC Endpoint)

```typescript
import { createRAGService, createLLMService } from '@trato-hive/ai-core';
import { router, protectedProcedure } from '../trpc';

export const aiRouter = router({
  query: protectedProcedure
    .input(z.object({ query: z.string(), dealId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Retrieve relevant facts from semantic-layer
      const facts = await semanticLayer.searchFacts({
        query: input.query,
        dealId: input.dealId,
        limit: 10,
      });

      // Query with RAG
      const rag = createRAGService();
      const llm = createLLMService();

      const response = await rag.query({
        query: input.query,
        facts,
        maxContextTokens: 4096,
      }, llm);

      return response;
    }),
});
```

---

## 14. Testing Requirements

### Coverage Target: ≥80%

**Unit Tests:**
- Provider selection logic
- Retry with exponential backoff
- Citation extraction accuracy
- Prompt compilation with variables
- Embedding caching

**Integration Tests:**
- Mock LLM responses (avoid API calls in tests)
- RAG query flow (context → LLM → citations)
- Streaming response handling

### Example Test

```typescript
// src/rag/citations.test.ts
import { describe, it, expect } from 'vitest';
import { CitationExtractor } from './citations';

describe('CitationExtractor', () => {
  const extractor = new CitationExtractor();

  it('should extract citation markers from text', () => {
    const text = 'Revenue was $10M [1] with 25% growth [2].';
    const markers = extractor.extractMarkers(text);

    expect(markers).toEqual([1, 2]);
  });

  it('should link markers to facts', () => {
    const text = 'EBITDA was $5M [1].';
    const facts = [
      {
        id: 'fact-1',
        sourceDocumentId: 'doc-1',
        pageNumber: 5,
        excerpt: 'EBITDA: $5M',
        confidence: 0.95,
      },
    ];

    const citations = extractor.linkCitations(text, facts as any);

    expect(citations).toHaveLength(1);
    expect(citations[0].factId).toBe('fact-1');
    expect(citations[0].pageNumber).toBe(5);
  });

  it('should deduplicate citation markers', () => {
    const text = 'Fact [1] repeated [1] again [1].';
    const markers = extractor.extractMarkers(text);

    expect(markers).toEqual([1]);
  });
});
```

---

## 15. Common Patterns

### Pattern 1: Provider Factory

```typescript
function getLLMService(): LLMService {
  const provider = process.env.DEFAULT_LLM_PROVIDER || 'anthropic';
  return createLLMService(provider as 'anthropic' | 'gemini');
}
```

### Pattern 2: Retry with Exponential Backoff

```typescript
async function retryWithBackoff<T>(fn: () => Promise<T>): Promise<T> {
  const maxRetries = 3;
  const initialDelay = 1000;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, initialDelay * Math.pow(2, i)));
    }
  }
  throw new Error('Unreachable');
}
```

### Pattern 3: Token Budget Management

```typescript
function estimateTokens(text: string): number {
  // Rough estimate: ~4 chars per token
  return Math.ceil(text.length / 4);
}

function truncateToTokenLimit(text: string, maxTokens: number): string {
  const estimatedTokens = estimateTokens(text);
  if (estimatedTokens <= maxTokens) return text;

  const ratio = maxTokens / estimatedTokens;
  return text.slice(0, Math.floor(text.length * ratio));
}
```

---

## 16. Anti-Patterns

### ❌ DON'T hardcode provider

```typescript
// Bad
const llm = new AnthropicProvider(apiKey);

// Good
const llm = createLLMService(); // Uses config
```

### ❌ DON'T skip retry logic

```typescript
// Bad
const response = await provider.generate(request);

// Good
const response = await retryWithBackoff(() => provider.generate(request));
```

### ❌ DON'T ignore token limits

```typescript
// Bad
const response = await llm.generate({ prompt: longPrompt });

// Good
const truncated = truncateToTokenLimit(longPrompt, 100000);
const response = await llm.generate({ prompt: truncated });
```

### ❌ DON'T skip citations

```typescript
// Bad - no citation linking
return { answer: response.text };

// Good
const citations = extractor.linkCitations(response.text, facts);
return { answer: response.text, citations };
```

---

## 17. Troubleshooting

### Problem: "Invalid API key" errors

**Solution:** Verify environment variables:

```bash
# Check keys are set
echo $ANTHROPIC_API_KEY
echo $GEMINI_API_KEY
echo $OPENAI_API_KEY

# Restart server after setting
```

### Problem: Rate limiting (429 errors)

**Solution:** Implement exponential backoff (already included) and reduce request rate:

```typescript
// Add delay between requests
await new Promise(resolve => setTimeout(resolve, 1000));
```

### Problem: Token limit exceeded

**Solution:** Truncate prompts or reduce maxTokens:

```typescript
const truncated = truncateToTokenLimit(prompt, 90000); // Leave 10k for response
```

### Problem: Streaming connection drops

**Solution:** Add timeout and reconnect logic:

```typescript
const timeout = setTimeout(() => stream.abort(), 30000); // 30s timeout
```

---

## 18. Non-Negotiables

1. **Flexible provider configuration** (no hardcoded providers)
2. **Always track token usage** (for cost monitoring)
3. **Always extract citations** (citation-first principle)
4. **≥80% test coverage** (unit + integration)
5. **Retry logic REQUIRED** (exponential backoff, 3 attempts)
6. **No hardcoded prompts** (use prompt library)
7. **Type-safe interfaces** (no `any` types)
8. **Embeddings MUST be 3,072 dims** (text-embedding-3-large)
9. **Stream for long outputs** (>1000 tokens)
10. **Security review for prompt changes** (prevent injection attacks)

---

## 19. Resources

**Documentation:**
- Root CLAUDE.md Section 9 (Tools & Commands - Context7 MCP)
- docs/architecture/tic-core.md (Layer 3 architecture)
- packages/semantic-layer/CLAUDE.md (RAG integration)
- packages/agents/CLAUDE.md (Workflow orchestration)

**External:**
- [Anthropic SDK TypeScript](https://github.com/anthropics/anthropic-sdk-typescript)
- [Vercel AI SDK](https://ai-sdk.dev/)
- [LangChain Docs](https://js.langchain.com/docs/)
- [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings)

**Context7 References:**
- Anthropic SDK: `/anthropics/anthropic-sdk-typescript`
- AI SDK: `/websites/ai-sdk_dev`
- LangChain: `/websites/langchain_oss_javascript_langchain`
