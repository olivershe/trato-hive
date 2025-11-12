# PRD: Deals Module (Module 3)

**Status:** Draft
**Last Updated:** 2025-11-11
**Owner:** Product Management Team
**Priority:** Highest (Core CRM)

---

## 1. Problem Statement

The **Deals module** is the beating heart of Trato Hive’s AI‑native CRM.  In the current market, M&A professionals juggle spreadsheets, generic CRMs and ad‑hoc tools to track their pipeline.  These systems do not understand M&A workflows, they lack verifiable insights and require constant manual entry.  As a result, deal teams lose context switching between discovery, diligence and IC preparation, critical documents are buried, and key metrics such as EBITDA or revenue must be re‑entered every time they change.  Traditional CRMs like DealCloud provide a static pipeline view and basic task tracking, but they neither reason over unstructured documents nor provide auditable data【153210469249428†L84-L99】.

**Current State:**
- Existing CRMs offer Kanban and list views but are essentially glorified spreadsheets.  They do not integrate with a Verifiable Fact Layer, so numbers are often stale and untraceable.
- Deal updates are performed manually; there is no automated extraction of KPIs from CIMs, SPAs or Q&A threads.  Users must guess whether information is up to date or search through email attachments.
- There is no unified view that ties pipeline stages to diligence status, document ingestion or generation workflows—users bounce between multiple systems.
- AI features, if present, are mere overlays; they cannot orchestrate workflows or provide suggested next steps.

Additionally:
- **Relationship intelligence is absent:** emails, meetings and call notes are not automatically captured; there is no unified network graph of contacts or scoring of relationship strength【901997652264231†L82-L87】.
- **Buyer profiling and meeting prep are manual:** deal teams must research external databases and assemble buyer books, strip profiles, sponsor overviews and news runs by hand; CRMs offer no AI assistance for these deliverables【32184628154010†L160-L190】【248476347016084†L74-L176】.

**Desired State:**
- Provide an **Interactive Pipeline OS** that combines drag‑and‑drop Kanban and power‑user list views in a single module【153210469249428†L84-L90】.  Users should seamlessly switch views without losing context.
- Centralise all deal information through a **Deal 360° View** with tabs for Overview, Diligence, Documents and Activity【153210469249428†L90-L105】.  Each tab should pull data from the underlying Verifiable Fact Layer and other modules.
- Surface a **Verifiable Fact Sheet** within the Overview tab showing critical KPIs (EBITDA, revenue, margins) extracted from the latest documents.  Every number must be a Teal Blue hyperlink that opens a citation modal showing the exact snippet from the source document【153210469249428†L94-L99】.
- Leverage the Pipeline OS Agent to present **AI‑suggested next steps** based on deal progress (e.g., “Draft LOI,” “Prepare risk summary”) and tasks aggregated from other modules.
- Expose a REST API so that firms can integrate the Deals module into their existing stack.

To truly modernize the pipeline, the Deals module must go beyond static views and simple KPIs:
- **Integrate relationship intelligence:** automatically log emails, calendar events and meeting notes, enrich contact data and compute relationship strength to highlight warm introductions and map the network of buyers【901997652264231†L82-L87】.
- **Provide AI‑driven buyer profiling and meeting preparation:** generate strip profiles, sponsor overviews, meeting prep briefs and news runs by synthesising internal and external data sources; each deliverable should include source‑linked citations【32184628154010†L160-L190】【248476347016084†L74-L176】.

---

## 2. Goals & Non‑Goals

### Goals (What we **will** deliver)
1. **Interactive pipeline:** Build a responsive Kanban and list view that allows users to drag deals across stages, filter by stage, owner or other attributes, and search by keyword.
2. **Deal 360° view:** Present a tabbed interface with Overview, Diligence, Documents and Activity tabs【153210469249428†L90-L105】.  Include a Verifiable Fact Sheet widget with citation‑first numbers【153210469249428†L94-L99】.
3. **Citation‑first fact sheet:** Extract KPIs from documents stored in the Semantic Layer and display them with Teal Blue hyperlinks; clicking opens a modal with highlighted excerpts in <200 ms【153210469249428†L94-L99】.
4. **AI‑suggested next steps:** Integrate the Pipeline OS Agent to recommend next actions based on deal progress and changes in the Verifiable Fact Layer.
5. **API endpoints:** Provide a secure REST API for listing, creating, updating and deleting deals, retrieving fact sheets, updating stages, and fetching AI suggestions.
6. **Relationship intelligence & buyer research:** Automatically capture communications and build a dynamic network graph that scores relationship strength; use AI to generate buyer profiles, sponsor overviews, meeting prep briefs and news runs with citation‑linked sources【901997652264231†L82-L87】【32184628154010†L160-L190】【248476347016084†L74-L176】.

### Non‑Goals (Out of scope for this version)
1. **Discovery algorithms:** Building the sourcing/market‑map algorithms (handled in the Discovery module) is not part of the Deals module.
2. **Full diligence functionality:** The Diligence Room is accessed via the Diligence tab but its ingestion, Q&A, risk summaries and governance are specified in the Diligence module PRD.
3. **Document editing:** Editing documents directly is out of scope; documents are viewed via the Documents tab and processed via the Semantic Layer.
4. **Generative document creation:** Generation of IC decks, LOIs and memos is handled by the Generator module.

---

## 3. User Stories

