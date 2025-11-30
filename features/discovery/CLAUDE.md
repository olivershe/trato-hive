# Feature: Discovery (Module 2)

**Parent:** Root CLAUDE.md
**Purpose:** AI-Native Sourcing & Company Discovery - Natural Language Search, Lookalike Matching
**Last Updated:** 2025-11-28
**Module Mapping:** Module 2 - Intelligent Company Sourcing
**PRD Reference:** `/docs/prds/discovery.md`

---

## 1. Purpose

The Discovery module transforms traditional company sourcing from manual LinkedIn/database searches into an AI-powered discovery engine. Users describe their ideal target in natural language ("SaaS companies in healthcare with $5-10M ARR"), and the system returns ranked matches with lookalike suggestions and auto-generated market maps.

**Core Capabilities:**
- **Natural Language Sourcing:** Search by criteria ("fintech startups in London with recent Series A")
- **Lookalike Discovery:** Find companies similar to known targets using vector similarity
- **Auto-Generated Market Maps:** Honeycomb visualization of competitive landscape
- **Target List Management:** Save and share search results as persistent lists
- **Company Enrichment:** Pull verified facts from knowledge graph (team, financials, tech stack)

**Integration with 7-Layer Architecture:**
- **Layer 1 (Data Plane):** Store company data and search queries
- **Layer 2 (Semantic Layer):** Vector indexing for similarity search, knowledge graph for relationships
- **Layer 3 (TIC Core):** Parse natural language queries into structured filters
- **Layer 4 (Agentic Layer):** Sourcing Agent orchestrates multi-step discovery workflows
- **Layer 5 (Experience Layer):** Search bar, company cards, market map visualization

**Why This Matters:**
Traditional sourcing takes weeks of manual research. Discovery reduces this to seconds while finding non-obvious targets through AI similarity matching.

**Reference:** `/docs/prds/discovery.md` Section 1-2

---

## 2. Ownership

**Owner:** Product & AI Engineering Teams
**Shared Responsibility:**
- Company data quality and enrichment (with Data team)
- Search relevance and ranking (with AI Core team)
- Similarity algorithm accuracy (with Semantic Layer team)
- Market map visualization (with Design team)

**Changes Requiring Approval:**
- New data sources or enrichment providers (requires Data/Legal approval)
- Changes to similarity algorithm (requires AI Core review)
- Search ranking formula updates (requires Product approval)
- Market map design changes (requires Design review)

---

## 3. Technology Stack

**Frontend:**
- React 19 with Next.js 15 App Router
- Search bar: Autocomplete with query suggestions
- Company cards: Grid/list view with sorting/filtering
- Market map: D3.js or SVG hexagonal layout
- Target lists: Drag-and-drop to organize companies

**Backend:**
- Fastify + tRPC for API routes
- Prisma for Company CRUD operations
- Redis for caching search results (10-minute TTL)

**AI/ML:**
- Sourcing Agent (@trato-hive/agents) - Multi-step discovery workflow
- Claude Sonnet 4.5 (@trato-hive/ai-core) - Query parsing
- Pinecone (@trato-hive/semantic-layer) - Vector similarity search
- Neo4j (@trato-hive/semantic-layer) - Knowledge graph relationships

**Package Dependencies:**
- @trato-hive/semantic-layer - Vector search, knowledge graph queries
- @trato-hive/agents - Sourcing Agent workflow
- @trato-hive/ai-core - Query understanding
- @trato-hive/ui - SearchBar, Card, HexagonPattern components
- @trato-hive/db - Company, TargetList models

**Data Sources (MVP - Internal Only):**
- Internal knowledge graph (existing portfolio companies, known targets)
- Open data sources (company websites, public filings)
- **NO external paid APIs** (PitchBook, Crunchbase, CapIQ excluded from MVP)

---

## 4. Data Model

### Data Ownership

