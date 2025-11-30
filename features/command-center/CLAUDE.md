# Feature: Command Center (Module 1)

**Parent:** Root CLAUDE.md
**Purpose:** Hive Command Center - Dynamic Dashboard, AI Query Bar, Unified Task Inbox
**Last Updated:** 2025-11-28
**Module Mapping:** Module 1 - Central Command & Control
**PRD Reference:** `/docs/prds/command-center.md`

---

## 1. Purpose

The Command Center is Trato Hive's central hub, providing a real-time overview of all M&A activity across the firm. It aggregates data from all 5 modules and surfaces the most important information through an AI-powered conversational interface, dynamic widgets, and a unified task inbox.

**Core Capabilities:**
- **Conversational AI Query Bar:** Ask questions in natural language ("Show me stalled deals in diligence stage") and get instant answers
- **Unified "My Tasks" Inbox:** AI-generated tasks from Pipeline OS, Diligence Q&A, Generator reviews—all in one place
- **Pipeline Health Widget:** Honeycomb chart showing deal counts and metrics per stage
- **Real-Time Activity Feed:** Live updates as deals move, documents upload, facts extract
- **Executive Dashboard:** Firm-wide KPIs (deal velocity, close rate, pipeline value)

**Integration with 7-Layer Architecture:**
- **Layer 1 (Data Plane):** Aggregate activity events from all modules
- **Layer 2 (Semantic Layer):** Query facts across all deals for dashboard metrics
- **Layer 3 (TIC Core):** Process natural language queries via conversational AI
- **Layer 4 (Agentic Layer):** Generate tasks from Pipeline OS, Diligence, Generator agents
- **Layer 5 (Experience Layer):** Dashboard UI, query bar, task inbox, widgets

**Why This Matters:**
Command Center is the first screen users see every morning. It must instantly answer "What needs my attention?" and "How is the pipeline performing?" without requiring manual navigation through multiple modules.

**Reference:** `/docs/prds/command-center.md` Section 1-2

---

## 2. Ownership

**Owner:** Product & Frontend Teams
**Shared Responsibility:**
- Dashboard metrics accuracy (with all module teams)
- AI query understanding and response quality (with AI Core team)
- Task generation logic (with Agentic Layer team)
- Real-time updates performance (with Infrastructure team)

**Changes Requiring Approval:**
- New widget types or dashboard layouts (requires Product/Design approval)
- Changes to task generation logic (requires review from module owners)
- AI query prompt templates (requires AI Core review)
- Performance degradation in dashboard load times (requires Architecture review)

---

## 3. Technology Stack

**Frontend:**
- React 19 with Next.js 15 App Router
- Real-time updates: Server-Sent Events (SSE) or WebSocket
- Charts: Recharts or D3.js for honeycomb visualization
- Query bar: Autocomplete with recent queries (Downshift or Radix UI)
- Task list: Virtualized scrolling (react-window)

**Backend:**
- Fastify + tRPC for API routes
- Redis for caching dashboard metrics (5-minute TTL)
- Server-Sent Events for real-time activity feed

**AI/ML:**
- TIC Core (@trato-hive/ai-core) - Natural language query processing
- Pipeline OS Agent (@trato-hive/agents) - Task generation for deals
- Semantic Layer (@trato-hive/semantic-layer) - Cross-module fact queries

**Package Dependencies:**
- @trato-hive/db - All models for aggregation (Deal, Document, Fact, User)
- @trato-hive/ai-core - Query understanding and response generation
- @trato-hive/agents - Task generation
- @trato-hive/ui - Card, Badge, Chart components
- @trato-hive/semantic-layer - Fact aggregation for dashboard

---

## 4. Data Model

### Data Ownership

**Owns:**
- `Task` - AI-generated tasks with type, priority, status
- `ActivityEvent` - Activity feed entries (deal updates, document uploads)
- `QueryLog` - User queries and AI responses for analytics

**Reads:**
- `Deal` - Pipeline metrics, stage distribution
- `Document` - Document upload activity
- `Fact` - Fact extraction activity
- `User` - User activity tracking
- All module data for dashboard aggregation

**Writes:**
- Activity events (consumed by all modules)
- Query logs for improving AI responses
- Task completion status updates

### Key Entities (from PRD Section 6)