### Primary User Personas
- **M&A Associate (Pipeline Owner):** Responsible for managing a portfolio of deals from sourcing to closing. Needs a real‑time view of where each deal sits, the latest numbers, and tasks to progress the deal.
- **Diligence Analyst:** Works on document ingestion, Q&A and risk analysis.  Needs to access the Diligence tab within a deal to upload documents and answer questions.
- **Investment Committee Member:** Participates in IC meetings.  Needs a concise, verifiable snapshot of a deal—including key metrics and recent activity—to make go/no‑go decisions.

### User Stories (Format: As a [user], I want to [action], so that [benefit])

**Epic 1: Pipeline Management**
- *As an M&A Associate, I want to drag a deal card from “Screening” to “Diligence,” so that the system updates the stage and triggers downstream tasks.*
- *As an M&A Associate, I want to toggle between a Kanban board and a list view, so that I can choose the representation that best suits my workflow.*
- *As an M&A Associate, I want to filter the pipeline by stage or owner, so that I can focus on deals relevant to me.*

**Epic 2: Deal 360° & Verifiable Facts**
- *As an M&A Associate, I want to open a deal and view an Overview tab with KPIs and next steps, so that I have a single source of truth for decision‑making.*
- *As an IC Member, I want to click on an EBITDA number and see the original document snippet in a modal, so that I can trust the figure and cite it during meetings【153210469249428†L94-L99】.*
- *As a Diligence Analyst, I want to see high‑level VDR status and open Q&A items in the Diligence tab, so that I can prioritise my work.*

**Epic 3: AI‑Suggested Next Steps**
- *As an M&A Associate, I want the system to suggest my next tasks (e.g., “Request updated financials,” “Generate IC deck”), so that I don’t miss critical actions.*
- *As a Pipeline Owner, I want to dismiss or accept AI suggestions, so that I retain control over my workflow.*

**Epic 4: Relationship Intelligence & Buyer Profiling**
- *As an M&A Associate, I want the system to automatically log my emails and meetings with potential buyers and update relationship strength scores, so that my buyer book stays current without manual data entry【901997652264231†L82-L87】.*
- *As an M&A Associate, I want AI to generate buyer profiles and meeting prep documents (strip profiles, sponsor overviews, news runs), so that I can prepare for calls quickly and confidently【32184628154010†L160-L190】【248476347016084†L74-L176】.*
- *As a Pipeline Owner, I want to receive alerts when relevant news or filings about my targets are published, so that I can stay informed and adjust our strategy accordingly.*

---

## 4. User Experience (UX Flow)

### Entry Point
Users access the Deals module by clicking the **“Deals”** tab in the top navigation bar.  The active nav item is underlined in Gold【596832289700623†L110-L113】.  The page loads a Kanban board by default with skeleton loaders for each column to indicate loading.

### Main User Flow (Step‑by‑Step)

1. **User Action:** User views the Kanban board.  Each column represents a `PipelineStage` and contains draggable deal cards styled with Soft Sand backgrounds and a Gold accent line at the top【596832289700623†L96-L102】.
   - **System Response:** The system fetches a paginated list of deals from the API (`GET /api/v1/deals`) filtered by firm and user permissions.  Skeleton cards appear while loading.
   - **UI State:** Columns are labelled in Charcoal Black; cards show deal name, stage, owners and key metrics.

2. **User Action:** User drags a deal card from one column to another.
   - **System Response:** The frontend immediately updates the UI (optimistic UI), sends a `PATCH /api/v1/deals/:id/stage` request, and persists the new stage.  The Pipeline OS Agent listens for the change and may generate AI tasks.
   - **UI State:** The card animates to its new column; a small toast appears confirming the move.

3. **User Action:** User toggles to list view by clicking a “List” button.
   - **System Response:** The UI switches to a dense, table‑like view with sortable columns and row virtualization for performance.
   - **UI State:** Each row shows deal properties; filters and search bar persist.

4. **User Action:** User clicks on a deal (e.g., “Project Sky”).
   - **System Response:** The Deal 360° view loads, fetching deal details, fact sheet, and AI suggestions.  Data for the Diligence, Documents and Activity tabs are loaded lazily.
   - **UI State:** The page shows tabs styled as per the style guide【596832289700623†L114-L117】.  The Overview tab displays key information and the Verifiable Fact Sheet.

5. **User Action:** In the Overview tab, the user clicks on a KPI in the Verifiable Fact Sheet (e.g., EBITDA in Teal Blue).
   - **System Response:** A citation modal overlays the page, retrieving the relevant excerpt from the Semantic Layer.  The modal shows the source document name, page number and highlighted text.【596832289700623†L103-L109】
   - **UI State:** The modal has a white background with a 12 px radius (radius‑lg), a Gold border, and loads in <200 ms【596832289700623†L103-L109】.

6. **User Action:** User reviews AI‑suggested next steps within the Overview tab.
   - **System Response:** Suggestions are fetched from `/api/v1/deals/:id/next‑steps`.  Accepting a suggestion generates a task; dismissing archives it.
   - **UI State:** Suggestions appear in a list with checkboxes; accepted items are marked complete.

### Exit Points
- Users can navigate to the **Diligence** tab to launch the full Diligence Room (Module 4) or to the **Generator** tab to generate IC decks or LOI drafts (Module 5).  They may also return to the pipeline via the browser’s back button or the navigation bar.
- In list view, users can export deal lists to CSV via the API.

