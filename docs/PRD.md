# PRD: Trato Hive Root

**Status:** Draft  
**Last Updated:** 2025-11-12  
**Owner:** Product & Engineering Teams  
**Priority:** Critical

---

## 1. Problem Statement

The mergers and acquisitions (M&A) ecosystem is fragmented and manual. Deal teams juggle dozens of spreadsheets, data rooms, email threads and disparate tools to source, screen, diligence and close investments. Traditional CRMs treat deals as static records rather than dynamic, evidence‑backed stories.  
Existing “AI‑enabled” tools layer chatbots on top of static databases, offering little more than auto‑fill fields or basic analytics. Mainstream CRMs also lack **relationship intelligence**—they cannot automatically log emails or meeting notes, enrich contacts or surface warm introductions【901997652264231†L82-L87】—and they do not assist with drafting documents such as Confidential Information Memoranda (CIMs), pitch decks, buyer profiles or meeting prep materials【32184628154010†L160-L190】【248476347016084†L74-L176】. There is no unified system that produces **verifiable** AI output; numbers and insights are often unverifiable or based on untraceable training data【564290982268161†L115-L130】. Compliance teams are left worrying about hallucinations and fiduciary risks, while deal teams waste time re‑checking the AI’s work.

**Current State:**
- Deal professionals rely on separate tools for sourcing (Grata, PrivCo), pipeline management (Salesforce, Airtable) and diligence (Virtual Data Rooms)【564290982268161†L92-L110】【564290982268161†L138-L159】.  
- Data is copied manually between systems, creating inconsistent records and version control issues.  
- AI adoption is piecemeal; when used, outputs are not traceable to source documents, leading to compliance concerns【516335038796236†L8-L17】.  
- Pipeline health indicators, risk flags and tasks are hidden across emails and spreadsheets, delaying decision‑making.  
- Users have no single dashboard to answer questions like “What are our live deals?”, “Which targets match our thesis?”, or “What risks are emerging in diligence?”

In addition:
- There is **no automatic capture of relationship data**. Emails, calendar invites and meeting notes must be entered manually into the CRM; there is no unified **network graph** showing relationship strength or warm introductions【901997652264231†L82-L87】.  
- Critical deliverables such as CIMs, pitch decks, buyer books, meeting prep briefs and news runs are drafted by hand or in other tools; general‑purpose CRMs offer no AI assistance for synthesising research into these materials【32184628154010†L160-L190】【248476347016084†L74-L176】.

**Desired State:**
Trato Hive aims to become the **AI‑Native System of Reasoning** for M&A by unifying sourcing, pipeline management and diligence into one platform. Every AI‑generated insight will be **hyperlinked to its source**, enabling auditors and IC members to verify the origin of any number or claim【564290982268161†L115-L130】.  
The platform will orchestrate workflows end‑to‑end using agents; drag‑and‑drop ingestion of documents, natural‑language sourcing queries, interactive pipeline views and automated diligence Q&A will live in one experience.  
Users should be able to ask the system anything—from high‑level pipeline questions to deep fact lookups—and receive instantaneous, citation‑backed answers. Instead of context switching between tools, deal teams will work within Trato Hive from target discovery through closing, reducing friction and accelerating outcomes.

Beyond unification and verifiability, **Trato Hive will embed advanced AI capabilities**. The platform will include **relationship intelligence** that automatically logs emails, meetings and call notes, enriches contacts and computes relationship strength to surface warm introductions and network insights【901997652264231†L82-L87】. It will also **generate deliverables on demand**—drafting CIMs, pitch decks, buyer profiles, meeting prep briefs and news runs using AI trained on financial patterns【32184628154010†L160-L190】【248476347016084†L74-L176】. All outputs will be citation‑linked to the underlying data, allowing users to trust and audit the generated content.

---

## 2. Goals & Non‑Goals

### Goals (What we **will** do)
1. **Unify the M&A workflow:** Provide a single application encompassing sourcing, pipeline management, diligence and material generation【564290982268161†L92-L110】【564290982268161†L138-L160】.  
2. **Citations everywhere:** Implement the citation‑first principle so that all AI‑generated numbers, facts and documents link back to their source documents【516335038796236†L8-L17】【516335038796236†L90-L99】.  
3. **Agentic orchestration:** Use AI agents to execute multi‑step workflows (e.g. generating tasks, finding lookalike companies, answering diligence questions) rather than merely suggesting actions【564290982268161†L115-L130】.  
4. **API‑first platform:** Expose all major functionalities through a versioned REST API to enable integration into existing firm workflows and custom frontends【564290982268161†L196-L203】.  
5. **Scale securely:** Meet SOC2 Type II and GDPR requirements with robust authentication, authorization, encryption and audit logging【564290982268161†L196-L204】.
6. **Advanced AI capabilities:** Provide relationship intelligence and deliverable generation. The system will automatically capture emails, meetings and call notes to build a **network graph** of relationship strength and warm introductions【901997652264231†L82-L87】. It will leverage AI to generate CIMs, strip profiles, pitch decks, buyer books, meeting‑prep briefs and news runs, all with source‑linked citations【32184628154010†L160-L190】【248476347016084†L74-L176】.

