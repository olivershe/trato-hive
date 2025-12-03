# Command Center (Module 1)

## Purpose

Central hub (Layer 5) aggregating real-time activity, AI queries, and unified task inbox.

## Tech Stack

- **Frontend:** Next.js 15, Recharts (Charts), SSE (Real-time)
- **Backend:** Fastify, Redis (Caching), BullMQ
- **AI:** TIC Core (Query parsing), Agents (Task generation)

## Data Model

- **Task:** AI-generated action items (`deal_next_step`, `review_qa`)
- **ActivityEvent:** Aggregated feed from all modules
- **QueryLog:** Natural language query analytics

## API Specification

- `GET /dashboard`: Aggregate widgets (Pipeline Health, KPIs)
- `GET /tasks`: Unified inbox with filtering
- `POST /query`: Natural language search (`{ query: string }`)
- `GET /activity/stream`: SSE endpoint for real-time updates

## Common Patterns

### AI Query

```typescript
// components/AIQueryBar.tsx
const mutation = api.commandCenter.query.useMutation()
const handleSearch = async (query: string) => {
  const { response, citations } = await mutation.mutateAsync({ query })
}
```

### Real-Time Feed (SSE)

```typescript
// hooks/useActivityFeed.ts
useEffect(() => {
  const es = new EventSource('/api/v1/command-center/activity/stream')
  es.onmessage = (e) => setActivities((prev) => [JSON.parse(e.data), ...prev])
  return () => es.close()
}, [])
```

## Non-Negotiables

- **Performance:** Dashboard load <2s.
- **Security:** Filter all data by `firmId`.
- **Real-Time:** Use SSE (Server-Sent Events), not polling.
- **AI:** Queries must not hallucinate; use Semantic Layer.
