# Agents Package (@trato-hive/agents)

## Purpose

Agentic Orchestration (Layer 4) for multi-step AI workflows. Agents power the AI features in Trato Hive's **Notion-like Block Protocol** experience, enabling document processing, Q&A with citations, and intelligent suggestions that users can approve.

## Tech Stack

- **Orchestration:** LangGraph, LangChain.js
- **Queue:** BullMQ (Redis-backed) via `@trato-hive/data-plane`
- **AI:** `@trato-hive/ai-core` (LLM, RAG), `@trato-hive/semantic-layer` (Facts, Vectors)
- **Storage:** `@trato-hive/data-plane` (S3, Reducto)

## Agent Types

| Agent | Purpose | Triggers | Outputs |
|-------|---------|----------|---------|
| **DocumentAgent** | Process uploaded documents | Document upload to VDR | Facts, Embeddings, Chunks → AISuggestionBlocks |
| **DiligenceAgent** | Answer questions with citations | User asks in QABlock | Answer + CitationAttributes for CitationBlock |
| **SourcingAgent** | Company discovery & lookalike search | Search query | Company matches |
| **PipelineAgent** | Deal monitoring & next step suggestions | Deal stage change | Suggested actions |
| **GeneratorAgent** | Document creation (IC Decks, LOIs) | User request | Generated document |

---

## Block Protocol Integration

Agents are designed to work seamlessly with the Notion-like editor and Block Protocol:

### DocumentAgent → AI Suggestions Flow

```
Document Upload
      ↓
┌─────────────────────────────────────────────────────────────────┐
│  DocumentAgent.processDocument(documentId)                       │
│  ─────────────────────────────────────────                       │
│  1. Fetch document from S3 (data-plane/storage)                 │
│  2. Parse with Reducto AI (data-plane/reducto)                  │
│  3. Store DocumentChunks in database                            │
│  4. Generate embeddings (semantic-layer/embeddings)             │
│  5. Index in Pinecone (semantic-layer/vector-store)             │
│  6. Extract Facts (semantic-layer/facts)                        │
│  7. Update Document.status → INDEXED                            │
└─────────────────────────────────────────────────────────────────┘
      ↓
Facts stored in database
      ↓
┌─────────────────────────────────────────────────────────────────┐
│  Phase 10: EntityFactMapper                                      │
│  ─────────────────────────────                                   │
│  Maps facts to entity fields and database entries               │
│  • Deal.expectedCloseDate ← "Close Date is March 31"            │
│  • "DD Tracker" row ← "Legal review due Feb 28"                 │
└─────────────────────────────────────────────────────────────────┘
      ↓
AISuggestionBlock appears in Deal page for user approval
```

### DiligenceAgent → Q&A with Citations Flow

```
User asks: "What is the EBITDA?"
      ↓
┌─────────────────────────────────────────────────────────────────┐
│  DiligenceAgent.answerQuestion(query)                            │
│  ─────────────────────────────────────                           │
│  1. Embed query (semantic-layer/embeddings)                     │
│  2. Vector search in Pinecone (semantic-layer/vector-store)     │
│  3. Retrieve top-k DocumentChunks                               │
│  4. Build RAG context prompt (ai-core/rag)                      │
│  5. Generate answer with LLM (ai-core/llm)                      │
│  6. Extract citation indices [1], [2] (ai-core/rag)             │
│  7. Map to CitationAttributes                                   │
└─────────────────────────────────────────────────────────────────┘
      ↓
Returns: { answer: "EBITDA is $5.2M [1]", citations: CitationAttributes[] }
      ↓
QABlock displays answer → User clicks "Insert Citation" → CitationBlock added
```

---

## Architecture

### File Structure

```
src/
├── document-agent.ts   # Document processing orchestrator
├── diligence-agent.ts  # RAG Q&A with citations
├── sourcing-agent.ts   # Company search & discovery
├── pipeline-agent.ts   # Deal monitoring & suggestions
├── generator-agent.ts  # Document generation
├── workers.ts          # BullMQ worker registration
└── index.ts            # Package exports
```

### Worker Pattern (BullMQ)

```typescript
// workers.ts
new Worker(
  'document-processing',
  async (job) => {
    const agent = new DocumentAgent(config);
    await agent.processDocument(job.data.documentId);
  },
  { connection, limiter: { max: 5, duration: 1000 } }
);
```

### State Graph Pattern (LangGraph)

```typescript
// diligence-agent.ts
const workflow = new StateGraph(DiligenceState)
  .addNode('retrieve', retrieveChunks)
  .addNode('generate', generateAnswer)
  .addNode('cite', extractCitations)
  .addEdge('__start__', 'retrieve')
  .addEdge('retrieve', 'generate')
  .addEdge('generate', 'cite')
  .compile();
```

---

## Output Types (Block Protocol Compatible)

### CitationAttributes (for CitationBlock)

```typescript
interface CitationAttributes {
  factId: string;        // → Fact.id in database
  sourceText: string;    // → Original text excerpt
  confidence: number;    // → 0.0 - 1.0
  documentName: string;  // → Document.name
  subject: string;       // → "EBITDA"
  predicate: string;     // → "is"
  object: string;        // → "$5.2M"
}
```

### AISuggestion (for AISuggestionBlock)

```typescript
interface AISuggestion {
  entityType: 'Deal' | 'Company' | 'Database';
  entityId: string;
  field?: string;           // For entity field updates
  databaseId?: string;      // For database row suggestions
  suggestedValue: unknown;
  sourceFactId: string;
  confidence: number;
  sourceDocumentName: string;
}
```

---

## Non-Negotiables

- **Resilience:** All agents must handle retries and resume from state (BullMQ job persistence).
- **Citations:** All Q&A outputs must return `CitationAttributes[]` for CitationBlock.
- **Suggestions:** Entity updates must use AISuggestionBlock pattern (human-in-the-loop approval).
- **Async:** Long-running tasks (document processing) must use BullMQ queues.
- **Cost:** Track token usage per run via `ai-core` cost tracking.
- **Multi-tenancy:** All operations scoped to `organizationId`.

---

## Dependencies

```json
{
  "@trato-hive/ai-core": "workspace:*",
  "@trato-hive/semantic-layer": "workspace:*",
  "@trato-hive/data-plane": "workspace:*",
  "@trato-hive/db": "workspace:*",
  "@langchain/langgraph": "^0.2.0",
  "bullmq": "^5.0.0"
}
```

---

## Implementation Status

| Component | Status | Task |
|-----------|--------|------|
| DocumentAgent | ❌ Placeholder | TASK-044 |
| DiligenceAgent | ❌ Placeholder | TASK-045 |
| SourcingAgent | ✅ Basic | Phase 6 |
| PipelineAgent | ✅ Basic | Phase 6 |
| GeneratorAgent | ✅ Basic | Phase 6 |
| Agent Testing | ❌ Not started | TASK-046 |
