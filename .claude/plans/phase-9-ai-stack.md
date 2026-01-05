# Phase 9: AI Stack Implementation Plan

## Executive Summary

**Objective:** Implement the AI Stack (Layers 1-4) for Trato Hive, enabling document parsing, fact extraction, semantic search, and AI-powered Q&A with citations that integrate with the existing Notion-style Block Protocol.

**Status:** 🔄 IN PROGRESS (69% complete - 11/16 tasks)
**Last Updated:** January 5, 2026

| Sub-Phase | Status | Tasks | Hours |
|-----------|--------|-------|-------|
| 9.1: ai-core | ✅ Complete | 4/4 | 21h |
| 9.2: semantic-layer | ✅ Complete | 3/4 | 17h |
| 9.3: data-plane | ✅ Complete | 4/4 | 17h |
| 9.4: agents | ❌ Placeholder | 0/3 | 0h |

**Estimated Hours:** ~55 hours total (~54h completed, ~25h remaining)
**Coverage Target:** 70%
**Prerequisites:** Phase 8 Complete, API Keys configured in `.env`

---

## Block Protocol Integration (Critical)

The AI Stack powers the existing Notion-style editor. The **CitationBlock** (already built) expects:

```typescript
// What CitationBlock needs (from Phase 7):
interface CitationAttributes {
    factId: string;        // → Fact.id (database)
    sourceText: string;    // → Fact.sourceText
    confidence: number;    // → Fact.confidence
    documentName: string;  // → Document.name
    subject: string;       // → Fact.subject
    predicate: string;     // → Fact.predicate
    object: string;        // → Fact.object
}
```

**The AI Stack's job:** Populate these fields from documents.

### Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     DOCUMENT PROCESSING FLOW                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  User uploads PDF to VDR (apps/web)                                │
│         │                                                           │
│         ▼                                                           │
│  ┌─────────────────┐                                               │
│  │  Document       │  status: UPLOADING                            │
│  │  (Database)     │  fileUrl: S3 presigned URL                    │
│  └────────┬────────┘                                               │
│           │                                                         │
│           ▼                                                         │
│  ┌─────────────────┐    ┌─────────────────┐                        │
│  │  BullMQ Queue   │───▶│ DocumentAgent   │  (packages/agents)     │
│  └─────────────────┘    └────────┬────────┘                        │
│                                  │                                  │
│           ┌──────────────────────┼──────────────────────┐          │
│           ▼                      ▼                      ▼          │
│  ┌────────────────┐    ┌────────────────┐    ┌────────────────┐   │
│  │ Reducto Parse  │    │ Generate       │    │ Extract Facts  │   │
│  │ (data-plane)   │    │ Embeddings     │    │ (semantic)     │   │
│  └───────┬────────┘    │ (semantic)     │    └───────┬────────┘   │
│          │             └───────┬────────┘            │             │
│          ▼                     ▼                     ▼             │
│  ┌────────────────┐    ┌────────────────┐    ┌────────────────┐   │
│  │ DocumentChunk  │    │   Pinecone     │    │     Fact       │   │
│  │ (Database)     │    │   (Vector)     │    │   (Database)   │   │
│  └────────────────┘    └────────────────┘    └────────────────┘   │
│                                                                     │
│  Document.status: INDEXED ✓                                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      Q&A FLOW (RAG)                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  User asks: "What is the company's EBITDA?"                        │
│         │                                                           │
│         ▼                                                           │
│  ┌─────────────────────────────────────────────┐                   │
│  │  DiligenceAgent.answerQuestion()            │                   │
│  │  (packages/agents)                          │                   │
│  └─────────────────────┬───────────────────────┘                   │
│                        │                                            │
│  ┌─────────────────────┼─────────────────────────┐                 │
│  │                     ▼                         │                 │
│  │  1. VectorStore.similaritySearch(query)      │                 │
│  │     → Returns top 5 relevant DocumentChunks  │                 │
│  │                                               │                 │
│  │  2. RAGService.buildContextPrompt()          │                 │
│  │     → "[1] EBITDA was $5.2M in FY2024..."   │                 │
│  │                                               │                 │
│  │  3. LLMClient.generate(prompt)               │                 │
│  │     → "The company's EBITDA is $5.2M [1]"   │                 │
│  │                                               │                 │
│  │  4. CitationExtractor.extractCitations()     │                 │
│  │     → [{ index: 1, factId: "xxx", ... }]    │                 │
│  └───────────────────────────────────────────────┘                 │
│                        │                                            │
│                        ▼                                            │
│  ┌─────────────────────────────────────────────┐                   │
│  │  {                                          │                   │
│  │    answer: "The company's EBITDA is $5.2M", │                   │
│  │    citations: [{                            │                   │
│  │      factId: "clq9012345...",              │                   │
│  │      sourceText: "EBITDA was $5.2M...",    │                   │
│  │      confidence: 0.95,                      │                   │
│  │      documentName: "Q4 Financials.pdf",    │                   │
│  │      subject: "EBITDA",                     │                   │
│  │      predicate: "is",                       │                   │
│  │      object: "$5.2M"                        │                   │
│  │    }]                                       │                   │
│  │  }                                          │                   │
│  └─────────────────────────────────────────────┘                   │
│                        │                                            │
│                        ▼                                            │
│  User clicks "Insert as Citation"                                  │
│                        │                                            │
│                        ▼                                            │
│  ┌─────────────────────────────────────────────┐                   │
│  │  CitationBlock (existing Tiptap extension)  │                   │
│  │  Renders: "EBITDA is $5.2M" with shield     │                   │
│  │  Hover shows source document tooltip        │                   │
│  └─────────────────────────────────────────────┘                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Current State Analysis

