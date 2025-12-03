# Semantic Layer Package (@trato-hive/semantic-layer)

## Purpose

Fact extraction, knowledge graph, and vector search (Layer 2).

## Tech Stack

- **Graph:** Neo4j (Entities & Relationships)
- **Vector:** Pinecone (Embeddings)
- **Extraction:** LLM (via `ai-core`)

## Fact Schema

- **Fact:** `content`, `value`, `confidence`, `sourceDocumentId`, `pageNumber`.
- **Relationships:** `(Fact)-[:ABOUT]->(Company)`, `(Document)-[:CONTAINS]->(Fact)`.

## Common Patterns

### Extract Facts

```typescript
// fact-extractor.ts
const facts = await extractFactsFromDocument(docId, orgId)
// Stores in DB, indexes in Pinecone, creates Neo4j nodes
```

### Semantic Search

```typescript
// vector-store.ts
const results = await searchFactsBySimilarity(query, orgId, { topK: 10 })
// Returns facts with citation metadata
```

### Citation Linking

```typescript
// citation-linker.ts
const citation = await getCitation(factId)
// Returns: { documentId, pageNumber, excerpt, presignedUrl }
```

## Non-Negotiables

- **Golden Thread:** Every fact MUST link to a source document.
- **Isolation:** Pinecone namespaces per `firmId`.
- **Graph:** Sync Neo4j with Postgres/Pinecone.