### Non‑Goals (What we **will not** do in this version)
1. Build a generalized CRM for non‑M&A use cases (e.g. sales, marketing or support).  
2. Offer enterprise‑grade customization of data models beyond the defined schema (custom fields may be supported in later phases).  
3. Train proprietary LLMs on customer data—models are accessed via third‑party APIs and no training occurs on user information【564290982268161†L196-L204】.  
4. Provide advanced portfolio management or financial modeling; these capabilities may be addressed by future integrations.

---

## 3. User Stories

### Primary User Personas
- **PE/M&A Associate:** Works at a private equity firm or corporate development team. Responsible for sourcing opportunities, managing deal pipelines and performing first‑pass analysis. Needs to quickly identify targets that match investment theses, monitor pipeline health and produce material for IC meetings.  
- **Diligence Analyst:** Focuses on deep due diligence once a target is under LOI. Needs to ingest seller data rooms, answer investor questions accurately, and flag potential risks. Cares about traceability and compliance.  
- **Investment Committee Member:** Senior decision maker reviewing deals. Requires concise, accurate materials with clear citations to trust the underlying data. Needs high‑level dashboards and the ability to drill into details.

### User Stories (Format: As a [user], I want to [action], so that [benefit])

**Epic 1: Unified Pipeline**
- As a **PE Associate**, I want to drag and drop deals across pipeline stages in a kanban view, so that I can intuitively manage progress and spot bottlenecks.  
- As a **PE Associate**, I want to click into a deal and see a 360° view with overview, diligence status, documents and activity, so that I can get a complete picture of the deal in one place【564290982268161†L117-L135】.

**Epic 2: Verifiable Insights**
- As a **Diligence Analyst**, I want every KPI (e.g. EBITDA) displayed in the deal overview to be a hyperlink to its source document page, so that I can verify numbers during IC presentations【564290982268161†L123-L129】.  
- As an **IC Member**, I want to click on a citation and view the exact excerpt from the original document with highlights, so that I can trust AI‑generated content【516335038796236†L8-L17】.

**Epic 3: Intelligent Sourcing & Diligence**
- As a **PE Associate**, I want to search for companies using natural language queries (e.g. “UK SaaS companies with 10–50 employees and 20% growth”), so that I can quickly build target lists without complex filters【564290982268161†L94-L108】.  
- As a **Diligence Analyst**, I want to submit questions to the diligence room and receive AI‑suggested answers with citation links, so that I can accelerate Q&A workflows while maintaining accuracy【564290982268161†L146-L153】.

---

## 4. User Experience (UX Flow)

### Entry Point
Users authenticate via SSO and land on the **Hive Command Center**—a dynamic dashboard containing an AI query bar, an AI‑generated task inbox, a pipeline health widget and a real‑time activity feed【564290982268161†L69-L88】. The top navigation includes five modules: Command Center, Discovery, Deals, Diligence and Generator【516335038796236†L103-L112】.

### Main User Flow (Step‑by‑Step)
1. **User Action:** Log in via SSO.  
   - **System Response:** Authenticates user and loads the Command Center.  
   - **UI State:** Dashboard with conversational AI bar, task list, honeycomb pipeline chart and activity feed.
2. **User Action:** Enter a natural‑language query (“Show deals in diligence stage”).  
   - **System Response:** Parses intent through the Agentic layer and TIC, queries the Semantic layer and returns results.  
   - **UI State:** Pipeline widget highlights deals in the selected stage; tasks update accordingly【564290982268161†L76-L85】.
3. **User Action:** Navigate to the **Deals** tab.  
   - **System Response:** Loads an interactive pipeline view with Kanban (drag‑and‑drop) and list toggles.  
   - **UI State:** Deals grouped by stage on a Soft Sand background; stage headers in Charcoal Black【564290982268161†L117-L122】.
4. **User Action:** Click a deal card.  
   - **System Response:** Opens the Deal 360° view with tabs for Overview, Diligence, Documents and Activity【564290982268161†L123-L135】.  
   - **UI State:** Verifiable Fact Sheet with teal hyperlinks; AI‑suggested next steps; citation modal accessible via click.
5. **User Action:** In the **Diligence** tab, upload VDR documents or submit Q&A questions.  
   - **System Response:** Documents are ingested via the data plane; AI generates suggested answers with citations; risks are flagged【564290982268161†L146-L159】.  
   - **UI State:** Q&A list shows AI suggestions in teal with `[cite]` links; risk panel highlights clauses.
6. **User Action:** Switch to **Generator** tab and generate an IC deck.  
   - **System Response:** Agentic layer queries the Verifiable Fact Layer and produces a PowerPoint deck with “golden” citation links【564290982268161†L170-L177】.  
   - **UI State:** User can preview slides and click numbers to see source citations before downloading.

### Exit Points
- **Primary Path:** User returns to Command Center to pick the next task or log out.  
- **Alternative Paths:** User may branch into Discovery for sourcing or continue working within individual deals; all navigation persists across modules.

### Edge Cases
- **Network Failure:** If API requests fail, show an error state with retry option and log the error for developers.  
- **Insufficient Permissions:** If a user attempts to access a module without the required role, display a clear message and guide them to request access.  
- **Large Data Sets:** Paginate lists and use skeleton loaders to maintain performance when hundreds of deals or documents are present【516335038796236†L54-L67】.

---

## 5. Features & Requirements

### Feature 1: Hive Command Center (Module 1)

**Description:** Dynamic home dashboard providing AI query, AI‑generated tasks, pipeline health visualization and real‑time activity feed【564290982268161†L69-L88】.