### What Already Exists

| Component | Status | Location |
|-----------|--------|----------|
| **CitationBlock** | ✅ Complete | `apps/web/src/components/editor/extensions/CitationBlock.tsx` |
| **Fact model** | ✅ Complete | `packages/db/prisma/schema.prisma` (type, subject, predicate, object, confidence, sourceText) |
| **Document model** | ✅ Complete | With status enum: UPLOADING → PROCESSING → PARSED → INDEXED |
| **DocumentChunk model** | ✅ Complete | With vectorId for Pinecone reference |
| **BullMQ Queue** | ✅ Complete | `packages/data-plane/src/queue.ts` |
| **LLMClient** | ✅ Complete | Full Claude/OpenAI with retry, cost tracking, streaming |
| **VectorStore** | ✅ Complete | Pinecone multi-tenant search with metadata filtering |
| **FactExtractor** | ✅ Complete | LLM-powered extraction with Zod validation |
| **EmbeddingService** | ✅ Complete | OpenAI text-embedding-3-small integration |
| **ReductoClient** | ✅ Complete | Sync/async parsing with job polling |
| **StorageClient** | ✅ Complete | S3 with multi-tenant isolation |
| **DocumentQueue** | ✅ Complete | BullMQ with 5 job types |
| **DiligenceAgent** | ❌ Placeholder | Throws "not implemented" |
| **DocumentAgent** | ❌ Placeholder | Throws "not implemented" |

### What Phase 9 Builds

1. **Complete LLM Service** - Retry logic, cost tracking, streaming
2. **Complete VectorStore** - Similarity search with multi-tenancy
3. **Implement FactExtractor** - LLM-powered extraction to create `Fact` records
4. **Implement DocumentAgent** - Full workflow: parse → embed → extract → index
5. **Implement DiligenceAgent** - RAG Q&A returning `CitationAttributes`

---

## Task Breakdown

### Phase 9.1: packages/ai-core ✅ COMPLETE (21 hours)

#### [TASK-031] LLM Service Enhancement (8 hours) ✅

**Goal:** Production-ready LLM client with retry, cost tracking, and proper error handling.

**Changes to `packages/ai-core/src/llm.ts`:**

```typescript
// Add these features:
interface LLMResponse {
  content: string;
  tokensUsed: { prompt: number; completion: number };
  model: string;
  cost: number;  // Track for billing
  latencyMs: number;
}

class LLMClient {
  // Retry with exponential backoff
  async generateWithRetry(prompt: string, maxRetries = 3): Promise<LLMResponse>;

  // Structured output for fact extraction
  async generateJSON<T>(prompt: string, schema: z.ZodSchema<T>): Promise<T>;
}
```

**Tests:** Retry logic, cost calculation, error types

**Completed Implementation:**
- Production-ready LLM client with retry logic and exponential backoff
- Cost tracking per model with `MODEL_PRICING` constants
- Error classification (RATE_LIMIT, AUTH, TIMEOUT, CONTEXT_LENGTH, etc.)
- Support for Claude (Anthropic SDK) and OpenAI/Kimi (LangChain)
- `generateJSON()` for structured output with Zod validation
- 26 unit tests in `llm.test.ts`

---

