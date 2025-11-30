# Feature: Deals - Interactive Pipeline OS (Module 3)

**Parent:** Root CLAUDE.md
**Purpose:** Core CRM module for deal pipeline management with AI-driven insights and verifiable fact sheets
**Last Updated:** 2025-11-28
**Module Mapping:** Module 3 of 5 Core Modules - Heart of Trato Hive CRM
**PRD Reference:** `/docs/prds/deals.md`

---

## 1. Purpose

The Deals feature is the **core CRM module** of Trato Hive, providing an interactive pipeline operating system for managing M&A deals from sourcing through closing.

**Core Capabilities:**
- **Interactive Pipeline Views:** Kanban board with drag-and-drop stage transitions + List view with sorting/filtering
- **Deal 360° Hub:** Unified view with tabs for Overview, Fact Sheet, Diligence Room, Documents, Generator, and Activity
- **Verifiable Fact Sheet:** Every number and assertion hyperlinked to source documents with citations (Teal Blue)
- **AI-Powered Next Steps:** Pipeline OS Agent suggests contextual actions based on deal stage, recent activity, and pending tasks
- **Real-Time Collaboration:** WebSocket-driven updates for team workflows

**Key Differentiator:** Unlike traditional CRMs (Salesforce, Affinity), Deals is built citation-first with AI orchestration, making it a "System of Reasoning" rather than a passive database.

**Reference:** `/docs/prds/deals.md` Section 1-3

---

## 2. Ownership

**Owner:** Product & Engineering Teams (Core CRM Team)

**Shared Responsibility:**
- Pipeline stage definitions and workflow rules
- Deal data schema and migrations
- Integration with Semantic Layer for Fact Sheet
- Integration with Agentic Layer for Pipeline OS Agent
- Real-time update infrastructure (WebSocket/SSE)

**Changes Requiring Approval:**
- New pipeline stages or stage transitions (product approval)
- Deal schema changes affecting other modules (architecture review)
- Fact Sheet citation rendering (design review)
- Pipeline OS Agent prompt changes (AI team approval)
- Performance changes to list/Kanban views (>500 deals per firm)

---

## 3. Technology Stack

### Frontend
- **Next.js 15** App Router - Server Components for initial load, Client Components for interactivity
- **React 19** - `use` hook for suspense, transitions for stage updates
- **@dnd-kit/core** 6.x - Accessible drag-and-drop for Kanban board
- **TanStack Table** 8.x - Sortable, filterable List view with virtualization
- **React Query** (TanStack Query 5.x) - Data fetching, caching, optimistic updates
- **Zustand** 4.x - Client state for Kanban/List view toggle, filters, sorts
- **Tailwind CSS 4** - The Intelligent Hive v2.0 design tokens
- **socket.io-client** - Real-time deal updates

### Backend
- **Fastify** 5.2.0 - tRPC router host
- **tRPC** 11.0.0-rc.653 - Type-safe API with procedures for CRUD, stage transitions, fact retrieval
- **Prisma** 6.x - ORM for Deal, Company, Fact models
- **Socket.io** 4.x - WebSocket server for real-time updates
- **Zod** 3.23.8 - Input validation schemas

### AI/ML
- **Pipeline OS Agent** (from `@trato-hive/agents`) - Suggests next steps
- **TIC Core** (from `@trato-hive/ai-core`) - LLM for generating suggestion text

### Package Dependencies
- `@trato-hive/db` - Deal, Company, Fact Prisma models
- `@trato-hive/semantic-layer` - Fact retrieval with citations for Fact Sheet
- `@trato-hive/agents` - Pipeline OS Agent for next steps
- `@trato-hive/ui` - Citation, Card, Tabs, Modal components
- `@trato-hive/shared` - PipelineStage enum, deal validators, types
- `@trato-hive/auth` - RBAC middleware for deal access control

---

## 4. Architecture

### Directory Structure