**Functional Requirements:**
1. Provide a top search bar that accepts natural‑language queries and routes them to the TIC via the Agentic layer.  
2. Display an AI‑generated task list (“My Tasks”) updated in real‑time as agents detect new actions.  
3. Show a pipeline health widget (honeycomb chart) summarizing deals by stage and flagging stagnation risks.  
4. Maintain a real‑time activity feed across deals (documents uploaded, tasks completed).  
5. Persist user settings for widget ordering and filters (per‑user preferences stored in database).

**Non‑Functional Requirements:**
- **Performance:** Dashboards must load within 2 seconds; query responses should arrive <500 ms p95【516335038796236†L54-L67】.  
- **Scalability:** Support firms with hundreds of deals and thousands of tasks.  
- **Security:** Only authenticated users can access tasks; data must be filtered by firmId (row‑level security).  
- **Accessibility:** Keyboard navigation and screen reader labels for all widgets; color contrast meets WCAG 2.1 AA.

**UI/UX Requirements:**
- Soft Sand panels with rounded corners; Teal Blue for AI prompts; Gold accent lines separating sections【564290982268161†L69-L88】.  
- Use `Button`, `Card`, `Chart` and `ActivityFeed` components from the `@trato-hive/ui` package.  
- The query bar uses Inter font with placeholder text “Ask Hive anything…”.  
- The honeycomb chart uses hexagonal patterns; stagnating deals highlighted in Teal Blue or Gold.

**Dependencies:**
- Packages: `packages/agents` (command‑center agent), `packages/ai-core` (TIC), `packages/semantic-layer` (facts), `packages/ui` (chart components).  
- Other Features: Deals (pipeline data), Diligence (task count), Generator (task count).  
- External Services: WebSocket or SSE for real‑time updates.

### Feature 2: Discovery (Module 2)

**Description:** AI‑native sourcing module enabling natural‑language company searches, lookalike discovery and auto‑generated market maps【564290982268161†L94-L110】.

**Functional Requirements:**
1. Accept complex thesis queries (location, size, growth, sector) and return ranked company lists.  
2. Allow users to select a company and request “Lookalike discovery” to find similar companies based on deeper attributes.  
3. Generate visual market maps using hexagonal cluster diagrams highlighting market segments.  
4. Allow users to add selected targets directly to the pipeline.  
5. Provide filters and sorting for results (size, revenue, growth rate).

**Non‑Functional Requirements:**
- **Performance:** Return search results in <5 seconds; asynchronously update market maps.  
- **Security:** Only authorized users can access firm‑level query history.  
- **Accessibility:** All interactive elements keyboard accessible; charts provide alt text.  
- **Scalability:** Should handle thousands of companies per search; leverages vector search for semantic matching.

**UI/UX Requirements:**
- Discovery workspace uses Soft Sand background with tabbed results; search bar in Teal Blue; market map hexagons in Teal Blue and Gold.  
- Use `SearchBar`, `TargetList`, `MarketMap` components.  
- Provide friendly empty states when no results match the query (“No companies found – try broadening your criteria”).

**Dependencies:**
- Packages: `packages/agents` (Sourcing Agent), `packages/ai-core`, `packages/semantic-layer` (company records), `packages/ui`.  
- External: External company data sources integrated via ingestion pipelines; vector database for semantic search.

### Feature 3: Deals (Module 3)

**Description:** Interactive pipeline OS with Kanban/List views, Deal 360° view, Verifiable Fact Sheet and AI‑suggested next steps【564290982268161†L117-L135】.

**Functional Requirements:**
1. Display deals grouped by stage in a Kanban board; support drag‑and‑drop reordering and stage changes.  
2. Provide a toggle to switch between Kanban and List views for power users.  
3. On clicking a deal, show a tabbed Deal 360° view with Overview, Diligence, Documents and Activity tabs.  
4. In the Overview tab, show key KPIs in a Verifiable Fact Sheet; each number must be a clickable teal hyperlink that opens a citation modal showing the source document snippet【564290982268161†L123-L129】.  
5. Present AI‑suggested next steps based on pipeline agent insights.  
6. Allow creation, update and deletion of deals via REST API; support updating pipeline stage via drag or API.  
7. Provide pagination and filtering for large lists (by stage, owner, company).  
8. Ensure concurrency safety when multiple users edit deals simultaneously.

**Non‑Functional Requirements:**
- **Performance:** Kanban board loads within 2 seconds; moving a card updates state in <250 ms; Deal 360° view loads in <1 second.  
- **Scalability:** Support firms with hundreds of active deals; virtualization for long lists.  
- **Security:** Only authorized roles can create/edit/delete deals; row‑level security enforced by firmId.  
- **Accessibility:** Drag‑and‑drop must be keyboard accessible; citations accessible to screen readers.

**UI/UX Requirements:**
- Deal cards: Soft Sand background with a Gold accent line at the top; stage headers in Charcoal Black; interactivity via drag handle.  
- Verifiable Fact Sheet: White card with Gold border, radius‑lg; numbers in Teal Blue with underline; on hover, show pointer cursor.  
- Use `DealCard`, `KanbanBoard`, `Deal360View`, `VerifiableNumber` and `CitationModal` components.  
- Tab navigation uses Teal Blue active indicator; cards use Lora for headings and Inter for body.