### Edge Cases
- **Network failure:** If a drag‑and‑drop API call fails, the UI rolls back the card to its original position and displays an error toast.
- **Concurrent edits:** If multiple users move a deal simultaneously, optimistic updates may conflict.  The backend resolves via last‑write‑wins with audit logging; the frontend refreshes on conflict.
- **Access control:** Users without permission to update a deal’s stage see the card greyed out and cannot drag it.  API returns 403 on unauthorized updates.
- **Empty state:** If no deals exist, an empty state card encourages users to create their first deal with a Gold CTA button.

---

## 5. Features & Requirements

### Feature 1: Interactive Pipeline View

**Description:**
The pipeline view provides a visual representation of all deals across stages.  Users can drag cards between columns, search, filter and toggle between Kanban and List modes【153210469249428†L84-L90】.

**Functional Requirements:**
1. **List & paginate deals:** Retrieve deals for the current firm and user via `GET /api/v1/deals` with query params for stage, owner, search string and pagination (page, limit).
2. **Toggle view:** Provide UI controls to switch between Kanban (cards) and List (table) views; persist user preference.
3. **Drag‑and‑drop:** Enable dragging a deal card to change its stage; update via `PATCH /api/v1/deals/:id/stage`.
4. **Create/edit/delete deals:** Provide forms using UI components to create (`POST /api/v1/deals`), edit (`PATCH /api/v1/deals/:id`), and delete deals (`DELETE /api/v1/deals/:id`).  Display confirm dialogs for destructive actions.
5. **Search & filter:** Implement search bar and filters (stage, owner, keyword).  Update results without full page reloads (AJAX).

**Non‑Functional Requirements:**
- **Performance:** Pipeline view must load within 2 seconds (p95); drag operations must update the server within 500 ms.
- **Scalability:** Support at least 500 deals per firm with smooth virtualization in list view.
- **Security:** Only authenticated users with roles Admin, Manager or Analyst can create/update deals; Viewers have read‑only access.
- **Accessibility:** All drag actions must be accessible via keyboard (arrow keys + Enter); list view should support screen readers.

**UI/UX Requirements:**
- **Deal cards:** Soft Sand background with a Gold accent line at the top and 8 px border radius【596832289700623†L96-L102】.  Cards display deal name, stage, owner avatars and key metrics.
- **Stage columns:** Charcoal Black headers; columns separated by Soft Sand Dark borders【596832289700623†L96-L104】.
- **List view:** Table rows with alternating Soft Sand and White backgrounds; sortable column headers; sticky first column.
- **Buttons:** Use Gold for primary actions (e.g., “Create Deal”) and outline for secondary actions as per the style guide【596832289700623†L96-L113】.

**Dependencies:**
- **Packages:** `@trato-hive/database` (Prisma models for Deal and Stage), `@trato-hive/ui` (Card, Button, Table, DragAndDrop components), `@trato-hive/auth` (role‑based auth), `@trato-hive/agent-pipeline-os` (handles next steps).
- **Other Features:** Relies on Discovery module to add companies to pipeline; interacts with the Diligence and Generator modules via tabs.
- **External Services:** None beyond internal microservices; uses internal API Gateway.

### Feature 2: Deal 360° View & Verifiable Fact Sheet

**Description:**
The Deal 360° view is a tabbed interface acting as the single source of truth for a deal.  It consolidates key information, diligence progress, document management and activity logs.  A Verifiable Fact Sheet widget surfaces critical KPIs extracted from ingested documents; each number is a Teal Blue hyperlink that opens a citation modal【153210469249428†L94-L99】.

**Functional Requirements:**
1. **Tab navigation:** Provide tabs for Overview (default), Diligence, Documents and Activity【153210469249428†L90-L105】.  Load each tab’s data lazily when selected.
2. **Fact extraction:** On entering the Overview tab, call `/api/v1/deals/:id/fact-sheet` to retrieve facts (metric, value, unit, citation).  Display them in a card with Gold border.
3. **Citation modal:** When a user clicks a KPI, call `/api/v1/deals/:id/fact-sheet?factId={factId}` to fetch the source excerpt and display it in a modal.  The modal must follow the style guide (12 px radius, 600 px max width, soft overlay, close on Esc)【596832289700623†L103-L109】.
4. **Next steps widget:** Display AI suggestions from `/api/v1/deals/:id/next-steps`.  Users can accept (create a task) or dismiss each suggestion.
5. **Action buttons:** Provide actions to edit the deal, move stage, generate IC deck (link to Generator module) and open full diligence.

**Non‑Functional Requirements:**
- **Performance:** Fact sheet must load in <500 ms (p95); citation modal must open in <200 ms【596832289700623†L103-L109】.
- **Scalability:** Support up to 50 facts per deal; handle frequent updates as new documents are ingested.
- **Security:** Only authorized users may view sensitive metrics (role‑based checks); citation data should never expose entire documents—only relevant excerpts.
- **Accessibility:** Modals must be keyboard navigable with focus trapping and screen reader labels.