```
features/deals/
├── frontend/
│   ├── components/
│   │   ├── DealCard.tsx            # Card for Kanban view
│   │   ├── DealKanban.tsx          # Drag-and-drop board
│   │   ├── DealList.tsx            # Table view with TanStack Table
│   │   ├── Deal360.tsx             # Tabbed hub
│   │   ├── FactSheet.tsx           # Verifiable facts with citations
│   │   ├── NextStepsPanel.tsx      # AI-suggested actions
│   │   ├── StageTransitionModal.tsx
│   │   └── DealFilters.tsx
│   ├── hooks/
│   │   ├── useDeals.ts             # React Query hooks
│   │   ├── useDealSocket.ts        # WebSocket subscription
│   │   └── useDealFilters.ts
│   └── utils/
│       ├── deal-helpers.ts         # Stage color, icon, label utils
│       └── citation-formatter.ts
└── backend/
    ├── services/
    │   ├── deal-service.ts         # Business logic for CRUD
    │   ├── fact-sheet-service.ts   # Aggregate facts from Semantic Layer
    │   └── next-steps-service.ts   # Call Pipeline OS Agent
    ├── routers/
    │   └── deals.ts                # tRPC router
    └── validators/
        └── deal-validators.ts      # Zod schemas
```

### Data Flow

**Pipeline View:**
```
User loads /deals
→ Server Component fetches initial deals (tRPC)
→ Client hydrates with React Query cache
→ WebSocket subscription established (firmId room)
→ User drags deal to new stage
→ Optimistic update in React Query (immediate UI feedback)
→ tRPC mutation: deal.updateStage({ id, stage })
→ Backend validates transition, updates DB, emits WebSocket event
→ All connected clients in firmId room receive update
```

**Fact Sheet:**
```
User clicks "Fact Sheet" tab
→ React Query: deal.getFactSheet({ dealId })
→ Backend calls semantic-layer.getFactsForDeal(dealId)
→ Returns facts with sourceDocumentId, pageNumber, excerpt
→ Frontend renders with Citation components (Teal Blue underlines)
→ User clicks citation → CitationModal opens (<200ms)
```

---

## 5. Data Model

### Data Ownership

**Owns:**
- **Deal** - Primary entity with all deal metadata
- **DealActivity** - Audit trail of stage transitions, updates, user actions
- **DealSuggestion** - AI-generated next steps with acceptance tracking

**Reads:**
- **Company** (from `features/discovery`) - Target company for deal
- **Fact** (from `packages/semantic-layer`) - Verifiable facts with citations
- **Document** (from `features/diligence`) - VDR documents linked to deal
- **User** (from `packages/auth`) - Deal owner, team members

**Writes:**
- **Deal** - Create, update, delete, stage transitions
- **DealActivity** - Log all changes for audit trail
- **Task** (to `features/command-center`) - When user accepts AI suggestions

### Key Entities

**Deal (Prisma schema):**
```prisma
model Deal {
  id          String        @id @default(cuid())
  name        String
  stage       PipelineStage @default(Sourcing)
  status      DealStatus    @default(Active)
  value       Float?
  probability Float?
  companyId   String
  firmId      String
  ownerId     String

  company     Company       @relation(...)
  firm        Firm          @relation(...)
  owner       User          @relation(...)
  documents   Document[]
  facts       Fact[]
  activities  DealActivity[]

  @@index([firmId, stage])
  @@index([ownerId])
}

enum PipelineStage {
  Sourcing | Outreach | Meeting | Diligence | IC | Closing
}

enum DealStatus {
  Active | Won | Lost | OnHold
}
```

**DealActivity:**
```typescript
interface DealActivity {
  id: string
  dealId: string
  userId: string
  action: 'created' | 'updated' | 'stage_changed' | 'status_changed'
  changes: Record<string, { from: any; to: any }>
  createdAt: Date
}
```

**DealSuggestion:**
```typescript
interface DealSuggestion {
  id: string
  dealId: string
  text: string
  priority: 'high' | 'medium' | 'low'
  category: 'meeting' | 'document' | 'diligence' | 'decision'
  status: 'pending' | 'accepted' | 'dismissed'
  generatedAt: Date
}
```

---

## 6. API Specification (tRPC)

All procedures use `protectedProcedure` (requires authentication) and `requireFirm` middleware (multi-tenancy).