**Dependencies:**
- Packages: `packages/agents` (Pipeline OS Agent), `packages/semantic-layer` (facts), `packages/data-plane` (documents), `packages/ui`.  
- Other Features: Diligence (diligence tab), Generator (generator tab).  
- External Services: None beyond vector DB and LLM providers.  

### Feature 4: Diligence (Module 4)

**Description:** AI‑native virtual data room (VDR) that ingests seller documents, automates Q&A and highlights risks【564290982268161†L138-L160】.

**Functional Requirements:**
1. Provide drag‑and‑drop upload of entire data rooms; automatically OCR and index documents into the Verifiable Fact Layer【564290982268161†L146-L149】.  
2. Allow analysts to submit diligence questions; automatically search VDR and generate suggested answers with `[cite]` links【564290982268161†L146-L153】.  
3. Detect repeat questions and auto‑populate answers.  
4. Scan all documents for non‑standard or high‑risk clauses and display summaries in a risk panel【564290982268161†L154-L159】.  
5. Allow analysts to approve/edit AI‑suggested answers before final publication.  
6. Support versioning and audit trail for Q&A responses.

**Non‑Functional Requirements:**
- **Performance:** Upload pipeline must handle gigabytes of documents; indexing can be asynchronous but initial ingestion progress visible.  
- **Scalability:** Should scale across thousands of documents per deal.  
- **Security:** Data encrypted at rest and in transit; access restricted to authorized users; audit logs recorded for document ingestion and Q&A approvals.  
- **Accessibility:** Q&A interface keyboard accessible; risk summaries color‑coded with icons and alt text.

**UI/UX Requirements:**
- VDR upload area: Soft Sand drag‑and‑drop zone with progress indicator; preview thumbnails for uploaded files.  
- Q&A list: Each AI‑suggested answer displayed in Teal Blue with a `[cite]` link; unapproved answers flagged; actions for approve/edit/reject.  
- Citation modal: Full‑screen overlay with Soft Sand background, White content area, highlighted excerpt; radius‑lg; load under 200 ms【516335038796236†L90-L99】.  
- Risk panel: Gold accent header; items listed with severity icons (Warning Orange, Error Red, Info Blue).  
- Use `VDRUploader`, `QAInterface`, `RiskSummary` and `CitationModal` components.

**Dependencies:**
- Packages: `packages/data-plane` (ingestion & OCR), `packages/semantic-layer` (facts), `packages/agents` (Diligence Agent), `packages/ai-core`, `packages/ui`.  
- External Services: OCR libraries (Tesseract.js), AWS S3 or equivalent for storage.

### Feature 5: Generator (Module 5)

**Description:** Generates auditable materials (IC decks, LOIs, memos) with “golden” citations for all figures【564290982268161†L170-L177】.

**Functional Requirements:**
1. Provide templates for Investment Committee decks, Letters of Intent and buyer memos; allow users to select a template.  
2. On “Generate IC Deck,” query the Verifiable Fact Layer for all relevant facts and generate a 20‑slide deck covering company overview, financials, market, risks and team【564290982268161†L170-L177】.  
3. Insert small Gold citation links next to every chart, table or key number; clicking a citation opens the source document snippet (golden citation)【564290982268161†L170-L177】.  
4. Allow users to preview the deck in a viewer, edit content in‑app and download as PowerPoint.  
5. Support LOI/Memo draft generation using verified facts (names, terms, clauses).  
6. Provide generation status and progress bar; allow asynchronous generation for large decks.

**Non‑Functional Requirements:**
- **Performance:** Generation must complete within 30 seconds (for typical deals); progress indicator should update every few seconds.  
- **Scalability:** Support concurrent generation requests for different deals.  
- **Security:** Only authorized users can generate materials; generated files stored securely; citations maintain confidentiality of underlying documents.  
- **Accessibility:** Preview panel keyboard accessible; color contrast for Gold citations and Teal Blue links meets WCAG standards.

**UI/UX Requirements:**
- Template selector: Grid of cards with preview thumbnails; Gold button for primary “Generate.”  
- Progress bar: Soft Sand background with Gold progress indicator; display step names (gathering facts, synthesizing slides, embedding citations).  
- Preview panel: Deck viewer with slide thumbnails; numbers hyperlinked; Gold citation icons; ability to click to open citation modal.  
- Use `TemplateSelector`, `GenerationProgress`, `PreviewPanel` and `CitationLinker` components.

**Dependencies:**
- Packages: `packages/agents` (Generator Agent), `packages/semantic-layer`, `packages/ai-core`, `packages/data-plane`, `packages/ui`.  
- External Services: Office file generation libraries (e.g. pptxgenjs), vector DB for fact retrieval, LLM providers for narrative synthesis.

---

## 6. Data Model & Architecture

### Data Entities

**User**
```typescript
interface User {
  id: string
  firmId: string
  name: string
  email: string
  role: UserRole // Admin | Manager | Analyst | Viewer
  createdAt: Date
  updatedAt: Date
}
```

**Firm**
```typescript
interface Firm {
  id: string
  name: string
  region: string
  createdAt: Date
  updatedAt: Date
}
```

**Deal**
```typescript
interface Deal {
  id: string
  firmId: string
  name: string
  stage: PipelineStage // sourcing | screening | diligence | ic_prep | closing | portfolio
  companyId: string
  ownerId: string
  createdAt: Date
  updatedAt: Date
}
```

