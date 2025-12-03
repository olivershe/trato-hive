# Discovery (Module 2)

## Purpose

AI-powered sourcing engine (Layer 5) with natural language search and lookalike discovery.

## Tech Stack

- **Frontend:** Next.js 15, D3.js (Market Map)
- **Backend:** Prisma, Redis (Caching)
- **AI:** Sourcing Agent, Pinecone (Similarity), Neo4j (Graph)

## Data Model

- **Company:** Target profile (`industry`, `revenue`, `embedding`)
- **TargetList:** Saved search results
- **SearchQuery:** Logged user queries

## API Specification

- `POST /search`: Natural language → Structured filters
- `POST /lookalike`: Vector similarity search
- `POST /market-map`: Generate competitive landscape
- `POST /lists`: Save target list

## Common Patterns

### Natural Language Search

```typescript
// hooks/useSearch.ts
const mutation = api.discovery.search.useMutation()
const handleSearch = async (query: string) => {
  // query: "SaaS companies in London >$5M ARR"
  const { companies } = await mutation.mutateAsync({ query })
}
```

### Lookalike Discovery

```typescript
// components/LookalikePanel.tsx
const findSimilar = async (companyId: string) => {
  const { companies } = await api.discovery.lookalike.mutateAsync({ companyId })
}
```

## Non-Negotiables

- **Data Sources:** Internal/Open data only (MVP). No paid APIs.
- **Search:** Filter by `firmId` (if internal data) or public scope.
- **Visualization:** Use Hexagonal nodes for Market Maps.
- **Exclude:** Don't show companies already in Deals pipeline.