#### [TASK-032] Streaming Service (4 hours) ✅

**Goal:** Real-time streaming for chat-like interactions.

```typescript
// Using Vercel AI SDK
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

async *streamResponse(prompt: string): AsyncGenerator<string> {
  const result = streamText({
    model: anthropic('claude-sonnet-4-5-20250514'),
    messages: [{ role: 'user', content: prompt }],
  });
  for await (const chunk of result.textStream) {
    yield chunk;
  }
}
```

**Completed Implementation:**
- Vercel AI SDK integration for streaming chat UI
- `streamResponse()` and `streamChat()` async generators
- Both Claude and OpenAI provider support
- `getStreamResult()` for Next.js API route compatibility

---

#### [TASK-034] Citation Extraction (6 hours) ✅

**Goal:** Extract `[1]`, `[2]` markers from LLM output and link to source facts.

```typescript
interface ExtractedCitation {
  index: number;           // [1], [2], etc.
  factId: string;          // Link to Fact record
  sourceText: string;      // Original text from document
  confidence: number;      // Semantic similarity score
  documentName: string;    // Document.name
  subject: string;         // "EBITDA"
  predicate: string;       // "is"
  object: string;          // "$5.2M"
}

// This is what CitationBlock needs!
```

**Completed Implementation:**
- `CitationAttributes` types compatible with CitationBlock
- `extractCitationIndices()` for [N] marker parsing
- `mapFactsToCitations()` and `mapChunksToCitations()`
- `validateCitations()` and `cleanInvalidCitations()`
- Build context prompts for RAG with numbered citations
- 23 unit tests in `rag.test.ts`

---

#### [TASK-035] AI Core Testing (3 hours) ✅

**Completed:** 49 total unit tests (26 llm.test.ts, 23 rag.test.ts) with 70% coverage thresholds.

---

### Phase 9.3: packages/data-plane ✅ COMPLETE (17 hours)

#### [TASK-040] Reducto AI Integration (6 hours) ✅

**Goal:** Parse documents and extract chunks with bounding boxes.

```typescript
interface ReductoParseResult {
  chunks: Array<{
    content: string;
    pageNumber: number;
    boundingBox?: { x: number; y: number; width: number; height: number };
  }>;
  metadata: { pageCount: number; title?: string };
}

// Creates DocumentChunk records linked to Document
```

**Completed Implementation:**
- `ReductoClient` with sync and async parsing modes
- `ParsedChunk` and `ParsedTable` types with bounding boxes
- Job polling with `waitForJob()` for async operations
- Error classification (RATE_LIMIT, AUTH, TIMEOUT, etc.)
- 32 unit tests in `reducto.test.ts`

---

#### [TASK-041] S3 Storage Client (4 hours) ✅

**Goal:** Upload files, generate presigned URLs for download.

```typescript
class StorageClient {
  async upload(file: Buffer, organizationId: string, filename: string): Promise<string>;
  async getPresignedUrl(key: string, expiresIn?: number): Promise<string>;
}

// Multi-tenancy: S3 keys start with {organizationId}/
```

**Completed Implementation:**
- Multi-tenant isolation with organizationId prefix in S3 keys
- Presigned URL generation for upload/download
- File validation (size limits, MIME type checking)
- Error classification (NOT_FOUND, ACCESS_DENIED, etc.)
- 24 unit tests in `storage.test.ts`

---

#### [TASK-042] BullMQ Queue Enhancement (4 hours) ✅

**Completed Implementation:**
- Multiple job types: process-document, generate-embeddings, extract-facts, reindex, delete
- `DocumentQueueWorker` with rate limiting
- Queue status and management functions
- Factory functions with env var support
- 26 unit tests in `queue.test.ts`

---

#### [TASK-043] Data Plane Testing (3 hours) ✅

**Completed:** 82 total unit tests (24 storage + 32 reducto + 26 queue) with 70% coverage thresholds.

---

### Phase 9.2: packages/semantic-layer ✅ COMPLETE (17 hours)

#### [TASK-036] Vector Store (Pinecone) (6 hours) ✅

**Goal:** Similarity search with namespace isolation per organization.

```typescript
interface SearchResult {
  chunkId: string;
  content: string;
  score: number;
  metadata: {
    documentId: string;
    pageNumber?: number;
    organizationId: string;
  };
}

async similaritySearch(
  query: string,
  organizationId: string,  // Pinecone namespace
  options?: { topK?: number }
): Promise<SearchResult[]>
```