### Query Procedures

**`deal.list`** - List deals with pagination and filters
```typescript
Input: {
  page?: number          // Default: 1
  limit?: number         // Default: 20, max: 100
  stage?: PipelineStage
  status?: DealStatus
  ownerId?: string
  search?: string        // Search by name or company name
  sortBy?: 'createdAt' | 'updatedAt' | 'value' | 'name'
  sortOrder?: 'asc' | 'desc'
}

Output: {
  deals: Deal[]          // Array with company included
  total: number
  page: number
  limit: number
}
```

**`deal.get`** - Get single deal by ID
```typescript
Input: { id: string }

Output: Deal & {
  company: Company
  owner: User
  activities: DealActivity[]  // Last 10 activities
}
```

**`deal.getFactSheet`** - Get verifiable facts for deal
```typescript
Input: { dealId: string }

Output: {
  facts: Array<{
    id: string
    type: FactType           // Financial, Legal, Operational, Strategic
    content: string          // "Revenue: $15.2M (2023)"
    value?: number
    confidence: number       // 0-1
    sourceDocumentId: string
    sourceDocumentName: string
    pageNumber: number
    excerpt: string
    extractedAt: Date
  }>
  categories: {
    financial: Fact[]
    legal: Fact[]
    operational: Fact[]
    strategic: Fact[]
  }
}
```

**`deal.getNextSteps`** - Get AI-suggested next steps
```typescript
Input: { dealId: string }

Output: {
  suggestions: DealSuggestion[]
  generatedAt: Date
}
```

### Mutation Procedures

**`deal.create`** - Create new deal
```typescript
Input: {
  name: string           // min 3, max 100 chars
  companyId: string
  stage?: PipelineStage  // Default: Sourcing
  value?: number
  probability?: number   // 0-1
  ownerId?: string       // Default: current user
}

Output: Deal
```

**`deal.update`** - Update deal fields
```typescript
Input: {
  id: string
  data: {
    name?: string
    value?: number
    probability?: number
    ownerId?: string
    status?: DealStatus
  }
}

Output: Deal

Side Effects:
- Creates DealActivity entry with changes
- Requires owner or manager role
```

**`deal.updateStage`** - Update pipeline stage (Kanban drag-and-drop)
```typescript
Input: {
  id: string
  stage: PipelineStage
}

Output: Deal

Side Effects:
- Validates stage transition (no skipping stages)
- Creates DealActivity entry with stage_changed action
- Emits WebSocket event to firmId room
```

**`deal.delete`** - Soft delete deal
```typescript
Input: { id: string }

Output: { success: boolean }

Validation:
- User must have Admin or Manager role
- Creates DealActivity entry with deleted action
```

**`deal.acceptSuggestion`** - Accept AI next step
```typescript
Input: {
  dealId: string
  suggestionId: string
}

Output: { success: boolean, taskId?: string }

Side Effects:
- Marks suggestion as accepted
- May create Task in Command Center
```

### Validation & Rate Limiting

**Zod Schemas (deal-validators.ts):**
```typescript
export const createDealSchema = z.object({
  name: z.string().min(3).max(100),
  companyId: z.string().cuid(),
  stage: z.nativeEnum(PipelineStage).optional(),
  value: z.number().positive().optional(),
  probability: z.number().min(0).max(1).optional(),
})

export const updateStageSchema = z.object({
  id: z.string().cuid(),
  stage: z.nativeEnum(PipelineStage),
})
```

**Rate Limits:**
- List queries: 100 requests/minute per user
- Get queries: 200 requests/minute per user
- Create/update mutations: 30 requests/minute per user
- Stage updates: 60 requests/minute per user (for Kanban)

---

## 7. Cross-Feature Integration

### Dependencies on Other Features

**Discovery (features/discovery):**
- Use: Company entity for deal target
- Flow: User searches for company → Creates deal with selected company
- Data: Deal.companyId references Company.id

**Diligence (features/diligence):**
- Use: Document entity for VDR documents
- Flow: Deal 360° → Diligence Room tab → Shows documents for this deal
- Data: Document.dealId references Deal.id

