# Semantic Layer Package (@trato-hive/semantic-layer)

**Parent:** Root CLAUDE.md
**Purpose:** Fact extraction, knowledge graph, vector indexing, and citation linking
**Last Updated:** 2025-11-18
**Layer Mapping:** Layer 2 (Semantic Layer) - Transforms documents into verifiable knowledge

---

## 1. Purpose

The Semantic Layer transforms raw documents into **structured, verifiable knowledge**. It provides:

1. **Fact Extraction:** Convert parsed documents into discrete facts with citations
2. **Knowledge Graph:** Maintain entities and relationships in Neo4j (Deals → Companies → Documents → Facts)
3. **Vector Indexing:** Store embeddings in Pinecone for semantic search and lookalike discovery
4. **Citation Linking:** Implement the "golden thread" linking every fact to its source document

**The Killer Feature:** Every number, statement, or insight displayed in Trato Hive **MUST** hyperlink back to the source document with page number and excerpt. This is the citation-first principle.

**Reference:** `/docs/architecture/semantic-layer.md`

---

## 2. Ownership

**Owner:** Knowledge Engineering Team
**Shared Responsibility:**
- Fact extraction accuracy and confidence scoring
- Knowledge graph schema and query patterns
- Vector indexing performance and relevance
- Citation verification and UI integration

**Changes Requiring Approval:**
- Fact schema modifications
- Neo4j graph schema changes
- Pinecone index configuration
- Citation linking algorithms

---

## 3. Technology Stack

**Knowledge Graph:**
- **Neo4j** 5.x - Graph database (via Docker Compose)
- **neo4j-driver** 5.x - Official JavaScript driver for Cypher queries
- Cypher query language for graph traversals

**Vector Database:**
- **Pinecone** - Managed vector database (required)
- **@pinecone-database/pinecone** - TypeScript client
- **text-embedding-3-large** - 3,072 dimensions (via ai-core)
- Cosine similarity for semantic search

**Dependencies:**
- **@trato-hive/db** - Prisma client for Fact/Document models
- **@trato-hive/data-plane** - Document parsing and storage
- **@trato-hive/ai-core** - LLM inference and embeddings
- **@trato-hive/shared** - Types, validators, constants

**Build & Test:**
- **tsup** 8.3.5 - Dual output (CJS + ESM)
- **Vitest** 2.1.8 - Unit and integration tests
- **TypeScript** 5.6.3 (strict mode)

---

## 4. Architecture

### Directory Structure

```
packages/semantic-layer/src/
├── index.ts              # Package exports
├── fact-extractor.ts     # Extract facts from documents
├── knowledge-graph.ts    # Neo4j client and queries
├── vector-store.ts       # Pinecone client and operations
├── citation-linker.ts    # Link facts to source documents
├── validators/           # Input validation (TODO)
│   └── fact.ts          # Fact creation/update schemas
└── __tests__/
    ├── fact-extractor.test.ts
    ├── knowledge-graph.test.ts
    └── vector-store.test.ts
```

### Data Flow

```
Document Parsed (data-plane)
    ↓
semantic-layer.extractFacts(documentId)
    ↓
Chunk text → LLM extracts structured facts
    ↓
Store facts in Postgres (via @trato-hive/db)
    ↓
Generate embeddings (via @trato-hive/ai-core)
    ↓
Index embeddings in Pinecone (with metadata)
    ↓
Create graph relationships in Neo4j
    ↓
Return factIds with citations
```

---

## 5. Environment Variables

Required in `apps/api/.env`:

```bash
# Neo4j (Knowledge Graph)
NEO4J_URI=neo4j://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-password
# Production: neo4j+s://your-instance.databases.neo4j.io

# Pinecone (Vector Database)
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_ENVIRONMENT=us-east-1-aws  # or your region
PINECONE_INDEX_NAME=trato-hive-facts
PINECONE_NAMESPACE_PREFIX=firm-  # Multi-tenancy: firm-{organizationId}

# Fact Extraction
FACT_EXTRACTION_MODEL=claude-sonnet-4.5  # via ai-core
FACT_CONFIDENCE_THRESHOLD=0.75  # Minimum confidence to auto-approve
EMBEDDING_DIMENSIONS=3072  # text-embedding-3-large
```

