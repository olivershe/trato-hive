# AI Core Package (@trato-hive/ai-core)

## Purpose

TIC (Trato Intelligence Core) - Layer 3 reasoning engine for LLM orchestration, embeddings, and RAG.

## Tech Stack

- **LLM:** Anthropic Claude Sonnet 4.5 (Primary), Gemini (Fallback)
- **Embeddings:** OpenAI `text-embedding-3-large`
- **Streaming:** Vercel AI SDK
- **Framework:** LangChain

## Architecture

- **LLM Service:** Provider-agnostic wrapper with retry logic.
- **RAG Service:** Context builder and citation extractor.
- **Prompts:** Structured templates (`prompts/templates/`).

## Common Patterns

### LLM Generation

```typescript
// llm.ts
const llm = createLLMService('anthropic')
const response = await llm.generate({
  prompt: 'Analyze this deal...',
  temperature: 0.2,
})
```

### RAG Query

```typescript
// rag/context.ts
const rag = createRAGService()
const { answer, citations } = await rag.query(
  {
    query: 'What is the EBITDA?',
    facts: retrievedFacts,
  },
  llm
)
```

### Streaming

```typescript
// streaming/vercel-ai.ts
const stream = createStreamingService()
for await (const chunk of stream.streamCompletion({ prompt })) {
  // Handle chunk
}
```

## Non-Negotiables

- **Citations:** Extract `[1]` markers and link to facts.
- **Flexibility:** Support swapping LLM providers via config.
- **Type Safety:** Validate all LLM inputs/outputs with Zod.
- **Cost:** Track token usage for every request.
