# Semantic Layer (Layer 2)

**Status:** Draft
**Last Updated:** 2025‑11‑12
**Owner:** Knowledge Engineering Team
**Priority:** High

The **Semantic Layer** builds meaning from raw documents. It extracts verifiable facts, constructs a knowledge graph and enables semantic search and similarity queries. This layer turns documents into structured data that the TIC Core and agents can reason over.

## 1. Responsibilities

1. **Fact Extraction:** Transform parsed documents into discrete facts with citations. Each fact records the source document ID, page number, excerpt, confidence and a citation link (golden citation) that binds the fact to its origin.
2. **Knowledge Graph Management:** Maintain entities (Deals, Companies, Documents, Facts) and relationships (e.g., deal → company; company → document; document → fact). Support graph queries to traverse these relationships.
3. **Vector Indexing:** Compute vector embeddings for facts, documents and queries. Store them in a vector database (e.g., Weaviate, Pinecone) to facilitate semantic search and lookalike discovery. Use open‑source or cost‑efficient options to avoid expensive proprietary services.
4. **Citation Linking:** Implement the “golden thread” by linking each displayed number or statement back to its source【516335038796236†L90-L99】. Provide functions to retrieve citations and highlight excerpts in documents.
5. **Exported Interfaces:** Provide APIs to create facts, query facts, link citations and fetch portions of the knowledge graph.

## 2. Fact Schema

A fact is a minimal verifiable statement derived from a document. The TypeScript interface:

```typescript
interface Fact {
  factId: string
  sourceId: string        // Document ID
  pageNumber: number
  excerpt: string         // Text excerpt with context
  normalizedValue: string | number | null // Extracted value (e.g., 12.3, "Insurance")
  confidence: number      // 0-1 confidence score
  citationLink: string    // URL or key to locate the original document
  createdAt: Date
  updatedAt: Date
}
```

Facts are immutable once validated; if a fact changes (e.g., updated financial number), a new fact version is created with a timestamp. Facts are linked to the parent document and to the company or deal they describe.

## 3. Knowledge Graph Structure

The knowledge graph is a directed graph capturing entities and relationships:

```
Deal --owns--> Company --has--> Document --contains--> Fact

User --creates--> Fact
Document --derivedFrom--> SourceFile

```

Edges are labelled (e.g., `owns`, `has`, `contains`) to express semantics. Graph traversal enables queries such as “Find all facts related to deals in the ‘Sourcing’ stage” or “List documents containing facts about EBITDA”. The graph is stored in a graph database (e.g., Neo4j) or a relational database with adjacency lists; selection depends on cost and performance needs.

## 4. Vector Indexing

For semantic search, each fact and document is embedded into a high‑dimensional vector space using an embedding model (e.g., OpenAI’s `text-embedding-ada-002`). The embeddings are stored in a vector index (e.g., Weaviate). Similarity queries (cosine similarity or dot product) allow the system to find facts relevant to a query or similar companies for lookalike discovery. To minimise cost, we may choose self‑hosted solutions (e.g., Faiss, Milvus) if licensing permits.

## 5. Citation Linking Mechanism

The **citation-first principle** requires each fact displayed to the user to link back to its source. The Semantic Layer supports:
- **Citation Retrieval:** Given a factId, return the citation record with source document name, page number and excerpt.
- **Excerpt Highlighting:** Use OCR coordinate data to highlight the exact location of the fact in the original document within the modal.
- **Confidence Scores:** Provide confidence to inform users when a fact may need verification. Low confidence triggers warnings or manual review.

## 6. Fact Extraction Pipeline

Fact extraction is a multi‑stage process:
1. **Text Analysis:** Use rule‑based and ML methods to identify potential facts (numbers, dates, names) from parsed text. Recognise patterns like revenue, EBITDA, headcount and legal clauses.
2. **Normalisation:** Convert textual representations into normalised values (e.g., “£10 million” → 10000000; “ten percent” → 0.1). Use locale‑aware parsers.
3. **Validation:** Apply heuristics and cross‑document checks (e.g., consistent units) to validate extracted facts. Associate a confidence score.
4. **Citation Creation:** For each fact, store the page number, excerpt and bounding box coordinates. Generate a citation link (an opaque ID or URL) used in the UI.
5. **User Review (Optional):** For low‑confidence facts, route to a human analyst for validation before inclusion.

## 7. Exported Interfaces

```typescript
// create a new fact for a document
async function createFact(docId: string, fact: Fact): Promise<Fact>

// query facts by search criteria (keywords, entity IDs, vector similarity)
async function queryFacts(criteria: FactQuery): Promise<Fact[]>

// link a fact to a citation and return the citation record
async function linkCitation(factId: string): Promise<Citation>

// fetch a subgraph around an entity (e.g., dealId) with specified depth
async function getKnowledgeGraph(entityId: string, depth: number): Promise<Graph>
```

## 8. Conclusion

The Semantic Layer turns unstructured documents into structured, verifiable knowledge. By maintaining a fact schema, knowledge graph and vector index, it powers semantic search, lookalike discovery and citation linking across the platform while keeping costs in check through the use of open‑source components and internal data sources.