**Completed Implementation:**
- Multi-tenant vector storage with organizationId namespaces
- Upsert, search, delete operations with batch processing
- Metadata filtering (documentId, pageNumber, boundingBox)
- Factory functions with env var support
- 22 unit tests in `vector-store.test.ts`

---

#### [TASK-037] Fact Extraction (8 hours) ✅

**Goal:** LLM-powered extraction that creates `Fact` records.

**This is the critical integration point!**

```typescript
// Input: DocumentChunk
// Output: Fact records (matching CitationBlock attributes)

interface ExtractedFact {
  type: 'FINANCIAL_METRIC' | 'LEGAL_CLAUSE' | 'KEY_PERSON' | ...;
  subject: string;      // "Revenue"
  predicate: string;    // "is"
  object: string;       // "$10M"
  confidence: number;   // 0.95
  sourceChunkId: string;
  sourceText: string;   // Original excerpt
}

// Creates Fact record in database
// Links to Company via Document.companyId
```

**Prompt Template:**
```
Extract structured facts from this document chunk.
For each fact, identify:
- Subject: The entity or metric being described
- Predicate: The relationship or verb
- Object: The value or description
- Confidence: Your confidence (0.0-1.0)

Return as JSON array.
```

**Completed Implementation:**
- LLM-powered extraction with structured output (Zod validation)
- `FactType` enum: FINANCIAL_METRIC, KEY_PERSON, PRODUCT, CUSTOMER, RISK, OPPORTUNITY
- Confidence thresholds (0.7) and deduplication
- Database storage with Prisma integration
- Utility functions: `formatFact`, `groupFactsByType`, `sortFactsByConfidence`
- 24 unit tests in `facts.test.ts`

---

#### [TASK-038] Knowledge Graph (Neo4j) - DEFERRED

Deferred for future implementation. Basic entity relationships only.

---

#### [TASK-039] Semantic Layer Testing (3 hours) ✅

**Completed:** 66 total unit tests (22 vector-store + 20 embeddings + 24 facts) with 70% coverage thresholds.

---

### Phase 9.4: packages/agents ❌ PLACEHOLDER (25 hours remaining)

#### [TASK-044] Document Agent (10 hours) ❌ NOT STARTED

**Goal:** Orchestrate the full document processing pipeline.

**Current State:** Placeholder implementation that throws "not implemented" error.

```typescript
class DocumentAgent {
  async processDocument(documentId: string): Promise<void> {
    // 1. Update status: PROCESSING
    await db.document.update({ where: { id: documentId }, data: { status: 'PROCESSING' } });

    // 2. Get document and S3 URL
    const doc = await db.document.findUnique({ where: { id: documentId } });
    const url = await storageClient.getPresignedUrl(doc.fileUrl);

    // 3. Parse with Reducto
    const parsed = await reductoClient.parseDocument(url);
    await db.document.update({ where: { id: documentId }, data: { status: 'PARSED' } });

    // 4. Store chunks
    for (const chunk of parsed.chunks) {
      await db.documentChunk.create({
        data: {
          documentId,
          content: chunk.content,
          pageNumber: chunk.pageNumber,
          boundingBox: chunk.boundingBox,
        }
      });
    }

    // 5. Generate embeddings and index in Pinecone
    const chunks = await db.documentChunk.findMany({ where: { documentId } });
    for (const chunk of chunks) {
      const vectorId = await vectorStore.addDocument({
        content: chunk.content,
        metadata: { chunkId: chunk.id, documentId, organizationId: doc.organizationId }
      });
      await db.documentChunk.update({ where: { id: chunk.id }, data: { vectorId } });
    }

    // 6. Extract facts
    for (const chunk of chunks) {
      const facts = await factExtractor.extractFacts(chunk);
      for (const fact of facts) {
        await db.fact.create({
          data: {
            documentId,
            companyId: doc.companyId,
            type: fact.type,
            subject: fact.subject,
            predicate: fact.predicate,
            object: fact.object,
            confidence: fact.confidence,
            sourceChunkId: chunk.id,
            sourceText: fact.sourceText,
            extractedBy: 'claude-sonnet-4.5',
          }
        });
      }
    }

    // 7. Update status: INDEXED
    await db.document.update({ where: { id: documentId }, data: { status: 'INDEXED' } });
  }
}
```

---

#### [TASK-045] Diligence Agent (RAG) (12 hours) ❌ NOT STARTED

**Goal:** Answer questions with citations matching `CitationAttributes`.