**Owns:**
- `Company` - Target companies with metadata, tags, sources
- `TargetList` - Saved searches with query metadata
- `SearchQuery` - Query logs for analytics and improvement

**Reads:**
- `Deal` - Companies already in pipeline (exclude from results)
- `Fact` - Verified company data from knowledge graph
- `User` - User preferences for personalized results

**Writes:**
- Company profiles feed into Deals module (create deal from target)
- Search queries logged for improving relevance
- Target lists shareable across firm

### Key Entities (from PRD Section 6)

```typescript
interface Company {
  id: string
  name: string
  website?: string
  industry: string
  location: string
  employeeCount?: number
  revenue?: number
  fundingStage?: 'seed' | 'series_a' | 'series_b' | 'series_c' | 'growth' | 'public'
  technologyTags: string[]
  sources: CompanySource[] // Citations to data sources
  embeddingVector?: number[] // For similarity search
  firmId: string
  createdAt: Date
  updatedAt: Date
}

interface CompanySource {
  type: 'website' | 'filing' | 'news' | 'internal'
  url: string
  extractedAt: Date
}

interface TargetList {
  id: string
  name: string
  firmId: string
  createdBy: string
  query: string // Original natural language query
  filters: Record<string, any> // Parsed filters
  companyIds: string[]
  shared: boolean
  createdAt: Date
  updatedAt: Date
}
```

---

## 5. API Specification

### Endpoints (from PRD Section 7)

**Search:**
- `POST /api/v1/discovery/search` - Natural language search
  - Input: `{ query: string, filters?: { industry?, location?, fundingStage? }, limit?: number }`
  - Returns: `{ companies: Company[], totalCount: number, parsedQuery: any }`

**Lookalike:**
- `POST /api/v1/discovery/lookalike` - Find similar companies
  - Input: `{ companyId: string, limit?: number }`
  - Returns: `{ companies: Company[], similarityScores: number[] }`

**Market Map:**
- `POST /api/v1/discovery/market-map` - Generate competitive landscape
  - Input: `{ query: string, companyIds?: string[] }`
  - Returns: `{ nodes: MarketMapNode[], relationships: Relationship[] }`

**Target Lists:**
- `POST /api/v1/discovery/lists` - Create target list from search
  - Input: `{ name: string, query: string, companyIds: string[] }`
- `GET /api/v1/discovery/lists` - List all target lists
- `GET /api/v1/discovery/lists/:id` - Get single target list with companies
- `DELETE /api/v1/discovery/lists/:id` - Delete target list

### Validation & Rate Limiting
- Search: max 60 searches per user per hour
- Lookalike: max 30 requests per user per hour (expensive operation)
- Market map: max 10 generations per user per day
- Results: paginate 50 companies per page

---

## 6. Cross-Feature Integration

**Dependencies on Other Features:**
- **Deals:** Exclude companies already in pipeline from search results
- **Diligence:** Import company documents for enrichment
- **Semantic Layer:** Query knowledge graph for company relationships

**Exposes to Other Features:**
- **Deals:** Create deal from discovered company
- **Command Center:** Discovery activity appears in activity feed
- **Generator:** Company profiles used in IC deck generation

---

## 7. UI Components

**Key Components:**
- `SearchBar` - Natural language input with autocomplete
- `CompanyCard` - Compact card with key metrics and "Add to Deal" button
- `CompanyGrid` - Grid/list view with sorting (relevance, revenue, employees)
- `MarketMap` - Hexagonal SVG visualization of competitive landscape
- `TargetListManager` - Sidebar for managing saved lists
- `LookalikePanel` - "Find Similar" button with results drawer