**Security Notes:**
- Never commit `.env` files
- Rotate Pinecone API keys quarterly
- Use Neo4j auth in production (disable anonymous access)
- Multi-tenancy via Pinecone namespaces (firm-{id})

---

## 6. Fact Schema

### Database Model (Prisma)

```prisma
model Fact {
  id               String   @id @default(cuid())
  content          String   // The fact statement
  normalizedValue  String?  // Extracted value (e.g., "12500000" from "$12.5M")
  confidence       Float    // 0.0 - 1.0 confidence score
  factType         FactType // FINANCIAL_METRIC, KEY_PERSON, PRODUCT, etc.

  // Citation (source document linking)
  sourceDocumentId String
  sourceDocument   Document @relation(fields: [sourceDocumentId], references: [id])
  pageNumber       Int?
  excerpt          String?  // Surrounding text for context
  boundingBox      Json?    // {x, y, width, height} from Reducto

  // Relationships
  companyId        String?
  company          Company? @relation(fields: [companyId], references: [id])
  dealId           String?
  deal             Deal?    @relation(fields: [dealId], references: [id])

  // Vector indexing
  vectorId         String?  // Pinecone vector ID
  embedding        Float[]? // Optional: store in Postgres for backup

  // Multi-tenancy
  organizationId   String
  organization     Organization @relation(fields: [organizationId], references: [id])

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([organizationId, factType])
  @@index([sourceDocumentId])
  @@index([companyId])
  @@index([dealId])
}

enum FactType {
  FINANCIAL_METRIC
  KEY_PERSON
  PRODUCT
  CUSTOMER
  RISK
  OPPORTUNITY
  OTHER
}
```

### TypeScript Interface

```typescript
export interface FactWithCitation {
  id: string;
  content: string;
  normalizedValue?: string | number;
  confidence: number;
  factType: FactType;
  citation: {
    documentId: string;
    documentName: string;
    pageNumber?: number;
    excerpt?: string;
    boundingBox?: { x: number; y: number; width: number; height: number };
    presignedUrl?: string; // For downloading source document
  };
  metadata: {
    companyId?: string;
    dealId?: string;
    organizationId: string;
  };
}
```

---

## 7. Fact Extraction

### Extraction Pipeline

**File:** `src/fact-extractor.ts`

```typescript
import { db } from '@trato-hive/db';
import { generateEmbedding, extractFactsWithLLM } from '@trato-hive/ai-core';

export async function extractFactsFromDocument(
  documentId: string,
  organizationId: string
): Promise<FactWithCitation[]> {
  // 1. Get document with chunks
  const document = await db.document.findUnique({
    where: { id: documentId },
    include: { chunks: true },
  });

  if (!document) {
    throw new Error(`Document ${documentId} not found`);
  }

  // 2. Extract facts using LLM (via ai-core)
  const rawFacts = await extractFactsWithLLM(document.chunks);

  // 3. Store facts in database
  const facts = [];
  for (const rawFact of rawFacts) {
    // Generate embedding
    const embedding = await generateEmbedding(rawFact.content);

    // Create fact record
    const fact = await db.fact.create({
      data: {
        content: rawFact.content,
        normalizedValue: rawFact.normalizedValue,
        confidence: rawFact.confidence,
        factType: rawFact.type,
        sourceDocumentId: documentId,
        pageNumber: rawFact.pageNumber,
        excerpt: rawFact.excerpt,
        boundingBox: rawFact.boundingBox,
        companyId: document.companyId,
        dealId: document.dealId,
        organizationId,
      },
    });

    // 4. Index in Pinecone
    const vectorId = await indexFactInPinecone(fact, embedding, organizationId);

    // Update fact with vectorId
    await db.fact.update({
      where: { id: fact.id },
      data: { vectorId },
    });

    // 5. Create graph relationships in Neo4j
    await createKnowledgeGraphNodes(fact);

    facts.push(fact);
  }

  return facts;
}
```