**Generator (features/generator):**
- Use: GeneratedDocument entity for IC decks, LOIs
- Flow: Deal 360° → Generator tab → Generate IC deck for this deal
- Data: GeneratedDocument.dealId references Deal.id

**Command Center (features/command-center):**
- Use: Task entity for next steps
- Flow: User accepts AI suggestion → Creates task in My Tasks inbox
- Data: Task.dealId references Deal.id (optional link)

### Exposes to Other Features

**To All Modules:**
- Deal entity - Read-only access via tRPC procedures
- Pipeline health metrics - Used by Command Center dashboard

**To Diligence:**
- Deal context - dealId required when uploading documents

**To Generator:**
- Deal facts - Generator pulls facts from Fact Sheet to populate IC decks

**To Command Center:**
- Activity feed - Deal activities appear in activity stream

---

## 8. UI Components

### Key Components

**DealCard.tsx** - Card component for Kanban board
- Props: `{ deal: Deal, onDragStart, onDragEnd }`
- Design: Alabaster background, Orange accent line (4px top border), 8px border radius
- Content: Deal name, company name, formatted value, stage badge, last updated
- Drag: Uses `@dnd-kit/core` with keyboard support

**DealKanban.tsx** - Drag-and-drop pipeline board
- Props: `{ deals: Deal[], onStageChange: (dealId, newStage) => void }`
- Layout: 6 columns (one per PipelineStage), horizontal scroll on mobile
- Optimistic update: Card moves immediately, reverts if mutation fails
- Accessibility: Keyboard navigation (arrow keys, Enter to pick up/drop)

**DealList.tsx** - Sortable, filterable table view
- Props: `{ deals: Deal[], filters: DealFilters, onFilterChange }`
- Uses: TanStack Table with virtualization (>100 deals)
- Columns: Name, Company, Stage, Value, Probability, Owner, Last Updated
- Sort: Click column header to toggle asc/desc

**Deal360.tsx** - Tabbed hub for deal details
- Props: `{ dealId: string }`
- Tabs: Overview, Fact Sheet, Diligence Room, Documents, Generator, Activity
- Design: Teal Blue underline for active tab, Alabaster content background
- Lazy loading: Each tab lazy loads its data (React Suspense)

**FactSheet.tsx** - Verifiable facts with citations
- Props: `{ dealId: string }`
- Layout: 4 sections (Financial, Legal, Operational, Strategic)
- Citation: Every number wrapped in `<Citation>` component (Teal Blue underline)
- Modal: Click citation → Opens CitationModal with excerpt (<200ms load)

**NextStepsPanel.tsx** - AI-suggested actions
- Props: `{ dealId: string }`
- Layout: List of suggestions sorted by priority (high → medium → low)
- Actions: Accept → Creates task; Dismiss → Hides suggestion

### Design Compliance