**Company**
```typescript
interface Company {
  id: string
  name: string
  industry: string
  location: string
  employees: number
  revenue?: number
  yoyGrowth?: number
  createdAt: Date
  updatedAt: Date
}
```

**Document**
```typescript
interface Document {
  id: string
  dealId: string
  name: string
  fileType: DocumentType // pdf | xlsx | email | other
  source: string // Upload source (VDR, email)
  storageUrl: string
  uploadedAt: Date
  processedAt?: Date
}
```

**Fact**
```typescript
interface Fact {
  id: string
  dealId: string
  documentId: string
  pageNumber: number
  excerpt: string
  type: FactType // financial_metric | risk | clause | other
  value: string | number
  confidence: number // 0-1
  createdAt: Date
  updatedAt: Date
}
```

**Task**
```typescript
interface Task {
  id: string
  firmId: string
  dealId?: string
  title: string
  description: string
  state: TaskState // pending | in_progress | completed
  assignedTo?: string
  createdAt: Date
  updatedAt: Date
}
```

**GeneratedDocument**
```typescript
interface GeneratedDocument {
  id: string
  dealId: string
  type: 'ic_deck' | 'loi' | 'memo'
  status: 'generating' | 'ready' | 'error'
  fileUrl?: string
  createdAt: Date
  updatedAt: Date
}
```

### Architecture Layers

**7‑Layer Architecture Integration:**
- **Layer 1 (Data Plane):** Handles ingestion of documents (PDFs, XLSX, emails), OCR, storage (S3) and metadata extraction. Used by Diligence and Data‑plane services【564290982268161†L146-L149】.  
- **Layer 2 (Semantic Layer):** Stores verifiable facts and knowledge graph; supports queries by agents and provides facts to the UI【564290982268161†L123-L129】.  
- **Layer 3 (TIC Core):** Hosts the reasoning engine that parses natural language queries, generates answers and summarises content via LLMs【564290982268161†L146-L153】.  
- **Layer 4 (Agentic Layer):** Coordinates multi‑step workflows such as sourcing, pipeline management, diligence Q&A and material generation【564290982268161†L115-L130】.  
- **Layer 5 (Experience Layer):** Comprises the Next.js frontend and Express backend; orchestrates UI/UX interactions and REST APIs.  
- **Layer 6 (Governance Layer):** Enforces authentication, authorization, audit logging and compliance (SOC2, GDPR)【564290982268161†L196-L204】.  
- **Layer 7 (API Layer):** Exposes REST endpoints for all modules, supports pagination, filtering, rate limiting and versioning【564290982268161†L196-L203】.

### Data Ownership
- **Owns:**
  - Deals: features/deals; owns deal records and pipeline stages.  
  - Companies: features/discovery; owns target lists.  
  - Documents: packages/data‑plane; handles ingestion, storage and metadata.  
  - Facts: packages/semantic-layer; stores citations and fact values.  
  - Users & Auth: packages/auth and packages/db.  

- **Reads:**
  - Command Center reads deals, tasks and semantic data to populate dashboard.  
  - Generator reads facts and documents to build presentations.  
  - Diligence reads documents and facts; writes Q&A responses.  

- **Writes:**
  - Diligence writes tasks, new facts and risk summaries.  
  - Discovery writes new target lists and saves selected companies to pipeline.  
  - Deals writes deal updates, stage changes and AI‑suggested next steps.

---

## 7. API Specification

The platform exposes a versioned REST API under `/api/v1/`. Each module has its own set of endpoints (detailed in feature PRDs). This section summarises key patterns.

### Authentication & Authorization
- All endpoints require a Bearer JWT token except public auth routes (login, refresh).  
- Roles determine access: **Admin**, **Manager**, **Analyst**, **Viewer**.  
- Firm isolation enforced via `firmId` field; users cannot access records belonging to other firms.