```typescript
interface Task {
  id: string
  userId: string
  firmId: string
  type: 'deal_next_step' | 'review_qa' | 'review_deck' | 'approve_fact'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed'
  relatedEntityId?: string // dealId, documentId, etc.
  relatedEntityType?: 'deal' | 'document' | 'qa' | 'generated_doc'
  dueDate?: Date
  createdAt: Date
  completedAt?: Date
}

interface ActivityEvent {
  id: string
  firmId: string
  userId: string
  type: 'deal_stage_change' | 'document_upload' | 'qa_answered' | 'deck_generated'
  description: string
  metadata: Record<string, any>
  createdAt: Date
}

interface QueryLog {
  id: string
  userId: string
  query: string
  response: string
  responseTime: number // milliseconds
  satisfied: boolean // User feedback
  createdAt: Date
}
```

---

## 5. API Specification

### Endpoints (from PRD Section 7)

**Dashboard:**
- `GET /api/v1/command-center/dashboard` - Get all dashboard widgets data
  - Returns: `{ pipelineHealth, tasks, activity, kpis }`

**Tasks:**
- `GET /api/v1/command-center/tasks` - List tasks (filters: status, priority, type)
- `PATCH /api/v1/command-center/tasks/:id` - Update task status or dismiss
- `POST /api/v1/command-center/tasks/:id/complete` - Mark task complete

**Activity Feed:**
- `GET /api/v1/command-center/activity` - Recent activity (pagination, real-time via SSE)
- `GET /api/v1/command-center/activity/stream` - SSE endpoint for live updates

**AI Query:**
- `POST /api/v1/command-center/query` - Submit natural language query
  - Input: `{ query: string }`
  - Returns: `{ response: string, citations?: Citation[], relatedEntities?: any[] }`

**Pipeline Health:**
- `GET /api/v1/command-center/pipeline-health` - Aggregate deal counts per stage

### Validation & Rate Limiting
- Dashboard: cache for 5 minutes (reduce DB load)
- Query: max 30 queries per user per hour (prevent abuse)
- Activity feed: paginate 50 items per page
- Real-time SSE: max 100 concurrent connections per firm

---

## 6. Cross-Feature Integration

**Dependencies on Other Features:**
- **Deals:** Pipeline health metrics, deal stage distribution, next steps tasks
- **Diligence:** Q&A review tasks, document processing activity
- **Generator:** IC deck review tasks, generation completion events
- **Discovery:** Company discovery activity, target list creation events

**Exposes to Other Features:**
- **All Modules:** Activity feed displays events from all features
- **All Modules:** Task inbox aggregates tasks generated by all agents
- **Deals:** Query results can navigate to Deal 360° view
- **Diligence:** Query results can navigate to specific Q&A or documents

---

## 7. UI Components

**Key Components:**
- `Dashboard` - Grid layout with responsive widgets
- `AIQueryBar` - Search input with autocomplete and recent queries
- `MyTasksInbox` - Filterable task list with priority badges
- `PipelineHealthWidget` - Honeycomb chart (6 hexagons for 6 stages)
- `ActivityTimeline` - Real-time feed with auto-refresh
- `KPICard` - Metric display (deal velocity, close rate, pipeline value)