**Colors (The Intelligent Hive v2.0):**
- Background: Bone (#E2D9CB)
- Cards: Alabaster (#F0EEE6)
- Accent: Orange (#EE8D1D) for buttons, accent lines
- Citations: Teal Blue (#2F7E8A) ONLY for citation links
- Text: Black (#1A1A1A)

**Typography:**
- All text: Inter font (no Lora serif)
- Deal name: Inter 600 (semibold), 18px
- Company name: Inter 400 (regular), 14px
- Labels: Inter 500 (medium), 12px uppercase

**Layout:**
- Border radius: 8px minimum
- Spacing: 4px base unit (8px, 16px, 24px, 32px)
- Kanban columns: 320px width, 16px gap
- List table: 100% width, 48px row height

**Citation Implementation:**
```typescript
<Citation
  sourceId={fact.sourceDocumentId}
  sourceDocumentName={fact.sourceDocumentName}
  pageNumber={fact.pageNumber}
  excerpt={fact.excerpt}
  confidence={fact.confidence}
>
  {fact.content}
</Citation>
```

---

## 9. Testing Requirements

### Unit Tests (>80% coverage)

**deal-service.ts:**
- `createDeal()` - Valid input creates deal, invalid throws error
- `updateDeal()` - User with permission can update, unauthorized throws
- `updateStage()` - Valid transition succeeds, invalid throws error
- `deleteDeal()` - Admin/Manager can delete, Analyst/Viewer cannot
- `validateStageTransition()` - Ensures no skipping stages

**fact-sheet-service.ts:**
- `getFactsForDeal()` - Returns facts grouped by category
- `formatFactWithCitation()` - Includes sourceDocumentId, pageNumber, excerpt

**next-steps-service.ts:**
- `generateNextSteps()` - Calls Pipeline OS Agent, returns 3-5 suggestions
- `acceptSuggestion()` - Marks as accepted, creates task if applicable

### Integration Tests (>70% coverage)

**tRPC Procedures:**
- `deal.list` - Returns deals filtered by firmId, respects pagination
- `deal.get` - Returns deal with company, throws if not found or wrong firmId
- `deal.create` - Creates deal, throws validation error with invalid input
- `deal.update` - Updates deal, logs activity, throws permission error
- `deal.updateStage` - Updates stage, emits WebSocket event
- `deal.getFactSheet` - Returns facts with citations, grouped by category

**WebSocket Events:**
- `dealUpdated` - All clients in firmId room receive update
- `dealStageChanged` - Kanban boards auto-update when stage changes

### E2E Tests (Playwright)

**Flow 1: Create deal and move through pipeline**
- User logs in as Manager
- Navigate to /deals
- Click "New Deal" button
- Fill form: name, select company, set value
- Submit → Deal appears in "Sourcing" column
- Drag deal to "Outreach" column
- Confirm transition in modal
- Verify deal moves to "Outreach" column

**Flow 2: View Deal 360° and Fact Sheet**
- User logs in as Analyst
- Click on a deal card
- Verify Deal 360° page loads with tabs
- Click "Fact Sheet" tab
- Verify facts grouped by category
- Click a citation (Teal Blue underlined)
- Verify CitationModal opens in <200ms
- Verify modal shows excerpt with highlighted text

**Flow 3: AI Next Steps**
- User opens Deal 360°
- Verify "Next Steps" panel shows 3-5 suggestions
- Click "Accept" on a suggestion
- Verify toast confirmation
- Navigate to Command Center → My Tasks
- Verify task was created with link to deal

**Flow 4: Collaborative editing**
- User A and User B open /deals (same firmId)
- User A drags deal to new stage
- Verify User B's Kanban auto-updates (WebSocket)

---

## 10. Performance Requirements

### Targets

**Load Times:**
- Pipeline view (Kanban/List): <1 second for 100 deals
- Deal 360° page: <2 seconds (includes initial tab data)
- Fact Sheet tab: <3 seconds (fetching facts from Semantic Layer)
- Next Steps panel: <5 seconds (calling Pipeline OS Agent)

**Interaction:**
- Kanban drag-and-drop: <100ms visual feedback (optimistic update)
- Stage transition mutation: <500ms server round-trip
- Citation modal open: <200ms (prefetch on hover)
- List view sort/filter: <300ms (client-side for <500 deals)

**Real-Time:**
- WebSocket event latency: <100ms from mutation to client update
- Activity feed refresh: <1 second after deal update

**Scalability:**
- Support 1,000 deals per firm without degradation
- List view virtualization at >100 deals
- Kanban pagination: Show 50 deals per stage, lazy load on scroll

### Optimization Strategies

**Frontend:**
- React Query: 5 min stale time for list, 1 min for single deal
- Optimistic updates: Immediate UI feedback, revert on error
- Code splitting: Lazy load Deal 360° tabs
- Virtualization: TanStack Table virtual rows for >100 deals
- Prefetching: Prefetch citation data on hover (200ms delay)
- Debouncing: Search input debounced at 300ms

**Backend:**
- Database indexes: `@@index([firmId, stage])`, `@@index([ownerId])`
- Prisma select: Only fetch required fields
- Pagination: Limit queries to 100 deals max
- Caching: Redis for pipeline health metrics, user permissions
- Query optimization: Use `include` selectively, avoid N+1 queries

**WebSocket:**
- Room-based broadcasting: Emit only to users in firmId room
- Event throttling: Batch rapid updates (>10/sec)
- Reconnection: Auto-reconnect with exponential backoff

---

## 11. Common Patterns

### Pattern 1: Optimistic Stage Updates

```typescript
// frontend/components/DealKanban.tsx
const updateStageMutation = trpc.deal.updateStage.useMutation({
  onMutate: async ({ id, stage }) => {
    await queryClient.cancelQueries({ queryKey: ['deals'] })
    const previousDeals = queryClient.getQueryData(['deals'])

    queryClient.setQueryData(['deals'], (old: Deal[]) =>
      old.map(d => d.id === id ? { ...d, stage } : d)
    )

    return { previousDeals }
  },

  onError: (err, variables, context) => {
    queryClient.setQueryData(['deals'], context.previousDeals)
    toast.error('Failed to update stage')
  },

  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['deals'] })
  }
})

const handleDragEnd = (event) => {
  const { active, over } = event
  if (over) {
    updateStageMutation.mutate({ id: active.id, stage: over.id })
  }
}
```

### Pattern 2: WebSocket Real-Time Updates

```typescript
// frontend/hooks/useDealSocket.ts
export function useDealSocket(firmId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL, {
      auth: { token: getAuthToken() }
    })

    socket.emit('join-firm', firmId)

    socket.on('dealUpdated', (updatedDeal: Deal) => {
      queryClient.setQueryData(['deals'], (old: Deal[]) =>
        old.map(d => d.id === updatedDeal.id ? updatedDeal : d)
      )
      queryClient.invalidateQueries({ queryKey: ['deal', updatedDeal.id] })
    })

    return () => {
      socket.emit('leave-firm', firmId)
      socket.disconnect()
    }
  }, [firmId, queryClient])
}
```

### Pattern 3: Server-Side Fact Aggregation

```typescript
// backend/services/fact-sheet-service.ts
export async function getFactSheetForDeal(dealId: string) {
  // Get facts from Semantic Layer (includes citations)
  const facts = await getFactsForDeal(dealId)

  // Group by category
  const categories = {
    financial: facts.filter(f => f.type === 'Financial'),
    legal: facts.filter(f => f.type === 'Legal'),
    operational: facts.filter(f => f.type === 'Operational'),
    strategic: facts.filter(f => f.type === 'Strategic'),
  }

  // Sort by confidence (high → low)
  Object.values(categories).forEach(category => {
    category.sort((a, b) => b.confidence - a.confidence)
  })

  return { facts, categories }
}
```

---

## 12. Non-Negotiables

1. **Always enforce multi-tenancy** - All queries MUST filter by `firmId` from session
2. **Always log stage transitions** - Create `DealActivity` entry for every stage change
3. **Always use Citation component** - Every number/fact in Fact Sheet MUST have citation
4. **Always validate stage transitions** - Prevent skipping stages (e.g., Sourcing → IC)
5. **Always use optimistic updates** - Kanban drag-and-drop MUST show immediate feedback
6. **Always emit WebSocket events** - Stage changes MUST broadcast to all connected clients
7. **Always require authentication** - All tRPC procedures MUST use `protectedProcedure`
8. **Never store deal data in client state** - Use React Query cache, not Zustand/useState
9. **Never allow cross-firm data access** - Check `session.user.firmId === deal.firmId`
10. **Citation modal MUST load in <200ms** - Prefetch on hover, optimize S3 presigned URLs

---

**For More Information:**
- PRD: `/docs/prds/deals.md` (855 lines - comprehensive requirements)
- Architecture: `/docs/architecture/experience-layer.md` (Module 3 details)
- Root CLAUDE.md: `/CLAUDE.md` (Sections 2-3 - Product Context, Architecture)
- Design System: `/context/style-guide.md` (The Intelligent Hive v2.0)
- Semantic Layer: `/packages/semantic-layer/CLAUDE.md` (Fact retrieval)
- Agents: `/packages/agents/CLAUDE.md` (Pipeline OS Agent)