### LLM Prompt (in ai-core)

```typescript
const FACT_EXTRACTION_PROMPT = `
You are a fact extraction system for M&A due diligence.

Extract discrete, verifiable facts from the following document chunk.
For each fact:
1. State the fact clearly and concisely
2. Extract normalized values (e.g., "$12.5M" → 12500000)
3. Assign confidence score (0.0 - 1.0)
4. Classify as: FINANCIAL_METRIC, KEY_PERSON, PRODUCT, CUSTOMER, RISK, OPPORTUNITY, OTHER
5. Include page number and excerpt for citation

Document: {documentName}
Chunk (page {pageNumber}):
{chunkContent}

Return JSON array:
[
  {
    "content": "EBITDA for Q4 2024 was $12.5M",
    "normalizedValue": 12500000,
    "confidence": 0.95,
    "type": "FINANCIAL_METRIC",
    "pageNumber": 3,
    "excerpt": "...our EBITDA for Q4 2024 was $12.5M, representing..."
  }
]
`;
```

---

## 8. Pinecone Vector Store

### Client Setup

**File:** `src/vector-store.ts`

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);

export { index as pineconeIndex };
```

### Index Configuration

**Manual Setup (via Pinecone Console or CLI):**

```bash
# Create index (one-time setup)
pinecone create-index \
  --name trato-hive-facts \
  --dimension 3072 \
  --metric cosine \
  --cloud aws \
  --region us-east-1
```

**Index Spec:**
- **Dimension:** 3,072 (text-embedding-3-large)
- **Metric:** Cosine similarity
- **Cloud:** AWS (or GCP, Azure)
- **Region:** Same as primary deployment
- **Pod Type:** p1.x1 (starter) or p2.x1 (production)

### Upsert Vectors

```typescript
import { pineconeIndex } from './vector-store';

export async function indexFactInPinecone(
  fact: Fact,
  embedding: number[],
  organizationId: string
): Promise<string> {
  const namespace = `${process.env.PINECONE_NAMESPACE_PREFIX}${organizationId}`;
  const vectorId = `fact-${fact.id}`;

  await pineconeIndex.namespace(namespace).upsert([
    {
      id: vectorId,
      values: embedding,
      metadata: {
        factId: fact.id,
        content: fact.content,
        factType: fact.factType,
        confidence: fact.confidence,
        sourceDocumentId: fact.sourceDocumentId,
        companyId: fact.companyId,
        dealId: fact.dealId,
        organizationId,
        createdAt: fact.createdAt.toISOString(),
      },
    },
  ]);

  return vectorId;
}
```

### Query Vectors (Semantic Search)

```typescript
import { generateEmbedding } from '@trato-hive/ai-core';

