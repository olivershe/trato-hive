# TIC Core (Layer 3)

**Status:** Draft
**Last Updated:** 2025‑11‑12
**Owner:** AI/ML Engineering Team
**Priority:** High

The **Trato Intelligence Core (TIC)** is the heart of the platform’s AI capabilities. It orchestrates large language models (LLMs), generates embeddings, extracts citations and returns verifiable answers to user queries. This document describes its responsibilities, components and interfaces.

## 1. Responsibilities

1. **LLM Orchestration:** Coordinate requests to LLM providers (OpenAI GPT‑4, Anthropic Claude) based on the context, prompt templates and cost constraints. Balance accuracy and cost by selecting appropriate models (e.g., gpt‑3.5 for drafts, gpt‑4 for final outputs).
2. **Embedding Generation:** Create vector embeddings for documents, facts and queries using models like `text-embedding-ada-002`. Manage caching of embeddings to minimise redundant computation.
3. **Reasoning Engine:** Combine retrieved facts with prompts to answer questions, summarise documents or generate content (e.g., IC decks). The reasoning pipeline is: *query → context retrieval → prompt assembly → LLM invocation → output parsing*.
4. **Citation Extraction:** Post‑process LLM outputs to identify claims and link them back to fact IDs. Use heuristics and alignment techniques (e.g., semantic similarity between answer segments and facts) to ensure citations accompany statements.
5. **Prompt Engineering & Templates:** Maintain a library of prompt templates for different tasks (question answering, summarisation, document generation). Support parameterisation (e.g., language, tone) and dynamic insertion of context.
6. **Model Governance:** Version control prompt templates and maintain a registry of model configurations. Implement A/B testing and fallback strategies to handle model failures. Track token usage and costs for optimisation.
7. **Exported Interfaces:** Provide functions to query the intelligence core, generate embeddings and extract citations.

## 2. Component Overview

| Component | Description |
|-----------|-------------|
| **Prompt Library** | YAML/JSON files storing prompt templates for each use case (e.g., summarisation, Q&A, deck generation). Supports placeholders for dynamic context insertion. |
| **Model Adapters** | Abstraction layers for different LLM providers (OpenAI, Anthropic). Each adapter handles API calls, error retries and response parsing. |
| **Embedding Service** | Generates and caches embeddings. Integrates with the Semantic Layer to store and retrieve embeddings. |
| **Citation Extractor** | Post‑processing module that aligns LLM outputs with facts; uses similarity metrics to attach citation IDs. |
| **Cost Manager** | Tracks token usage per request and selects models based on budget and SLA. |

## 3. Reasoning Workflow

1. **User Query:** The Experience Layer or an agent sends a query to `queryTIC()` along with optional parameters (desired format, language).
2. **Context Retrieval:** The TIC Core calls the Semantic Layer to retrieve relevant facts and documents based on the query (vector search and keyword matching). It compiles a context window (e.g., 4 k tokens) of facts and citations.
3. **Prompt Assembly:** The prompt library assembles a prompt using a template and inserts the user question, retrieved context and system instructions (e.g., “cite all facts in [cite] format”).
4. **LLM Invocation:** The appropriate model is selected based on cost/complexity. The model adapter sends the prompt and receives the response.
5. **Output Parsing:** The reasoning engine parses the output, extracts answer text and identifies any citations using the Citation Extractor.
6. **Return Response:** A structured response is returned containing the answer, citations and metadata (tokens used, model name, confidence).

## 4. Prompt Engineering Patterns

- **Few‑Shot Examples:** Include demonstrations in prompts to teach the LLM how to structure responses and cite facts.
- **System & User Separation:** Use clear system messages (instructions) and user messages to guide the model’s behaviour.
- **Chain‑of‑Thought Reduction:** Encourage the model to reason internally but return only the final answer and citations to avoid exposing unnecessary intermediate steps.
- **Language & Tone Controls:** Provide parameters to adjust tone (formal, concise) and language (EN, AR) depending on the audience.

## 5. Model Governance

1. **Model Registry:** Track available models, versions and usage metrics. Update prompts and models through a controlled pipeline.
2. **A/B Testing:** Route a percentage of requests to alternative prompts or models to evaluate performance. Collect metrics on accuracy, user satisfaction and cost.
3. **Fallback Strategies:** If the primary model fails or produces low‑confidence outputs, fall back to a secondary model or a rule‑based response. Implement timeouts to avoid blocking the user experience.
4. **Token Management:** Enforce token limits per request to control cost. Cache common embeddings and retrieved contexts to avoid repeated token usage.

## 6. Exported Interfaces

```typescript
// submit a query to the intelligence core and receive an answer with citations
async function queryTIC(params: {
  userId: string,
  firmId: string,
  query: string,
  format?: "plain" | "json" | "markdown",
  language?: string
}): Promise<{ answer: string, citations: Citation[], tokensUsed: number }>

// generate an embedding for a piece of text
async function generateEmbedding(text: string): Promise<number[]>

// extract citations from a generated answer (useful for post‑processing)
async function extractCitations(answer: string, context: Fact[]): Promise<Citation[]>
```

## 7. Token Optimisation Strategies

- **Context Truncation:** Prioritise facts with highest relevance scores and prune low‑impact content to fit within model context limits.
- **Streaming Responses:** For long outputs (e.g., deck generation), stream partial responses to the Experience Layer to improve perceived performance and avoid hitting maximum token limits.
- **Batch Embeddings:** Batch multiple embedding requests to reduce per‑call overhead.

## 8. Conclusion

The TIC Core enables Trato Hive to deliver intelligent, verifiable answers and documents. By orchestrating LLMs, embeddings and citation extraction, and by carefully managing prompts, costs and tokens, the TIC Core provides a flexible engine for building AI‑native workflows without relying on proprietary AI platforms. Future enhancements may include incorporating open‑weight models or fine‑tuning for domain specificity to further reduce costs.