**Current State:** Placeholder implementation that throws "not implemented" error.

```typescript
interface DiligenceQuery {
  question: string;
  dealId: string;
  companyId?: string;
}

interface DiligenceResponse {
  answer: string;
  citations: CitationAttributes[];  // Ready for CitationBlock!
}

class DiligenceAgent {
  async answerQuestion(query: DiligenceQuery): Promise<DiligenceResponse> {
    // 1. Search Pinecone for relevant chunks
    const searchResults = await vectorStore.similaritySearch(
      query.question,
      organizationId,
      { topK: 5 }
    );

    // 2. Fetch chunks and related facts
    const chunks = await db.documentChunk.findMany({
      where: { id: { in: searchResults.map(r => r.metadata.chunkId) } },
      include: { document: true }
    });

    const facts = await db.fact.findMany({
      where: { sourceChunkId: { in: chunks.map(c => c.id) } },
      include: { document: true }
    });

    // 3. Build context with numbered citations
    const context = ragService.buildContextPrompt({
      query: query.question,
      retrievedChunks: chunks.map((c, i) => ({
        content: c.content,
        source: c.document.name,
        score: searchResults[i].score,
      }))
    });

    // 4. Generate answer with LLM
    const answer = await llmClient.generate(context);

    // 5. Extract citations and map to CitationAttributes
    const citationIndices = ragService.extractCitations(answer);
    const citations: CitationAttributes[] = citationIndices.map(idx => {
      const fact = facts[idx - 1];
      return {
        factId: fact.id,
        sourceText: fact.sourceText,
        confidence: fact.confidence,
        documentName: fact.document.name,
        subject: fact.subject,
        predicate: fact.predicate,
        object: fact.object,
      };
    });

    return { answer, citations };
  }
}
```

---

#### [TASK-046] Agents Testing (3 hours) ❌ NOT STARTED

---

## New tRPC Procedures Needed

Add to `apps/api/src/routers/`:

```typescript
// documents.ts
export const documentRouter = router({
  upload: organizationProtectedProcedure
    .input(z.object({ name: z.string(), mimeType: z.string(), fileSize: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // 1. Create Document record
      // 2. Generate presigned upload URL
      // 3. Queue processing job
    }),

  getStatus: organizationProtectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      // Return document with status
    }),
});

// diligence.ts
export const diligenceRouter = router({
  askQuestion: organizationProtectedProcedure
    .input(z.object({ dealId: z.string().cuid(), question: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const agent = new DiligenceAgent();
      return agent.answerQuestion({
        question: input.question,
        dealId: input.dealId,
      });
    }),
});
```

---

## Environment Variables Required

```bash
# LLM (Required)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Vector Store (Required)
PINECONE_API_KEY=...
PINECONE_INDEX_NAME=trato-hive-embeddings

# Document Parsing (Required)
REDUCTO_API_KEY=...

# Storage (Required)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=trato-hive-documents
```

---

## Verification Checklist

After each task:
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes (70%+ coverage)
- [ ] CitationBlock can display facts from database
- [ ] Document processing updates status correctly
- [ ] Q&A returns properly formatted citations

---

## Sprint Schedule (Recommended)

### Sprint 1 (Days 1-3): ai-core
- [TASK-031] LLM Service
- [TASK-032] Streaming
- [TASK-034] Citation Extraction
- [TASK-035] AI Core Tests

### Sprint 2 (Days 4-6): data-plane
- [TASK-040] Reducto Integration
- [TASK-041] S3 Storage
- [TASK-043] Data Plane Tests

### Sprint 3 (Days 7-9): semantic-layer
- [TASK-036] Vector Store
- [TASK-037] Fact Extraction
- [TASK-039] Semantic Layer Tests

### Sprint 4 (Days 10-12): agents + integration
- [TASK-044] Document Agent
- [TASK-045] Diligence Agent
- [TASK-046] Agent Tests
- Integration testing with CitationBlock

---

## Implementation Progress Log

| Date | Milestone |
|------|----------|
| Jan 3, 2026 | Plan created, implementation started |
| Jan 5, 2026 | Phase 9.1 (ai-core) complete - 49 tests |
| Jan 5, 2026 | Phase 9.2 (semantic-layer) complete - 66 tests |
| Jan 5, 2026 | Phase 9.3 (data-plane) complete - 82 tests |

---

**Created:** January 3, 2026
**Last Updated:** January 5, 2026
**Author:** Claude Code
**Status:** 69% Complete - Agents implementation remaining