export async function searchFactsBySimilarity(
  query: string,
  organizationId: string,
  options: { topK?: number; filter?: Record<string, any> } = {}
): Promise<FactWithCitation[]> {
  const { topK = 10, filter = {} } = options;

  // 1. Generate query embedding
  const queryEmbedding = await generateEmbedding(query);

  // 2. Query Pinecone
  const namespace = `${process.env.PINECONE_NAMESPACE_PREFIX}${organizationId}`;
  const queryResult = await pineconeIndex.namespace(namespace).query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true,
    filter: {
      organizationId,
      ...filter,
    },
  });

  // 3. Fetch full fact records from database
  const factIds = queryResult.matches.map((m) => m.metadata?.factId as string);
  const facts = await db.fact.findMany({
    where: { id: { in: factIds } },
    include: { sourceDocument: true },
  });

  // 4. Attach citations and scores
  return facts.map((fact) => {
    const match = queryResult.matches.find((m) => m.metadata?.factId === fact.id);
    return {
      ...fact,
      score: match?.score ?? 0,
      citation: {
        documentId: fact.sourceDocumentId,
        documentName: fact.sourceDocument.name,
        pageNumber: fact.pageNumber,
        excerpt: fact.excerpt,
        boundingBox: fact.boundingBox,
      },
    };
  });
}
```

### Multi-Tenancy with Namespaces

**Pattern:** Each organization has a dedicated namespace: `firm-{organizationId}`

**Why?** Prevents cross-tenant data leakage and enables organization-specific indexing.

```typescript
// Organization A queries only see their facts
const namespaceA = pineconeIndex.namespace('firm-org123');
const resultsA = await namespaceA.query({ vector: embedding, topK: 10 });

// Organization B queries only see their facts
const namespaceB = pineconeIndex.namespace('firm-org456');
const resultsB = await namespaceB.query({ vector: embedding, topK: 10 });
```

---

## 9. Neo4j Knowledge Graph

### Client Setup

**File:** `src/knowledge-graph.ts`

```typescript
import neo4j from 'neo4j-driver';

const driver = neo4j.driver(
  process.env.NEO4J_URI!,
  neo4j.auth.basic(process.env.NEO4J_USER!, process.env.NEO4J_PASSWORD!)
);

export async function executeQuery<T = any>(
  cypher: string,
  params: Record<string, any> = {}
): Promise<T[]> {
  const session = driver.session();
  try {
    const result = await session.run(cypher, params);
    return result.records.map((record) => record.toObject() as T);
  } finally {
    await session.close();
  }
}

export { driver as neo4jDriver };
```

### Graph Schema

**Nodes:**
- `Organization` (tenant root)
- `Deal` (M&A pipeline)
- `Company` (target companies)
- `Document` (uploaded files)
- `Fact` (extracted knowledge)

**Relationships:**
- `(Organization)-[:OWNS]->(Deal)`
- `(Deal)-[:TARGETS]->(Company)`
- `(Company)-[:HAS_DOCUMENT]->(Document)`
- `(Document)-[:CONTAINS_FACT]->(Fact)`
- `(Fact)-[:ABOUT]->(Company)`

### Create Graph Nodes

```typescript
export async function createKnowledgeGraphNodes(fact: Fact): Promise<void> {
  const session = driver.session();

  try {
    await session.executeWrite(async (txc) => {
      // Create Fact node
      await txc.run(
        `
        MERGE (f:Fact {id: $factId})
        SET f.content = $content,
            f.confidence = $confidence,
            f.factType = $factType,
            f.createdAt = datetime($createdAt)
        `,
        {
          factId: fact.id,
          content: fact.content,
          confidence: fact.confidence,
          factType: fact.factType,
          createdAt: fact.createdAt.toISOString(),
        }
      );

      // Link to source document
      await txc.run(
        `
        MATCH (f:Fact {id: $factId})
        MERGE (d:Document {id: $documentId})
        MERGE (d)-[:CONTAINS_FACT]->(f)
        `,
        { factId: fact.id, documentId: fact.sourceDocumentId }
      );

      // Link to company (if exists)
      if (fact.companyId) {
        await txc.run(
          `
          MATCH (f:Fact {id: $factId})
          MERGE (c:Company {id: $companyId})
          MERGE (f)-[:ABOUT]->(c)
          `,
          { factId: fact.id, companyId: fact.companyId }
        );
      }

      // Link to deal (if exists)
      if (fact.dealId) {
        await txc.run(
          `
          MATCH (f:Fact {id: $factId})
          MERGE (deal:Deal {id: $dealId})
          MERGE (f)-[:RELATES_TO]->(deal)
          `,
          { factId: fact.id, dealId: fact.dealId }
        );
      }
    });
  } finally {
    await session.close();
  }
}
```

### Query Graph Patterns

**Example: Get all facts about a company**

```typescript
export async function getCompanyFacts(companyId: string): Promise<Fact[]> {
  const result = await executeQuery(
    `
    MATCH (c:Company {id: $companyId})<-[:ABOUT]-(f:Fact)
    RETURN f.id as id, f.content as content, f.confidence as confidence
    ORDER BY f.createdAt DESC
    `,
    { companyId }
  );

  return result;
}
```

**Example: Get document's knowledge graph**

```typescript
export async function getDocumentKnowledgeGraph(documentId: string) {
  const result = await executeQuery(
    `
    MATCH (d:Document {id: $documentId})-[:CONTAINS_FACT]->(f:Fact)
    OPTIONAL MATCH (f)-[:ABOUT]->(c:Company)
    RETURN d, f, c
    `,
    { documentId }
  );

  return result;
}
```

---

## 10. Citation Linking

### Citation API

**File:** `src/citation-linker.ts`

```typescript
export async function getCitation(factId: string): Promise<Citation> {
  const fact = await db.fact.findUnique({
    where: { id: factId },
    include: { sourceDocument: true },
  });

  if (!fact) {
    throw new Error(`Fact ${factId} not found`);
  }

  // Generate presigned URL for document download
  const storage = new StorageClient({ provider: 's3', bucket: process.env.S3_BUCKET_NAME });
  const presignedUrl = await storage.getPresignedUrl(fact.sourceDocument.s3Key, 3600);

  return {
    documentId: fact.sourceDocumentId,
    documentName: fact.sourceDocument.name,
    pageNumber: fact.pageNumber,
    excerpt: fact.excerpt,
    boundingBox: fact.boundingBox,
    presignedUrl,
  };
}
```

### UI Integration (apps/web)

**Citation Component:**

```typescript
import { Citation } from '@trato-hive/ui';