### Response Format
Successful responses follow the pattern:
```typescript
// Status: 200 | 201 | 204
{
  data: T | null,
  meta?: {
    page?: number,
    limit?: number,
    total?: number
  }
}
```
Error responses include:
```typescript
// Status: 400 | 401 | 403 | 404 | 500
{
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

### Rate Limiting
Default rate limit is 100 requests per minute per user. Exceeding the limit returns HTTP 429.

### Pagination & Filtering
- List endpoints support `page`, `limit` and optional `filters` (e.g., `stage=screening`).  
- Default limit is 25; maximum is 100.  
- Sorting by supported fields via `sort=createdAt&order=desc`.

### Sample Endpoints (Full details in feature PRDs)
- **Deals:** `GET /api/v1/deals`, `POST /api/v1/deals`, `GET /api/v1/deals/:id`, `PATCH /api/v1/deals/:id`, `DELETE /api/v1/deals/:id`, `GET /api/v1/deals/:id/fact-sheet`, `GET /api/v1/deals/:id/next-steps`, `PATCH /api/v1/deals/:id/stage`.  
- **Discovery:** `POST /api/v1/discovery/search`, `POST /api/v1/discovery/lookalike`, `GET /api/v1/discovery/market-map`.  
- **Diligence:** `POST /api/v1/deals/:id/vdr/upload`, `GET /api/v1/deals/:id/vdr/documents`, `POST /api/v1/deals/:id/diligence/qa`, `GET /api/v1/deals/:id/diligence/qa`, `PATCH /api/v1/deals/:id/diligence/qa/:qaId`, `GET /api/v1/deals/:id/diligence/risks`.  
- **Generator:** `POST /api/v1/deals/:id/generate/ic-deck`, `POST /api/v1/deals/:id/generate/loi`, `GET /api/v1/deals/:id/generate/status`, `GET /api/v1/deals/:id/generate/preview`, `POST /api/v1/deals/:id/generate/download`.  
- **Command Center:** `GET /api/v1/command-center/tasks`, `GET /api/v1/command-center/pipeline-health`, `POST /api/v1/command-center/query`.

---

## 8. Testing & Acceptance Criteria

### Unit Testing Requirements
- All services and utilities must achieve >80 % code coverage.  
- Unit tests for controllers validate request/response schemas using Zod.  
- Citation extraction and linking algorithms tested with edge cases (missing pages, multiple citations).  
- UI components have snapshot tests and accessibility checks with React Testing Library.

### Integration Testing Requirements
- End‑to‑end tests for API endpoints (e.g., create deal → update stage → fetch fact sheet).  
- Database interactions tested using a test database and transactional rollbacks.  
- External services (OCR, LLMs) mocked to ensure predictable outcomes.

### E2E Testing Requirements (User Flows)
- [ ] User logs in → views Command Center dashboard.  
- [ ] PE Associate searches for companies → adds targets to pipeline → sees them in Deals.  
- [ ] Analyst uploads VDR → receives suggested answers → approves and sees them reflected in Deal 360° view.  
- [ ] User generates IC deck → verifies golden citations in preview → downloads deck.  
- [ ] Keyboard navigation through Kanban board and citation modals.

### Acceptance Criteria (Checklist)

**Functional:**
- [ ] The five modules operate end‑to‑end without broken flows.  
- [ ] All numbers displayed in the UI for deals and documents are hyperlinked to their source.  
- [ ] Users can create, read, update and delete deals, documents, tasks and generated documents.  
- [ ] Natural‑language search returns relevant companies within 5 seconds.  
- [ ] Diligence Q&A suggestions are editable and approval flow works.  
- [ ] IC deck generation produces 20 slides with citations; downloads correctly.

**Non‑Functional:**
- [ ] API response time <500 ms p95 for most endpoints; AI operations <5 seconds or display async progress.  
- [ ] SOC2 and GDPR compliance requirements met: encrypted data, audit logs and no training on user data【564290982268161†L196-L204】.  
- [ ] Accessibility: WCAG 2.1 AA compliance; keyboard navigation; screen reader labels.  
- [ ] Testing: >80 % code coverage; integration tests for each API; Playwright E2E tests for core flows.

**Design:**
- [ ] All UI uses The Intelligent Hive design tokens: Soft Sand, Gold, Charcoal Black and Teal Blue; typography follows Lora and Inter【564290982268161†L115-L130】.  
- [ ] Minimum 8 px border‑radius on all components.  
- [ ] Citation links styled in Teal Blue with underline; hover state changes to Teal Light.  
- [ ] Modal design matches specification (600 px max width, radius‑lg, Soft Sand overlay).  
- [ ] Hexagonal patterns used for honeycomb charts and market maps.  
- [ ] Visual regression tests pass.

**Documentation:**
- [ ] API documentation complete in `docs/api/openapi.yaml`.  
- [ ] All PRDs cross‑reference correct modules and architectures.  
- [ ] README and CHANGELOG updated with release notes.  
- [ ] Revision history maintained in PRD appendix.

---

## 9. Design Specifications

### The Intelligent Hive Integration

**Color Usage:**
- **Soft Sand (`#F5EFE7`):** Use as the primary background for panels, cards and workspaces.  
- **Gold/Honey (`#E2A74A`):** Use for accent lines, call‑to‑action buttons and citation borders.  
- **Charcoal Black (`#1A1A1A`):** Use for primary text, headers and structural elements.  
- **Teal Blue (`#2F7E8A`):** Use for AI‑generated insights, links and citation text; active tab indicators.【516335038796236†L13-L17】

**Typography:**
- **Headings:** Lora (semibold) for H1‑H3, with sizes from 48 px to 28 px; H4 uses Inter.  
- **Body/UI:** Inter, sizes 16 px for body, 14 px for labels, 12 px for captions【861078381458516†L85-L97】.  
- Use semibold weight (600) for headings and medium (500) for labels; regular (400) for body text.

**Components:**
- Use `Button`, `Input`, `Card`, `Modal`, `Citation`, `VerifiableNumber`, `HexagonPattern`, `Tabs` and `Navigation` from `@trato-hive/ui`.  
- Buttons follow primary (Gold), secondary (outline), tertiary (Teal) and destructive (Red) styles【861078381458516†L172-L213】.  
- Cards and modals follow the spacing, border and shadow tokens defined in the style guide【861078381458516†L246-L273】【861078381458516†L286-L294】.  
- Citation links: Teal Blue with underline; on hover lighten to Teal Light; pointer cursor; accessible via keyboard【861078381458516†L276-L283】.

**Citation‑First Principle:**
- All verifiable numbers/facts are rendered as a `VerifiableNumber` component that wraps the value and a citation link.  
- Clicking a citation link opens a modal showing the source document name, page number and highlighted excerpt; modal loads <200 ms【516335038796236†L90-L99】.  
- Citation modal design: White content area on a dark overlay; radius‑lg (12 px); Soft Sand background behind overlay; close via Esc key or X button; trap focus for accessibility.