**Design Compliance (from PRD Section 9):**
- Dashboard background: Bone (#E2D9CB)
- Widget cards: White background, 8px border-radius, subtle shadow
- Query bar: Orange (#EE8D1D) focus ring
- Task badges: Red (urgent), Orange (high), Yellow (medium), Green (low)
- Honeycomb chart: Use hexagonal SVG shapes with Orange accents
- Activity items: Teal Blue (#2F7E8A) icons for different event types
- All text: Inter font

---

## 8. Testing Requirements

### Unit Tests (≥80% coverage)
- Dashboard metric aggregation logic
- Task filtering and sorting
- Query parsing and response formatting
- Activity feed pagination

### Integration Tests (≥70% coverage)
- Dashboard loads all widgets with correct data
- Task status updates persist to database
- AI query returns relevant results with citations
- Real-time activity feed receives SSE events

### E2E Tests (Playwright)
- User flow: Load dashboard → see pipeline health → click stage → navigate to deals
- User flow: Ask query "Show me stalled deals" → get results → click result → open Deal 360°
- User flow: Complete task from inbox → verify removed from pending list
- Real-time: Upload document in Diligence → verify activity appears in feed <5 seconds

**Acceptance Criteria (from PRD Section 8):**
- [ ] Dashboard loads <2 seconds on initial visit
- [ ] Query responses <3 seconds (p95)
- [ ] Task list supports 1000+ tasks with virtual scrolling
- [ ] Real-time updates appear <5 seconds after event
- [ ] Pipeline health chart loads <1 second

---

## 9. Performance Requirements

**Targets:**
- Dashboard load: <2s full page (all widgets)
- Query response: <3s (p95)
- Task list render: <500ms for 1000 tasks (virtual scrolling)
- Activity feed: <5s latency for real-time events
- Pipeline health: <1s chart render

**Optimization Strategies:**
- Cache dashboard data in Redis (5-minute TTL)
- Lazy load activity feed (initial 50 items, infinite scroll)
- Use virtual scrolling for task list (react-window)
- Debounce query input (500ms)
- Prefetch common queries (dashboard loads recent queries)
- Use SSE instead of polling for real-time updates

---

## 10. Common Patterns

**Fetch Dashboard Data:**
```typescript
// Frontend: features/command-center/frontend/hooks/useDashboard.ts
import { api } from '@/lib/api-client'

const { data, isLoading } = api.commandCenter.dashboard.useQuery(undefined, {
  staleTime: 5 * 60 * 1000 // 5 minutes
})

// Returns: { pipelineHealth, tasks, activity, kpis }
```

**AI Query:**
```typescript
// Frontend: features/command-center/frontend/components/AIQueryBar.tsx
import { api } from '@/lib/api-client'

const queryMutation = api.commandCenter.query.useMutation()

const handleSubmit = async (query: string) => {
  const result = await queryMutation.mutateAsync({ query })
  // result: { response, citations?, relatedEntities? }
}
```

**Real-Time Activity Feed (SSE):**
```typescript
// Frontend: features/command-center/frontend/hooks/useActivityFeed.ts
useEffect(() => {
  const eventSource = new EventSource('/api/v1/command-center/activity/stream')

  eventSource.onmessage = (event) => {
    const activity = JSON.parse(event.data)
    setActivities(prev => [activity, ...prev])
  }

  return () => eventSource.close()
}, [])
```

---

## 11. Troubleshooting

**Issue: Dashboard loads slowly**
- Check Redis cache hit rate (should be >80%)
- Verify database indexes on Deal.stage, Document.createdAt
- Review SQL query explain plans for N+1 issues
- Consider precomputing metrics in background job

**Issue: AI queries return irrelevant results**
- Check TIC Core prompt template for query understanding
- Verify Semantic Layer has indexed facts for this firm
- Review QueryLog table to identify common failed queries
- Improve prompt with better examples

**Issue: Real-time updates not appearing**
- Verify SSE connection established (check browser network tab)
- Check Fastify SSE route is sending events correctly
- Ensure firmId filtering is correct (multi-tenancy)
- Test with manual event emission: `pnpm --filter api emit:activity-event`

**Issue: Task inbox showing stale tasks**
- Clear React Query cache: `queryClient.invalidateQueries(['commandCenter', 'tasks'])`
- Verify task completion updates are persisting to database
- Check if task generation workers are running

---

## 12. Non-Negotiables

1. **Dashboard MUST load <2 seconds** (performance SLA)
2. **ALL metrics MUST be filtered by firmId** (multi-tenancy security)
3. **AI queries MUST NOT hallucinate data** (only return facts from Semantic Layer)
4. **Tasks MUST NOT auto-complete** (user action required)
5. **Real-time updates MUST use SSE** (no polling)
6. **Pipeline health MUST show all 6 stages** (Sourcing → Closing)
7. **Activity feed MUST paginate** (no loading all events at once)
8. **Query logs MUST be retained** (analytics and improvement)

---

**For More Information:**
- PRD: `/docs/prds/command-center.md`
- Architecture: `/docs/architecture/experience-layer.md`
- AI Core: `/packages/ai-core/CLAUDE.md` (Query processing)
- Agents: `/packages/agents/CLAUDE.md` (Task generation)