// In Deal Dashboard
<span>
  EBITDA: <Citation factId="fact-123">$12.5M</Citation>
</span>

// Citation component fetches citation on click and opens modal
// Modal shows: document name, page number, excerpt with highlighting
```

**Modal Behavior:**
1. User clicks on `$12.5M`
2. Frontend calls `trpc.fact.getCitation({ factId: 'fact-123' })`
3. Modal opens with document preview
4. Excerpt highlighted using bounding box coordinates
5. "Open Full Document" button downloads via presigned URL

---

## 11. Exported Interfaces

```typescript
// src/index.ts
export { extractFactsFromDocument } from './fact-extractor';
export { indexFactInPinecone, searchFactsBySimilarity } from './vector-store';
export {
  createKnowledgeGraphNodes,
  getCompanyFacts,
  getDocumentKnowledgeGraph,
} from './knowledge-graph';
export { getCitation } from './citation-linker';

export type { FactWithCitation, Citation };
```

---

## 12. Testing

### Unit Tests

**Coverage Target:** ≥80%

```typescript
// src/__tests__/fact-extractor.test.ts
import { describe, it, expect, vi } from 'vitest';
import { extractFactsFromDocument } from '../fact-extractor';

describe('extractFactsFromDocument', () => {
  it('should extract facts from document chunks', async () => {
    const documentId = 'doc-123';
    const organizationId = 'org-456';

    const facts = await extractFactsFromDocument(documentId, organizationId);

    expect(facts).toBeInstanceOf(Array);
    expect(facts[0]).toHaveProperty('content');
    expect(facts[0]).toHaveProperty('confidence');
    expect(facts[0].confidence).toBeGreaterThanOrEqual(0);
    expect(facts[0].confidence).toBeLessThanOrEqual(1);
  });

  it('should assign correct factType', async () => {
    const facts = await extractFactsFromDocument('doc-123', 'org-456');
    const financialFact = facts.find((f) => f.factType === 'FINANCIAL_METRIC');
    expect(financialFact).toBeDefined();
  });
});
```

### Integration Tests (with Docker)

**Setup:** Use Docker Compose to run Neo4j and Pinecone emulator (or test namespace)

```typescript
// src/__tests__/knowledge-graph.integration.test.ts
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { neo4jDriver, createKnowledgeGraphNodes } from '../knowledge-graph';