**Wireframes / Mockups:**
- Wireframes for major screens will be provided via Figma; design tokens and patterns follow the style guide.  
- Include honeycomb charts for pipeline health; hexagonal market maps; fact sheet with gold border and teal citations.  
- On mobile, navigation collapses into a hamburger menu; layouts stack vertically.

---

## 10. Security & Compliance

### Authentication & Authorization
- **Authentication Required:** Yes; JWT tokens issued upon login; optional OAuth/SAML integration.  
- **Roles Allowed:** Admin, Manager, Analyst, Viewer.  
- **Row‑Level Security:** All queries filter by `firmId`; users cannot access deals/documents belonging to other firms【564290982268161†L196-L204】.

### Data Privacy
- **PII Handling:** Store only necessary user information (name, email, role). All PII encrypted at rest (AES‑256) and in transit (TLS 1.3).  
- **GDPR Compliance:** Support data erasure (delete all user‑related records) and data export (provide user data upon request).  
- **Encryption:** Use AES‑256 at rest and TLS 1.3 for all connections【564290982268161†L196-L204】.  
- **No Training on User Data:** Models do not train on customer data; only use retrieval‑augmented generation with anonymized context.【564290982268161†L196-L204】

### Audit Logging
- **Events to Log:**
  - User logins and logouts.  
  - Deal creation, updates, deletions.  
  - Document uploads, downloads and deletions.  
  - Fact extraction events and citation generation.  
  - Q&A submissions, AI suggestions and approvals.  
  - Material generation requests and downloads.
- **Log Format:**
```typescript
{
  timestamp: string, // ISO8601
  userId: string,
  firmId: string,
  action: string,
  resourceId?: string,
  metadata: object
}
```

### Security Considerations
- Input validation via Zod for all endpoints; reject malformed data.  
- Use parameterized queries via Prisma to prevent SQL injection.  
- Sanitize all user‑generated content in the UI to prevent XSS.  
- Apply rate limiting and IP throttling to protect against abuse.  
- Store secrets in environment variables (not in code).  
- Regularly perform dependency audits and vulnerability scans.

---

## 11. Performance Requirements

### Response Times
- **Page Load:**  <2 seconds for dashboard and pipeline views under typical data volumes.  
- **API Calls:** <500 ms p95 for CRUD operations; <1 second for list endpoints; <5 seconds for AI operations (search, Q&A, generation).  
- **AI Operations:** Long‑running tasks (e.g., deck generation) are asynchronous; progress must be reported via status endpoints.

### Scalability
- Support hundreds of concurrent users per tenant and thousands of records per entity.  
- Use pagination and lazy loading to limit data fetched.  
- Deploy horizontally scalable services (stateless APIs behind load balancers).  
- Externalize heavy computations to background workers (document ingestion, embedding generation).  
- Use caching (e.g. Redis) for frequently accessed data (pipelines, tasks).

### Optimization Strategies
- **Caching strategy:** Implement caching at API gateway and service layer; configure TTL for pipeline and discovery queries.  
- **Database indexing:** Create indexes on `firmId`, `createdAt`, `stage` and frequently filtered fields.  
- **Lazy loading:** Load heavy components (detailed tables, modals) only when needed.  
- **Code splitting:** Split frontend bundles by route; prefetch modules on hover.  
- **Compression:** Use gzip or Brotli for API responses and assets.

---

## 12. Risks & Mitigations

### Technical Risks

**Risk 1:** **Citation extraction accuracy.** Extracting precise excerpts from OCR‑processed documents may fail due to poor scan quality or complex layouts.  
- **Impact:** High (errors could undermine trust).  
- **Likelihood:** Medium.  
- **Mitigation:** Employ multi‑pass OCR and fallback heuristics; enable manual citation correction; record confidence scores and surface low‑confidence flags to analysts.【516335038796236†L8-L17】

**Risk 2:** **Latency of AI operations.** LLM responses and embedding generation could be slow during peak usage.  
- **Impact:** Medium.  
- **Likelihood:** High.  
- **Mitigation:** Queue heavy tasks as background jobs; cache results; parallelise requests; provide user feedback via progress bars.【516335038796236†L54-L67】

### Business Risks

**Risk 1:** **User adoption.** Firms may be hesitant to adopt a new system due to switching costs and trust issues.  
- **Impact:** High.  
- **Mitigation:** Provide easy data migration tools, robust training resources and emphasize the trust & compliance benefits of citation‑first AI.

**Risk 2:** **Regulatory changes.** Evolving privacy or securities regulations might impose new requirements.  
- **Impact:** Medium.  
- **Mitigation:** Design the platform with flexibility to update compliance mechanisms; maintain legal review processes.

### Open Questions
- [ ] **Question 1:** What specific external data providers (e.g. PitchBook, Crunchbase) will be integrated in Discovery?  
  - **Status:** Open  
  - **Decision:** TBD
- [ ] **Question 2:** What metrics will determine AI suggestion confidence thresholds?  
  - **Status:** Open  
  - **Decision:** TBD

---

## 13. Dependencies & Integrations