**UI/UX Requirements:**
- **Verifiable Fact Sheet card:** White background with 2 px Gold border and 12 px radius【596832289700623†L103-L104】.  Facts listed in two columns with metric name (Charcoal Black) and value (Teal Blue hyperlink with underline)【596832289700623†L103-L107】.
- **Citation link styling:** Teal Blue colour (#2F7E8A), underline on hover, pointer cursor【596832289700623†L103-L107】.
- **Citation modal:** White panel with 32 px padding, radius‑lg, shadow‑xl and dark overlay【596832289700623†L103-L109】.  Show document name, page number and highlighted excerpt.
- **Tab navigation:** Use the Tab component from `@trato-hive/ui`; inactive tabs are Charcoal Lighter; active tab is Teal Blue with an underline【596832289700623†L114-L117】.

**Dependencies:**
- **Packages:** `@trato-hive/semantic-layer` (fact retrieval), `@trato-hive/ui` (Tabs, Cards, Modal, Citation components), `@trato-hive/agent-pipeline-os` (next steps), `@trato-hive/agents` for citation resolution.
- **Other Features:** Uses Diligence module for ingestion and Q&A; uses Generator module for deck creation.
- **External Services:** None; all calls via internal GraphQL/REST API.

### Feature 3: AI‑Suggested Next Steps

**Description:**
The Pipeline OS Agent monitors changes in the Verifiable Fact Layer, documents, and user interactions to generate contextual next steps (e.g., “Schedule management meeting,” “Upload SPA,” “Generate LOI draft”).  Suggestions are displayed in the Deal 360° Overview tab.

**Functional Requirements:**
1. **Monitor data:** The agent listens to changes in deals, documents, facts and tasks.  When triggers occur (e.g., new document ingested, stage change), it runs reasoning prompts to generate suggestions.
2. **Retrieve suggestions:** API endpoint `GET /api/v1/deals/:id/next-steps` returns a list of suggestions with id, description, confidence and recommended action.
3. **Accept/dismiss:** Users can click “Accept” to convert a suggestion into a task (creating a task entity in the Task service) or “Dismiss” to remove it.  Use `POST /api/v1/deals/:id/next-steps/:suggestionId/accept` and `DELETE /api/v1/deals/:id/next-steps/:suggestionId`.
4. **Audit logging:** Each acceptance or dismissal must be logged in the Trust & Audit Log.

**Non‑Functional Requirements:**
- **Performance:** Generating suggestions should run asynchronously; retrieving suggestions must return within 500 ms.
- **Security:** Only users with Manager or Analyst roles may accept suggestions; suggestions should not expose sensitive data.
- **Reliability:** Suggestions should be accurate and contextually relevant; include confidence scores.

**UI/UX Requirements:**
- List suggestions in a card with Soft Sand background; each suggestion has a checkbox or action buttons (“Accept,” “Dismiss”).
- Use Teal Blue icons for AI recommendations and Gold accent for primary buttons.

**Dependencies:**
- **Packages:** `@trato-hive/agent-pipeline-os`, `@trato-hive/task-service`, `@trato-hive/ui`.
- **Other Features:** Integration with tasks service for accepted suggestions; may call Generator module for document generation.
- **External Services:** None.

---

### Feature 4: Relationship Intelligence & Buyer Research

**Description:**
Provide automated relationship intelligence and buyer research tools integrated into the Deals module. The system will capture interactions (emails, meetings, call notes) and build a network graph scoring relationship strength. It will also generate buyer profiles, sponsor overviews, meeting prep briefs and news runs using AI, with citations to original sources【901997652264231†L82-L87】【32184628154010†L160-L190】【248476347016084†L74-L176】.

**Functional Requirements:**
1. **Interaction capture:** Automatically log all emails, calendar events and call notes associated with a deal; attribute interactions to contacts and compute relationship strength scores.  
2. **Network graph:** Visualize the network of buyers, intermediaries and internal stakeholders with edge weights representing relationship strength; allow filtering by sector, geography or stage.  
3. **Profile generation:** Provide API endpoints to generate buyer profiles, sponsor overviews, meeting prep briefs and news runs by querying internal facts and external data sources; each generated document must include citation metadata to its sources.  
4. **Alerts & notifications:** Notify pipeline owners when notable events occur (e.g., new filings, news articles or earnings reports) related to targets.  
5. **Integration with pipeline:** Surface relationship scores and profile summaries on deal cards and within the Deal 360° view.

**Non‑Functional Requirements:**
- **Performance:** Interaction logging should occur in real time without noticeable latency; profile generation must complete within 10 seconds.  
- **Security:** Respect privacy laws by obtaining user consent for email/calendar integration; restrict access to relationship data based on roles; encrypt sensitive communications.  
- **Scalability:** Support thousands of interactions per deal and hundreds of contacts; network graph rendering must remain performant.  
- **Data Quality:** Ensure deduplication of contacts and prevent erroneous relationship links.

**UI/UX Requirements:**
- **Network graph visualization:** Use an interactive chart (e.g., force‑directed graph) with nodes colored by contact type and edges weighted by relationship strength; allow tooltips and click‑through to contact details.  
- **Profile cards:** Present generated buyer profiles in Soft Sand cards with Gold headings and Teal Blue citation icons; provide action buttons to export or attach to the deal.  
- **Alerts:** Display news and filing alerts in the activity feed with Teal Blue icons and a link to open the full article.  
- **Accessibility:** Network graph must be navigable via keyboard and provide alt text; ensure high contrast for all UI elements.

**Dependencies:**
- **Packages:** `@trato-hive/relationship-intelligence` (new service to capture and analyze interactions), `@trato-hive/ai-core` (generation of profiles), `@trato-hive/ui` (graph and card components), `@trato-hive/semantic-layer` (facts for citations).  
- **Other Features:** Utilizes Discovery for external data ingestion; integrates with Command Center to display alerts and tasks; interacts with Generator for exporting profiles into IC decks.  
- **External Services:** May connect to email and calendar providers (Microsoft 365, Google Workspace); uses news APIs and third‑party financial datasets (PitchBook, CapIQ).

---

## 6. Data Model & Architecture

### Data Entities

```typescript
// Main Deal entity
interface Deal {
  id: string
  firmId: string
  name: string
  stage: PipelineStage
  description?: string
  ownerId: string
  startDate: Date
  endDate?: Date
  createdAt: Date
  updatedAt: Date
}

// Enum for pipeline stages
enum PipelineStage {
  sourcing = 'sourcing',
  screening = 'screening',
  diligence = 'diligence',
  ic_prep = 'ic_prep',
  closing = 'closing',
  portfolio = 'portfolio'
}

// Fact representing a verifiable metric on a deal
interface Fact {
  id: string
  dealId: string
  metric: string      // e.g., 'EBITDA', 'Revenue'
  value: number
  unit: string        // e.g., 'USD', '%'
  citation: Citation
  extractedAt: Date
}

// Citation linking a fact to its source document
interface Citation {
  factId: string
  sourceId: string     // Document ID
  pageNumber: number
  excerpt: string
  confidence: number   // 0–1 confidence score
  timestamp: Date
}

// AI suggestion for next steps
interface Suggestion {
  id: string
  dealId: string
  description: string
  confidence: number
  createdAt: Date
}
```

### Architecture Layers

**7‑Layer Architecture Integration:**

- **Layer 1 (Data Plane):** Deals, documents and tasks are stored in the database.  When a new document (e.g., CIM) is ingested, it is associated with a deal via the Data Plane.
- **Layer 2 (Semantic Layer):** Documents are processed and facts are extracted into the Verifiable Fact Layer.  Facts are linked to deals and used by the Fact Sheet widget.
- **Layer 3 (TIC):** The Trato Intelligence Core performs reasoning tasks: extracting KPIs from documents and generating suggestions via prompts.
- **Layer 4 (Agentic Layer):** The **Pipeline OS Agent** orchestrates workflows: listens for stage changes, document ingestion and fact updates, then triggers suggestion generation and tasks.
- **Layer 5 (Experience Layer):** The Deals module provides UI components (Kanban board, list view, Deal 360°) and interacts with underlying services via API calls.
- **Layer 6 (Governance Layer):** All stage changes, fact retrievals and suggestion acceptances are logged in the Trust & Audit Log.  Role‑based access control ensures only authorized users can modify data.
- **Layer 7 (API Layer):** REST endpoints expose deal operations.  Other modules and external systems can call these endpoints to integrate with the pipeline.

### Data Ownership
- **Owns:** Deal entity and pipeline stage transitions.
- **Reads:** Facts (for fact sheet), documents (for file explorer), tasks and suggestions.
- **Writes:** Deal records, stage updates, suggestion acceptance/dismissal events.

---

## 7. API Specification

### Endpoint 1: `GET /api/v1/deals`

**Description:** List deals for the current firm with optional filters (stage, owner, search) and pagination.

**Authentication:** Required (JWT)

**Authorization:** Roles allowed: Admin, Manager, Analyst, Viewer (read‑only).  Row‑level security restricts results to the user’s firm.

**Request:**
```typescript
// Query params
stage?: PipelineStage  // optional filter by stage
ownerId?: string       // filter by owner
search?: string        // search by name
page?: number = 1
limit?: number = 25
```

**Response (Success):**
```typescript
// Status: 200
{
  data: Deal[],
  meta: {
    page: number,
    limit: number,
    total: number
  }
}
```

**Response (Error):**
```typescript
// Status: 401 | 403 | 500
{
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

**Validation:**
- `page` and `limit` must be positive integers (Zod schema).
- `stage` must be a valid `PipelineStage` if provided.

**Rate Limiting:** 60 requests/minute per user.

---

### Endpoint 2: `GET /api/v1/deals/:id`

**Description:** Retrieve a single deal by its ID.

**Authentication:** Required

**Authorization:** Admin, Manager, Analyst, Viewer (read only).  Must belong to same firm.

**Request:**
```typescript
// Path param
id: string
```

**Response (Success):**
```typescript
// Status: 200
{
  data: Deal
}
```

**Response (Error):**
```typescript
// Status: 404 | 403 | 500
{
  error: {
    code: string,
    message: string
  }
}
```

**Rate Limiting:** 120 requests/minute per user.

---

### Endpoint 3: `POST /api/v1/deals`

**Description:** Create a new deal.

**Authentication:** Required

**Authorization:** Admin, Manager, Analyst

**Request:**
```typescript
// Body
{
  name: string,
  stage: PipelineStage,
  description?: string,
  ownerId: string,
  startDate: Date,
  endDate?: Date
}
```

**Response (Success):**
```typescript
// Status: 201
{
  data: Deal
}
```

**Validation:**
- `name`, `stage`, `ownerId`, and `startDate` are required.
- `stage` must be a valid `PipelineStage`.

**Rate Limiting:** 30 requests/minute per user.

---

### Endpoint 4: `PATCH /api/v1/deals/:id`

**Description:** Update an existing deal’s fields (name, description, owner, dates).  Stage updates are handled separately.

**Authentication:** Required

**Authorization:** Admin, Manager, Analyst (if they own the deal) 

**Request:**
```typescript
// Path param
id: string

// Body (partial)
{
  name?: string,
  description?: string,
  ownerId?: string,
  startDate?: Date,
  endDate?: Date
}
```

**Response (Success):**
```typescript
// Status: 200
{
  data: Deal
}
```

**Validation:** At least one field must be provided.

**Rate Limiting:** 30 requests/minute per user.

---

### Endpoint 5: `DELETE /api/v1/deals/:id`

**Description:** Delete a deal and cascade delete associated tasks and suggestions (soft delete; documents and facts remain but are disassociated).

**Authentication:** Required

**Authorization:** Admin, Manager

**Response (Success):**
```typescript
// Status: 204
{}
```

**Response (Error):**
```typescript
// Status: 404 | 403 | 500
{
  error: {
    code: string,
    message: string
  }
}
```

**Rate Limiting:** 10 requests/minute per user.

---

### Endpoint 6: `PATCH /api/v1/deals/:id/stage`

**Description:** Update a deal’s pipeline stage (used by drag‑and‑drop in the Kanban board).  Creates an audit log entry and triggers the Pipeline OS Agent.

**Authentication:** Required

**Authorization:** Admin, Manager, Analyst (if they own the deal)

**Request:**
```typescript
// Path param
id: string

// Body
{
  stage: PipelineStage
}
```

**Response (Success):**
```typescript
// Status: 200
{
  data: Deal
}
```

**Validation:** `stage` must be a valid `PipelineStage` and different from the current stage.

**Rate Limiting:** 30 requests/minute per user.

---

### Endpoint 7: `GET /api/v1/deals/:id/fact-sheet`

**Description:** Retrieve the Verifiable Fact Sheet for a deal.  Returns a list of facts with citations.

**Authentication:** Required

**Authorization:** Admin, Manager, Analyst, Viewer (read only)

**Request:**
```typescript
// Path param
id: string
// Optional query param
factId?: string  // if provided, fetch a single fact’s citation details
```

**Response (Success):**
```typescript
// Status: 200
{
  data: Fact[] | Fact
}
```

**Rate Limiting:** 60 requests/minute per user.

---

### Endpoint 8: `GET /api/v1/deals/:id/next-steps`

**Description:** Retrieve AI‑suggested next steps for a deal.

**Authentication:** Required

**Authorization:** Admin, Manager, Analyst (read and accept/dismiss), Viewer (read only)

**Response (Success):**
```typescript
// Status: 200
{
  data: Suggestion[]
}
```

**Rate Limiting:** 30 requests/minute per user.

---

## 8. Testing & Acceptance Criteria

### Unit Testing Requirements
- [ ] Deal service functions have unit tests covering creation, update, deletion, stage change and fact retrieval (>80 % coverage).
- [ ] Fact extraction logic tested with mocked Semantic Layer responses.
- [ ] Permission checks tested to prevent unauthorized access.

### Integration Testing Requirements
- [ ] API endpoints tested end‑to‑end with database (using test containers) for listing, creating, updating, deleting and stage updates.
- [ ] Fact sheet retrieval tested with sample documents and citations.
- [ ] Suggestion acceptance/dismissal tested including task creation and audit logging.

### E2E Testing Requirements (User Flows)
- [ ] **Pipeline flow:** Drag a deal from screening to diligence and verify stage update and suggestion creation.
- [ ] **Deal view flow:** Open a deal, check the fact sheet, click a citation, verify modal loads with correct excerpt.
- [ ] **Suggestion flow:** Accept and dismiss AI suggestions, confirm tasks created or removed.

### Acceptance Criteria (Checklist)

**Functional:**
- [ ] Users can list, create, update and delete deals via API and UI.
- [ ] Drag‑and‑drop updates stage with optimistic UI and persists correctly.
- [ ] Deal 360° view loads with Overview, Diligence, Documents and Activity tabs.
- [ ] Verifiable Fact Sheet displays KPIs with Teal Blue hyperlinks and citation modal【153210469249428†L94-L99】.
- [ ] AI‑suggested next steps appear and can be accepted or dismissed.

**Non‑Functional:**
- [ ] Pipeline view loads in <2 seconds (p95); fact sheet loads in <500 ms; citation modal opens in <200 ms【596832289700623†L103-L109】.
- [ ] Role‑based access control enforced; unauthorized actions return 403.
- [ ] WCAG 2.1 AA compliance for colours and contrast (Teal Blue links and Gold buttons meet contrast guidelines【596832289700623†L30-L33】).
- [ ] Test coverage >80 %; API endpoints integrated into CI pipeline.

**Design:**
- [ ] The Intelligent Hive design system followed: Soft Sand backgrounds, Gold accents, Charcoal Black headers, Teal Blue links and citations【596832289700623†L96-L104】.
- [ ] Cards and modals use 8–12 px border radius; citations styled as per style guide【596832289700623†L103-L109】.
- [ ] Tabs and buttons follow the specified typography and spacing【596832289700623†L96-L117】.
- [ ] Citation modal matches design specification (600 px max width, radius‑lg, shadow‑xl)【596832289700623†L103-L109】.

**Documentation:**
- [ ] API documentation updated with request/response examples.
- [ ] Component documentation in Storybook for Deal Card, Fact Sheet and Citation Modal.
- [ ] README references this PRD; CHANGELOG updated for new endpoints.

---

## 9. Design Specifications

### The Intelligent Hive Integration

**Color Usage:**
- **Soft Sand (#F5EFE7):** Column backgrounds in the Kanban board and alternating row backgrounds in list view【596832289700623†L96-L104】.
- **Gold/Honey (#E2A74A):** Accent line at the top of deal cards and border of the Verifiable Fact Sheet; primary buttons and active nav underline【596832289700623†L96-L104】.
- **Charcoal Black (#1A1A1A):** Stage column headers, primary text and card titles【596832289700623†L96-L104】.
- **Teal Blue (#2F7E8A):** All KPI values and citation links; active tabs; AI suggestions icons【596832289700623†L103-L107】.

**Typography:**
- Headings use **Lora** (serif) for card titles and stage headers; body text and labels use **Inter** (sans) as defined in the style guide【596832289700623†L35-L47】.
- Button text uses Inter 16 px Medium weight; labels 14 px; card body 16 px regular.【596832289700623†L45-L50】

**Components:**
- Use `Card` and `KanbanCard` components from `@trato-hive/ui` for pipeline cards.
- Use `TabGroup` for the tabbed interface in Deal 360°.
- Use `Modal` and `Citation` components for the citation modal.
- Use `Button` components following Gold (primary) and outline styles【596832289700623†L96-L113】.

**Citation‑First Principle:**
- All fact values in the Verifiable Fact Sheet appear in Teal Blue with an underline; each has an attached `Citation` object with sourceId, pageNumber and excerpt【596832289700623†L103-L107】.
- Clicking a value opens a citation modal following the modal specs (white background, radius‑lg, max width 600 px, overlay)【596832289700623†L103-L109】.
- `[cite]` notation should be used for AI‑generated content awaiting human approval.

**Wireframes / Mockups:**
- High‑fidelity Figma mockups are stored in the design repository (see Appendix).  The pipeline board shows hexagonal patterns in the background to subtly reference “hive” while remaining professional.  The Fact Sheet widget uses Gold borders and a two‑column layout.  Activity feed and Documents tab align with the style guide spacing and components.

---

## 10. Security & Compliance

### Authentication & Authorization
- **Authentication Required:** Yes; all endpoints require a valid JWT issued via the auth service.
- **Roles Allowed:** Admin, Manager, Analyst for create/update/delete operations; Viewer for read only.  Permissions checked in API middleware.
- **Row‑Level Security:** All queries scoped by `firmId`.  Users cannot access or modify deals outside their firm.

### Data Privacy
- **PII Handling:** Deals may include personal names of counterparties; store only necessary fields.  Do not store sensitive PII in fact values; documents containing PII should be redacted when exposed via the citation modal.
- **GDPR Compliance:** Provide endpoints to export or delete deal data upon request.  Right to erasure applies to tasks and suggestions but not to audit logs.
- **Encryption:** Data encrypted at rest with AES‑256; in transit via TLS 1.3【153210469249428†L155-L160】.

### Audit Logging
**Events to Log:**
- Deal created, updated, deleted
- Stage changes (drag‑and‑drop)
- Fact sheet retrievals and citation views
- Suggestion acceptance/dismissal

**Log Format:**
```typescript
{
  timestamp: ISO8601,
  userId: string,
  action: string,
  resourceId: string,
  metadata: object
}
```

### Security Considerations
- Validate all inputs with Zod to prevent injection attacks.
- Use prepared statements in database layer to mitigate SQL injection.
- Escape output in UI to prevent XSS.
- Apply rate limiting per endpoint; return 429 on excessive usage.
- Ensure drag‑and‑drop actions cannot be invoked by unauthenticated requests (CSRF protection using SameSite cookies and CSRF tokens).

---

## 11. Performance Requirements

### Response Times
- **Page Load:** Pipeline view: <2 s (p95).  Deal 360° view: <1.5 s for initial tab, lazy load subsequent tabs.
- **API Calls:** `GET /deals`: <400 ms (p95); `GET /deals/:id/fact-sheet`: <500 ms; `PATCH /deals/:id/stage`: <200 ms.
- **AI Operations:** Suggestion generation may take up to 5 s but runs asynchronously; UI should show a loader while updating.

### Scalability
- Support up to 10 concurrent users per firm, 500 deals, and 10,000 facts without performance degradation.
- Use database indexing on `firmId`, `stage`, `ownerId` for efficient queries.
- Implement pagination and virtualization for lists.

### Optimization Strategies
- **Caching:** Cache fact sheets per deal with TTL (e.g., 5 minutes) to reduce repeated queries.
- **Database indexing:** Add composite indexes on `(firmId, stage)` and `(dealId, metric)`.
- **Lazy loading:** Load Diligence, Documents and Activity tabs only when requested.
- **Code splitting:** Split frontend code into chunks; load Kanban and Deal 360° components separately.

---

## 12. Risks & Mitigations

### Technical Risks

**Risk 1: Drag‑and‑drop conflicts**
- **Impact:** Medium; concurrency may lead to overwriting stage changes.
- **Likelihood:** Medium.
- **Mitigation:** Implement optimistic UI with real‑time server validation; include ETags in responses to detect stale updates; notify users of conflicts and refresh the board.

**Risk 2: Fact extraction inaccuracies**
- **Impact:** High; incorrect KPIs undermine trust.
- **Likelihood:** Low–Medium (depends on OCR quality and extraction algorithms).
- **Mitigation:** Use high‑accuracy OCR; incorporate human review workflow for critical facts; display confidence scores; allow manual override with audit trail.

**Risk 3: Performance degradation with large datasets**
- **Impact:** Medium.
- **Likelihood:** Medium as deal portfolios grow.
- **Mitigation:** Implement pagination, virtualization, caching and efficient indexing; monitor performance metrics and scale infrastructure horizontally.

### Business Risks

**Risk 1: User adoption**
- **Impact:** High; if the pipeline view feels unfamiliar or slow, users may revert to legacy tools.
- **Mitigation:** Provide training materials, in‑app onboarding and gather user feedback in early beta; iterate on UX.

**Risk 2: AI suggestion trust**
- **Impact:** Medium; inaccurate suggestions could erode confidence.
- **Mitigation:** Show confidence scores; allow users to view rationale or underlying facts; ensure suggestions are advisory rather than prescriptive.

### Open Questions
- [ ] **How should we handle multi‑party deals with different permission levels?**
  - **Status:** Open
  - **Decision:** Need to define whether each party can see all facts or only those they uploaded.

- [ ] **Should users be able to manually add metrics to the fact sheet?**
  - **Status:** Open
  - **Decision:** TBD; likely yes with audit logging.

---

## 13. Dependencies & Integrations

### Internal Dependencies
- **Packages:**
  - `@trato-hive/database`: Defines `Deal` and `PipelineStage` entities and provides Prisma client.
  - `@trato-hive/ui`: Provides Card, Tab, Modal, Button, Table and Drag‑and‑Drop components adhering to the design system.
  - `@trato-hive/semantic-layer`: Extracts facts from documents and returns citations.
  - `@trato-hive/agent-pipeline-os`: Generates AI suggestions based on triggers.
  - `@trato-hive/task-service`: Manages tasks created from accepted suggestions.
- **Other Features:** The Discovery module adds companies to the pipeline; Diligence module ingests documents and Q&A; Generator module creates IC decks and LOIs.

### External Dependencies
- **APIs/Services:** None beyond internal microservices; however, if firms integrate external CRMs, the API may be consumed by third‑party systems.
- **Third‑Party Libraries:** Utilize React DnD for drag‑and‑drop interactions; PrismJS or similar for code highlight in citation modal if needed.

---

## 14. Rollout Plan

### Phase 1: Alpha (Internal Testing)
- **Timeline:** 4 weeks
- **Scope:** Implement Kanban view, stage updates, basic Deal 360° view with fact sheet (without AI suggestions).  Test with internal team and collect feedback.
- **Users:** Trato internal team (Product, Engineering, Design).
- **Success Criteria:** Users can create deals, move them between stages and view fact sheets without errors.  Page load <2 s.

### Phase 2: Beta (Limited Users)
- **Timeline:** 6 weeks
- **Scope:** Add list view, Diligence/Documents/Activity tabs, AI suggestions and citation modal.  Invite select pilot customers.
- **Users:** 3–5 pilot PE/VC firms.
- **Success Criteria:** 80 % of pilot users move their pipeline management to Trato Hive; <5 critical bugs reported.

### Phase 3: General Availability
- **Timeline:** 8 weeks after Beta
- **Scope:** Polish UI, optimize performance, finalize API documentation, implement multi‑party permissions.  Launch to all customers.
- **Users:** All paying customers.
- **Success Criteria:** Average daily active users per firm increases by 30 %; at least 75 % of deals managed through the platform.

### Rollback Plan
- Maintain feature flags for AI suggestions and citation modal.  If issues arise, disable features and revert to pipeline and basic Deal 360° view.  Ensure data backups for deals and facts.

---

## 15. Success Metrics & KPIs

### User Adoption Metrics
- **Pipeline adoption rate:** Percentage of active deals managed through Trato Hive vs. legacy systems.  Target: >75 % by GA.
- **Deal creation frequency:** Average number of deals created per user per month.  Target: 2× increase post‑launch.

### Performance Metrics
- **Average page load time:** Pipeline <2 s; Deal view <1.5 s.
- **API latency (p95):** List deals <400 ms; fact sheet retrieval <500 ms; stage update <200 ms.

### Quality Metrics
- **Bug rate:** <1 critical bug per 1000 user sessions during Beta.
- **Test coverage:** >80 % unit/integration tests.
- **Accessibility:** 100 % of tested flows pass WCAG 2.1 AA compliance.

### Business Metrics
- **Deal velocity:** Average time from sourcing to closing.  Aim to reduce by 20 % due to AI suggestions and unified workflow.
- **User satisfaction (NPS):** Target NPS ≥ 50 by end of Beta.

---

## 16. Appendix

### Glossary
- **Deal 360° View:** Central hub page for a single deal containing Overview, Diligence, Documents and Activity tabs.
- **Verifiable Fact Sheet:** Widget showing key metrics extracted from documents with citations.
- **Pipeline OS Agent:** Internal AI agent that monitors pipeline events and generates next steps.
- **Semantic Layer:** Component of the 7‑Layer architecture that stores extracted facts and knowledge graphs.

### References
- Product & Design Specification — Module 3: Deals【153210469249428†L84-L105】
- The Intelligent Hive Style Guide — Cards & Citations【596832289700623†L96-L109】
- Design Principles — Citation First【772184562064940†L8-L16】

### Revision History
| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2025‑11‑11 | 0.1 | Product Team | Initial draft |

---

**End of PRD**