beforeAll(async () => {
  // Clear test data
  const session = neo4jDriver.session();
  await session.run('MATCH (n) DETACH DELETE n');
  await session.close();
});

afterAll(async () => {
  await neo4jDriver.close();
});

describe('Knowledge Graph Integration', () => {
  it('should create fact nodes and relationships', async () => {
    const fact = {
      id: 'fact-test-1',
      content: 'Test fact',
      confidence: 0.9,
      factType: 'OTHER',
      sourceDocumentId: 'doc-test-1',
      companyId: 'company-test-1',
      createdAt: new Date(),
    };

    await createKnowledgeGraphNodes(fact);

    const session = neo4jDriver.session();
    const result = await session.run('MATCH (f:Fact {id: $id}) RETURN f', { id: fact.id });
    expect(result.records.length).toBe(1);
    await session.close();
  });
});
```

---

## 13. Integration Examples

### From apps/api (tRPC Router)

```typescript
import { router, protectedProcedure } from '../trpc';
import { extractFactsFromDocument, searchFactsBySimilarity, getCitation } from '@trato-hive/semantic-layer';
import { z } from 'zod';

export const factRouter = router({
  // Trigger fact extraction after document upload
  extractFromDocument: protectedProcedure
    .input(z.object({ documentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const facts = await extractFactsFromDocument(input.documentId, ctx.organizationId);
      return { count: facts.length, facts };
    }),

  // Semantic search
  search: protectedProcedure
    .input(z.object({ query: z.string(), topK: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      return await searchFactsBySimilarity(input.query, ctx.organizationId, {
        topK: input.topK,
      });
    }),

  // Get citation for fact
  getCitation: protectedProcedure
    .input(z.object({ factId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await getCitation(input.factId);
    }),
});
```

---

## 14. Common Patterns

### Pattern 1: Fact Confidence Thresholds

```typescript
const AUTO_APPROVE_THRESHOLD = 0.85;
const MANUAL_REVIEW_THRESHOLD = 0.60;

if (fact.confidence >= AUTO_APPROVE_THRESHOLD) {
  // Auto-approve and index
  await indexFactInPinecone(fact, embedding, organizationId);
} else if (fact.confidence >= MANUAL_REVIEW_THRESHOLD) {
  // Queue for manual review
  await db.factReviewQueue.create({ data: { factId: fact.id } });
} else {
  // Reject low-confidence facts
  await db.fact.update({ where: { id: fact.id }, data: { status: 'REJECTED' } });
}
```

### Pattern 2: Batch Fact Indexing

```typescript
export async function batchIndexFacts(facts: Fact[], organizationId: string) {
  const namespace = `${process.env.PINECONE_NAMESPACE_PREFIX}${organizationId}`;
  const vectors = [];

  for (const fact of facts) {
    const embedding = await generateEmbedding(fact.content);
    vectors.push({
      id: `fact-${fact.id}`,
      values: embedding,
      metadata: { factId: fact.id, content: fact.content, factType: fact.factType },
    });
  }

  // Upsert in batches of 100
  const BATCH_SIZE = 100;
  for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
    const batch = vectors.slice(i, i + BATCH_SIZE);
    await pineconeIndex.namespace(namespace).upsert(batch);
  }
}
```

---

## 15. Anti-Patterns

### ❌ DON'T skip citation linking

```typescript
// Bad - fact without source
const fact = { content: 'EBITDA: $12.5M', confidence: 0.9 };

// Good - fact with citation
const fact = {
  content: 'EBITDA: $12.5M',
  confidence: 0.9,
  sourceDocumentId: 'doc-123',
  pageNumber: 3,
  excerpt: '...our EBITDA for Q4 was $12.5M...',
};
```

### ❌ DON'T store embeddings only in Pinecone

```typescript
// Bad - Pinecone as sole source of truth
await pineconeIndex.upsert([{ id: factId, values: embedding }]);

// Good - Store fact in Postgres, index in Pinecone
await db.fact.create({ data: { ...factData, vectorId: factId } });
await pineconeIndex.upsert([{ id: factId, values: embedding }]);
```

### ❌ DON'T mix organization data in single namespace

```typescript
// Bad - all organizations in default namespace
await pineconeIndex.upsert([{ id: 'fact-1', values: embedding }]);

// Good - namespace per organization
const namespace = pineconeIndex.namespace(`firm-${organizationId}`);
await namespace.upsert([{ id: 'fact-1', values: embedding }]);
```

---

## 16. Troubleshooting

### Issue: Pinecone index not found

**Symptoms:** `Index 'trato-hive-facts' not found`

**Solution:** Create index via Pinecone console or CLI:

```bash
pinecone create-index --name trato-hive-facts --dimension 3072 --metric cosine
```

### Issue: Neo4j connection refused

**Symptoms:** `ServiceUnavailable: Connection refused`

**Solution:** Check Docker container:

```bash
docker ps | grep neo4j
docker logs neo4j

# Restart Neo4j
docker-compose restart neo4j
```

### Issue: Low fact extraction quality

**Symptoms:** Irrelevant or incorrect facts extracted

**Solution:** Improve LLM prompt in ai-core:

1. Add few-shot examples
2. Specify output format more strictly
3. Lower temperature (0.2 for factual extraction)
4. Use Claude Sonnet 4.5 instead of GPT-4

---

## 17. Performance Requirements

**Targets:**
- Fact extraction: <10s per document (50 pages)
- Vector indexing: <500ms per fact
- Semantic search: <300ms (P95)
- Graph query: <200ms (P95)
- Citation retrieval: <100ms

**Optimization:**
- Batch Pinecone upserts (100 vectors at a time)
- Cache Neo4j queries (Redis)
- Use Pinecone metadata filtering (reduces retrieval time)
- Index Postgres facts table (organizationId, factType, sourceDocumentId)

---

## 18. Non-Negotiables

1. **Every fact MUST have sourceDocumentId** (citation-first principle)
2. **Multi-tenancy via Pinecone namespaces** (firm-{organizationId})
3. **Confidence scores MUST be 0.0-1.0** (validate in Zod schema)
4. **Graph relationships MUST be created** for all facts
5. **Embeddings MUST use text-embedding-3-large** (3,072 dimensions)
6. **Citations MUST include page number and excerpt**
7. **Never mix organization data** (namespace isolation)
8. **Always close Neo4j sessions** (prevent connection leaks)
9. **≥80% test coverage** for fact extraction and vector operations
10. **Always validate fact schema** before indexing

---

## Resources

**Documentation:**
- Root CLAUDE.md Section 3 (Architecture - 7-Layer)
- PROJECT_STATUS.md lines 539-569
- `/docs/architecture/semantic-layer.md`
- packages/data-plane/CLAUDE.md (Document parsing)
- packages/ai-core/CLAUDE.md (LLM inference)

**Pinecone:**
- [Pinecone TypeScript Client](https://github.com/pinecone-io/pinecone-ts-client)
- [Pinecone Namespaces](https://docs.pinecone.io/guides/data/namespace)
- [Pinecone Metadata Filtering](https://docs.pinecone.io/guides/data/filter-with-metadata)

**Neo4j:**
- [Neo4j JavaScript Driver](https://github.com/neo4j/neo4j-javascript-driver)
- [Cypher Query Language](https://neo4j.com/docs/cypher-manual/current/)
- [Neo4j Docker Setup](https://neo4j.com/developer/docker/)