### Internal Dependencies
- **Packages:**  
  - `@trato-hive/ui`: Shared React component library implementing The Intelligent Hive design system.  
  - `@trato-hive/shared`: Types, enums and validation schemas.  
  - `@trato-hive/db`: Prisma models, migrations and database client.  
  - `@trato-hive/auth`: Authentication and RBAC utilities.  
  - `@trato-hive/semantic-layer`: Verifiable Fact Layer and knowledge graph.  
  - `@trato-hive/ai-core`: Reasoning engine and LLM orchestration.  
  - `@trato-hive/data-plane`: Document ingestion, OCR and storage.  
  - `@trato-hive/agents`: Agent orchestrators for sourcing, pipeline, diligence and generation.

### Other Features
- `features/command-center`: Consumes deals, tasks and facts; produces queries and tasks.  
- `features/discovery`: Provides company search and adds targets to deals.  
- `features/deals`: Central pipeline; interacts with all other modules.  
- `features/diligence`: Provides Q&A and risk summaries for deals.  
- `features/generator`: Consumes facts to produce IC decks and LOIs.

### External Dependencies
- **LLM Providers:** OpenAI GPT‑4 and Anthropic Claude for natural language understanding and generation.  
- **Vector Database:** Pinecone or Weaviate for semantic search and similarity.  
- **Graph Database:** Neo4j or ArangoDB for knowledge graph storage.  
- **Cloud Storage:** AWS S3 or equivalent for documents and generated files.  
- **OCR Service:** Tesseract.js for PDF/image OCR.  
- **Authentication Providers:** OAuth, SAML for enterprise SSO integration.

---

## 14. Rollout Plan

### Phase 1: Alpha (Internal Testing)
- **Timeline:** December 2025 – January 2026.  
- **Scope:** Implement core infrastructure (data ingestion, fact layer), deals module (pipeline and Deal 360°), and basic Command Center dashboard.  
- **Users:** Internal deal team and select friendly firms.  
- **Success Criteria:**  
  - Users can create deals, upload documents and view citations.  
  - Feedback collected on UX and performance.  
  - API endpoints function as documented.

### Phase 2: Beta (Limited Users)
- **Timeline:** February – March 2026.  
- **Scope:** Add Discovery and Diligence modules; refine Command Center; implement generator for IC decks.  
- **Users:** 10–15 beta customers across PE and corporate development.  
- **Success Criteria:**  
  - Natural‑language sourcing returns accurate results.  
  - Diligence Q&A suggestions reduce time to answer by >50 %.  
  - Golden citations successfully trace back to sources during IC meetings.

### Phase 3: General Availability (GA)
- **Timeline:** April 2026 onwards.  
- **Scope:** Full feature set, including LOI/memo generation and advanced analytics; performance optimisations; UI polish.  
- **Users:** All paying customers.  
- **Success Criteria:**  
  - Platform scales to 100+ customers.  
  - >90 % of AI‑generated facts accepted without edits.  
  - Average deal cycle time reduced by 25 % compared to baseline.

### Rollback Plan
- Maintain feature flags for new modules; ability to disable Discovery or Diligence separately.  
- Use blue/green deployment for backend services; revert to previous version if critical issues arise.  
- Regularly back up databases and documents; maintain disaster recovery plans.

---

## 15. Success Metrics & KPIs

### User Adoption Metrics
1. **Active Firms:** Number of firms actively using Trato Hive each month (target: 50 in first year).  
2. **Deal Pipeline Coverage:** Percentage of deals managed in Trato Hive versus external spreadsheets (target: 90 %).

### Performance Metrics
1. **Average API Response Time:** <500 ms p95 for CRUD operations.  
2. **AI Suggestion Latency:** <5 seconds for Q&A and sourcing queries.

### Quality Metrics
1. **Citation Accuracy:** Percentage of citations that correctly link to the source excerpt (target: 99 %).  
2. **Test Coverage:** Code coverage maintained at >80 % across all packages.

### Business Metrics
1. **Time to Close:** Reduction in average deal cycle time compared to baseline (target: 25 % reduction by GA).  
2. **NPS (Net Promoter Score):** Customer satisfaction metric measured quarterly (target: >60).  
3. **Revenue Impact:** Increase in deals sourced and closed via Trato Hive for participating firms (target: +10 % YoY).  
4. **Churn Rate:** Percentage of firms cancelling subscriptions (target: <5 % annually).

---

## 16. Appendix

### Glossary
| Term | Definition |
|------|-----------|
| **TIC (Trato Intelligence Core)** | Reasoning engine using LLMs to process natural language, generate answers and perform citation extraction. |
| **Verifiable Fact Layer** | Data structure storing facts extracted from documents with source references and confidence scores. |
| **Pipeline OS Agent** | AI agent that monitors deals, suggests next steps and updates tasks. |
| **Golden Citation** | Special citation link used in generated materials (e.g. IC decks) that traces every number back to its source document. |
| **VDR (Virtual Data Room)** | Secure repository used to share documents during due diligence. |
| **IC Deck** | Investment Committee presentation deck summarising deal information and recommendations. |

### References
- Trato Hive Product & Design Specification v1.0【564290982268161†L69-L88】【564290982268161†L138-L160】.  
- The Intelligent Hive design system【516335038796236†L8-L17】【861078381458516†L172-L213】.  
- Root CLAUDE.md governance document【749265432599980†L30-L43】.  
- Design principles and style guide【516335038796236†L8-L17】【861078381458516†L172-L213】.

### Revision History
| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2025-11-12 | 0.1 | PRD Agent | Initial draft based on specification and design documents |