**Design Compliance (from PRD Section 9):**
- Search bar: Orange (#EE8D1D) focus ring
- Company cards: Bone background (#E2D9CB), 8px border-radius
- Market map: Hexagonal nodes with Orange accents
- "Add to Deal" button: Orange primary button
- Similarity scores: Teal Blue (#2F7E8A) progress bars
- All text: Inter font

---

## 8. Testing Requirements

### Unit Tests (≥80% coverage)
- Query parsing (natural language → structured filters)
- Similarity scoring algorithm
- Market map node positioning logic
- Target list CRUD operations

### Integration Tests (≥70% coverage)
- Search flow: query → parse → vector search → rank → return results
- Lookalike flow: company → embedding → similarity search → return matches
- Market map: query → fetch companies → build relationships → render nodes

### E2E Tests (Playwright)
- User flow: Enter query → see results → click company → view details → add to deal
- User flow: Search → save as target list → share with team
- User flow: Select company → click "Find Similar" → see lookalike results
- Market map: Generate map → hover nodes → click to view company

**Acceptance Criteria (from PRD Section 8):**
- [ ] Search returns results <2 seconds (p95)
- [ ] Lookalike finds ≥5 similar companies with >0.7 similarity
- [ ] Market map renders <3 seconds for 50 companies
- [ ] Query parsing accuracy >85% for common queries
- [ ] Zero external API dependencies in MVP

---

## 9. Performance Requirements

**Targets:**
- Search response: <2s (p95)
- Lookalike search: <3s (p95)
- Market map generation: <3s for 50 companies
- Company card render: <50ms per card
- Target list load: <1s for 500 companies

**Optimization Strategies:**
- Cache popular searches in Redis (10-minute TTL)
- Precompute embeddings for all companies (batch job)
- Use vector index for fast similarity search (Pinecone)
- Lazy load company cards (virtual scrolling)
- Render market map incrementally (show nodes as they load)

---

## 10. Common Patterns

**Natural Language Search:**
```typescript
// Frontend: features/discovery/frontend/hooks/useSearch.ts
import { api } from '@/lib/api-client'

const searchMutation = api.discovery.search.useMutation()

const handleSearch = async (query: string) => {
  const { companies, parsedQuery } = await searchMutation.mutateAsync({ query })
  // Display results with highlighting based on parsedQuery
}
```

**Lookalike Discovery:**
```typescript
// Frontend: features/discovery/frontend/components/LookalikePanel.tsx
import { api } from '@/lib/api-client'

const lookalike = api.discovery.lookalike.useMutation()

const findSimilar = async (companyId: string) => {
  const { companies, similarityScores } = await lookalike.mutateAsync({ companyId })
  // Display similar companies sorted by score
}
```

---

## 11. Troubleshooting

**Issue: Search returns no results**
- Verify Pinecone index has company vectors
- Check query parsing extracted valid filters
- Review knowledge graph has company data
- Test with simpler query (single criterion)

**Issue: Lookalike returns irrelevant companies**
- Check embedding quality (verify vector dimensions)
- Review similarity threshold (may be too low)
- Ensure company profile has enough data for embedding
- Regenerate embeddings for stale companies

**Issue: Market map fails to render**
- Check company count (max 100 for performance)
- Verify Neo4j knowledge graph has relationship data
- Review D3.js console errors for layout issues
- Test with smaller dataset first

---

## 12. Non-Negotiables

1. **NO external paid APIs in MVP** (PitchBook, Crunchbase excluded)
2. **ALL searches MUST be filtered by firmId** (multi-tenancy)
3. **Company data MUST cite sources** (internal/website/filing)
4. **Lookalike MUST use vector similarity** (not keyword matching)
5. **Market map MUST use hexagons** (brand consistency)
6. **Target lists MUST be shareable** (team collaboration)
7. **Search queries MUST be logged** (analytics and improvement)
8. **Results MUST exclude pipeline companies** (avoid duplicates)

---

**For More Information:**
- PRD: `/docs/prds/discovery.md`
- Architecture: `/docs/architecture/agentic-layer.md` (Sourcing Agent)
- Semantic Layer: `/packages/semantic-layer/CLAUDE.md` (Vector search, knowledge graph)
- Agents: `/packages/agents/CLAUDE.md` (Sourcing workflow)
