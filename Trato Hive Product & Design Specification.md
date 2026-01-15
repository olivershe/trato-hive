# Trato Hive: AI-Native M&A CRM
## Product & Design Specification (v2.0)

**Version:** 2.0
**Last Updated:** January 15, 2026
**Status:** Phase 11 - UI/UX Architecture Restructure

---

## Table of Contents

1. [Core Principles](#1-core-principles)
2. [Design System: The Intelligent Hive](#2-design-system-the-intelligent-hive)
3. [Information Architecture](#3-information-architecture)
4. [Navigation System](#4-navigation-system)
5. [Page Templates](#5-page-templates)
6. [Block Reference](#6-block-reference)
7. [Module Specifications](#7-module-specifications)
8. [Data Flow & AI Integration](#8-data-flow--ai-integration)
9. [API, Governance & Security](#9-api-governance--security)

---

## 1. Core Principles

Trato Hive is a true **System of Reasoning** built on three foundational principles:

### 1.1 Verifiability First (Citation-First)

All AI-generated output is secondary to the audit trail. Every number, claim, or summary must be hyperlinked directly to its source document, mitigating hallucination risk and meeting fiduciary requirements.

- **Visual Rule:** Citations always use Teal Blue `#2F7E8A` with underline
- **Behavior:** Clicking a citation opens a modal showing the exact source snippet
- **Constraint:** Teal Blue is reserved EXCLUSIVELY for citations

### 1.2 Unified & Composable

The platform unifies Sourcing, Pipeline Management, and Diligence into one workflow using a **Page/Block architecture** (Notion-style). Every content piece is a dynamic Block that can be composed, rearranged, and linked.

- **Pages:** First-class entities (Deal, Company, Document, Freeform)
- **Blocks:** Reusable content units with defined props and behaviors
- **Wiki Links:** `[[Page Name]]` syntax for bidirectional connections
- **API-First:** All modules exposed via REST/tRPC for integration

### 1.3 Agentic Orchestration

AI agents do not just *assist*—they *execute* and *orchestrate* complex, multi-step workflows. Human professionals review and approve AI work.

- **DocumentAgent:** OCR → Parse → Embed → Extract Facts
- **DiligenceAgent:** Question → RAG → Answer + Citations
- **SourcingAgent:** Company discovery & lookalike search
- **PipelineAgent:** Deal monitoring & next-step suggestions
- **GeneratorAgent:** IC deck and document generation

---

## 2. Design System: The Intelligent Hive

**Design System Version:** 2.0 (Brand Pack Implementation)

### 2.1 Brand Identity

- **Theme:** A subtle, elegant interpretation of "hive" without clichés
- **Brand Feel:** "Connected. Warm. Intelligent."
- **Mood:** Warm, interconnected, organic + geometric blend

### 2.2 Color Tokens

#### Light Mode

| Name | Hex | Usage |
|------|-----|-------|
| Bone | `#E2D9CB` | Primary app background |
| Alabaster | `#F0EEE6` | Card/panel backgrounds |
| Dark Vanilla | `#CEC2AE` | Secondary panels, borders |
| Black | `#1A1A1A` | Primary text |
| Orange | `#EE8D1D` | Primary CTAs, accent borders |
| Deep Orange | `#CB552F` | Strong CTAs, urgent actions |
| Faded Orange | `#FFB662` | Hover states, tertiary accents |
| Teal Blue | `#2F7E8A` | **CITATIONS ONLY** |

#### Dark Mode

| Name | Hex | Usage |
|------|-----|-------|
| Deep Grey | `#313131` | Primary app background |
| Panel Dark | `#3A3A3A` | Card/panel backgrounds |
| Panel Darker | `#424242` | Elevated surfaces |
| Cultured White | `#F7F7F7` | Primary text |
| Orange | `#EE8D1D` | Primary CTAs, accent borders |
| Faded Orange | `#FFB662` | Links, hover states |
| Teal Blue | `#2F7E8A` | **CITATIONS ONLY** |

### 2.3 Typography

- **Font Family:** Inter (Google Fonts) - Modern Sans Serif
- **Weights:** 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)
- **No Serif Fonts:** Previous Lora headings removed in v2.0

### 2.4 UI Principles

- **Rounded corners:** 8px border-radius minimum on interactive components
- **Hexagonal patterns:** For branding, decorative elements, data visualization only
- **Orange accent lines:** 4px border-top on prominent cards (Deal cards)
- **Citation modals:** Orange `#EE8D1D` border, must load in <200ms
- **Dark mode:** Smooth 300ms transitions between themes
- **Accessibility:** WCAG 2.1 AA contrast ratios (4.5:1 normal, 3:1 large text)

---

## 3. Information Architecture

### 3.1 Entity Graph Model

Trato Hive uses a **Hybrid Entity Graph** where Companies and Deals are both first-class entities with bidirectional relationships.

```
                    ┌─────────────────┐
                    │     Company     │
                    │   (First-Class) │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │   Deal   │   │   Deal   │   │   Deal   │
        │ PLATFORM │   │  ADD_ON  │   │  ADVISOR │
        └────┬─────┘   └────┬─────┘   └────┬─────┘
             │              │              │
             ▼              ▼              ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │ Documents│   │ Documents│   │ Documents│
        │  Facts   │   │  Facts   │   │  Facts   │
        └──────────┘   └──────────┘   └──────────┘
```

### 3.2 Deal-Company Relationships

A Deal can involve **multiple companies** with different roles:

| Role | Description |
|------|-------------|
| `PLATFORM` | Primary target company (the main acquisition) |
| `ADD_ON` | Bolt-on acquisition to an existing platform |
| `SELLER` | Party selling the company/asset |
| `BUYER` | Acquiring party |
| `ADVISOR` | Advisory role (banker, consultant) |

**Database Model:** `DealCompany` junction table with `[dealId, companyId, role]`

### 3.3 Page Types

Every entity can have an associated Page:

| Page Type | Entity | Auto-Created | Template |
|-----------|--------|--------------|----------|
| `DEAL_PAGE` | Deal | On deal creation | DealTemplate |
| `COMPANY_PAGE` | Company | On company creation | CompanyTemplate |
| `DOCUMENT_PAGE` | Document | On document upload | DocumentTemplate |
| `FREEFORM` | None | Manual | None |

### 3.4 Company Watch System

Users can watch companies independently of deals:

- **Watch List:** Per-user list of tracked companies
- **Fields:** `notes`, `tags[]`, `priority` (0=low, 1=medium, 2=high)
- **Unique Constraint:** One watch entry per user per company
- **Access:** Via Discovery module "Watched Companies" section

---

## 4. Navigation System

### 4.1 Sidebar Structure

The sidebar uses a **Pinned + Recent** pattern instead of module tabs:

```
┌─────────────────────────────┐
│  🔍 Search (opens ⌘K)       │
├─────────────────────────────┤
│  📌 PINNED (max 7)          │
│  ├─ Deal: Project Sky       │
│  ├─ Company: Acme Corp      │
│  └─ Page: Q1 Analysis       │
├─────────────────────────────┤
│  🕐 RECENT (max 7, FIFO)    │
│  ├─ Deal: Project Wave      │
│  ├─ Document: CIM v2.pdf    │
│  └─ Company: Beta Inc       │
├─────────────────────────────┤
│  📊 MODULES                 │
│  ├─ Command Center          │
│  ├─ Pipeline                │
│  ├─ Discovery               │
│  └─ Settings                │
└─────────────────────────────┘
```

### 4.2 Sidebar Behaviors

| Feature | Behavior |
|---------|----------|
| **Pinned Items** | User-managed, max 7 items, drag-to-reorder |
| **Recent Items** | Auto-tracked on page visit, FIFO queue, max 7 |
| **Active Expansion** | When navigating to a page, sidebar expands to show sub-pages |
| **Context Menu** | Right-click: "Pin", "Unpin", "Open in new tab", "Remove from recent" |
| **Persistence** | Pinned items sync to user preferences (localStorage + DB) |

### 4.3 Sidebar Item Types

```typescript
interface SidebarItem {
  id: string;
  type: 'deal' | 'company' | 'document' | 'page' | 'module';
  title: string;
  icon: string;
  href: string;
  children?: SidebarItem[];  // Sub-pages
}
```

### 4.4 Command Palette (⌘K)

A global command palette accessible via `⌘K` (Mac) or `Ctrl+K` (Windows).

#### Modes

| Mode | Trigger | Behavior |
|------|---------|----------|
| **Entity Search** | Start typing | Search Deals, Companies, Documents by title |
| **AI Query** | Natural language (starts with "what", "how", "why") | Routes to DiligenceAgent, shows inline answer with citations |
| **Quick Actions** | `/` prefix | Slash commands: `/new-deal`, `/new-company`, `/upload`, `/generate` |

#### Context-Aware Scoping

- **Default Scope:** Inherits from current page (if on a Deal, searches that deal's documents)
- **Scope Toggle:** Button to expand search to organization-wide
- **Scope Indicator:** Shows "Searching in: Project Sky" or "Searching in: All"

#### Insert as Block

After an AI query returns an answer:
1. "Insert as Block" button appears
2. Creates a `CitationBlock` with the answer content
3. Inserts at cursor position in current page editor
4. Preserves citations and source references

---

## 5. Page Templates

### 5.1 Deal Page Template

Auto-applied when a Deal is created via `deal.create` mutation.

```
┌─────────────────────────────────────────────────────────┐
│ [DealHeaderBlock]                                       │
│ Deal Name | Stage | Value | Team                        │
├─────────────────────────────────────────────────────────┤
│ [DatabaseViewBlock: Companies Involved]                 │
│ Company | Role | Added | Actions                        │
├─────────────────────────────────────────────────────────┤
│ [DatabaseViewBlock: DD Tracker]                         │
│ Item | Status | Assignee | Due Date                     │
├─────────────────────────────────────────────────────────┤
│ Sub-pages:                                              │
│  ├─ Overview (default landing)                          │
│  ├─ Documents (VDR + file explorer)                     │
│  ├─ Q&A (QueryBlock with review UI)                     │
│  ├─ IC Materials (Generator outputs)                    │
│  └─ Activity (ActivityTimelineBlock)                    │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Company Page Template

Auto-applied when a Company is created via `company.create` mutation.

```
┌─────────────────────────────────────────────────────────┐
│ [CompanyHeaderBlock]                                    │
│ Name | Industry | Revenue | Employees | Location        │
│ [Watch Button] [Edit]                                   │
├─────────────────────────────────────────────────────────┤
│ [DatabaseViewBlock: Deal History] (Graph-powered)       │
│ Deal Name | Stage | Value | Role | Created              │
├─────────────────────────────────────────────────────────┤
│ [Section: AI Insights]                                  │
│ Industry trends, risk factors, key metrics              │
├─────────────────────────────────────────────────────────┤
│ [DatabaseViewBlock: Key Contacts]                       │
│ Name | Title | Email | Phone | Notes                    │
├─────────────────────────────────────────────────────────┤
│ [Section: Related Companies]                            │
│ Companies sharing facts, same industry (Neo4j query)    │
└─────────────────────────────────────────────────────────┘
```

### 5.3 Document Page Template

Auto-applied when a Document is uploaded and processed by DocumentAgent.

```
┌─────────────────────────────────────────────────────────┐
│ [DocumentViewerBlock]                                   │
│ PDF/DOCX viewer with page navigation, zoom, fullscreen  │
│ Text selection for citation creation                    │
│ Highlights extracted facts on hover                     │
├─────────────────────────────────────────────────────────┤
│ [DatabaseViewBlock: Extracted Facts]                    │
│ Fact | Category | Confidence | Source Page              │
├─────────────────────────────────────────────────────────┤
│ [QueryBlock: Q&A History]                               │
│ Scoped to this document only                            │
└─────────────────────────────────────────────────────────┘
```

### 5.4 Freeform Page

No auto-template. User creates content manually using slash commands.

---

## 6. Block Reference

### 6.1 Block Categories

| Category | Blocks | Purpose |
|----------|--------|---------|
| **Standard** | Text, Headings, Lists, Dividers, Images | Basic content |
| **CRM** | DealHeaderBlock, CompanyHeaderBlock | Entity headers |
| **Data** | DatabaseViewBlock, PipelineHealthBlock | Structured data display |
| **AI** | QueryBlock, AISuggestionBlock, CitationBlock | AI-powered content |
| **Activity** | ActivityTimelineBlock, InboxBlock | Event streams |
| **Documents** | VDRBlock, DocumentViewerBlock | File management |
| **Navigation** | PageMention, SearchBlock | Links and search |

### 6.2 Block Specifications

#### DealHeaderBlock

**Purpose:** Display and edit deal metadata at top of Deal Pages.

| Prop | Type | Description |
|------|------|-------------|
| `dealId` | `string` | Required. The deal entity ID |
| `editable` | `boolean` | Allow inline editing (default: true) |

**Display Fields:** Name, Stage (with stepper), Value, Team members (face pile)

**Slash Command:** `/deal-header`

---

#### CompanyHeaderBlock (NEW)

**Purpose:** Display and edit company metadata at top of Company Pages.

| Prop | Type | Description |
|------|------|-------------|
| `companyId` | `string` | Required. The company entity ID |
| `editable` | `boolean` | Allow inline editing (default: true) |
| `showWatch` | `boolean` | Show watch button (default: true) |

**Display Fields:** Name, Industry, Revenue, Employees, Location, Logo

**Slash Command:** `/company-header`

---

#### DatabaseViewBlock

**Purpose:** Inline database table with filtering, sorting, and views.

| Prop | Type | Description |
|------|------|-------------|
| `dataSource` | `string` | Entity type: 'deals', 'companies', 'documents', 'facts', 'contacts' |
| `scope` | `'page' \| 'deal' \| 'organization'` | Data scope |
| `columns` | `ColumnConfig[]` | Column definitions |
| `defaultView` | `'table' \| 'kanban' \| 'calendar'` | Initial view |
| `filters` | `Filter[]` | Pre-applied filters |

**Column Types:** TEXT, NUMBER, DATE, SELECT, MULTI_SELECT, PERSON, STATUS, RELATION, ROLLUP, FORMULA

**Slash Command:** `/database`

---

#### QueryBlock

**Purpose:** AI-powered Q&A with citation display and review workflow.

| Prop | Type | Description |
|------|------|-------------|
| `question` | `string` | The question text |
| `scope` | `'document' \| 'deal' \| 'organization'` | Search scope |
| `showReview` | `boolean` | Enable approve/edit/reject UI (default: true) |

**Review States:** `PENDING`, `APPROVED`, `EDITED`, `REJECTED`

**Slash Command:** `/query` or `/ask`

---

#### CitationBlock

**Purpose:** Display AI-generated answers with preserved citations.

| Prop | Type | Description |
|------|------|-------------|
| `content` | `string` | The answer text with citation markers |
| `citations` | `Citation[]` | Array of source references |
| `source` | `'command-palette' \| 'query-block' \| 'manual'` | Origin of content |

**Slash Command:** `/citation`

---

#### DocumentViewerBlock (NEW)

**Purpose:** Embedded document viewer with PDF rendering and annotation.

| Prop | Type | Description |
|------|------|-------------|
| `documentId` | `string` | Required. The document entity ID |
| `showHighlights` | `boolean` | Highlight extracted facts (default: true) |
| `enableSelection` | `boolean` | Allow text selection for citations (default: true) |

**Slash Command:** `/document-viewer`

---

#### VDRBlock

**Purpose:** Virtual Data Room file explorer for deal documents.

| Prop | Type | Description |
|------|------|-------------|
| `dealId` | `string` | Required. The deal entity ID |
| `folderId` | `string?` | Optional. Starting folder |
| `showProcessingStatus` | `boolean` | Show AI processing indicators (default: true) |

**Slash Command:** `/vdr`

---

#### InboxBlock

**Purpose:** AI-generated task inbox with actionable items.

| Prop | Type | Description |
|------|------|-------------|
| `scope` | `'user' \| 'deal' \| 'organization'` | Task scope |
| `showDismissed` | `boolean` | Include dismissed items (default: false) |
| `maxItems` | `number` | Maximum items to display (default: 10) |

**Alert Types:** `STAGE_OVERDUE`, `DOCUMENT_PENDING`, `ACTION_REQUIRED`, `QA_NEEDS_REVIEW`

**Slash Command:** `/inbox`

---

#### ActivityTimelineBlock

**Purpose:** Chronological feed of entity-related events.

| Prop | Type | Description |
|------|------|-------------|
| `entityId` | `string` | Deal, Company, or Document ID |
| `entityType` | `'deal' \| 'company' \| 'document'` | Entity type |
| `limit` | `number` | Max events to load (default: 50) |

**Slash Command:** `/activity`

---

#### PipelineHealthBlock

**Purpose:** Visual pipeline summary with risk indicators.

| Prop | Type | Description |
|------|------|-------------|
| `visualization` | `'honeycomb' \| 'bar' \| 'funnel'` | Chart type |
| `showRisks` | `boolean` | Highlight AI-flagged risks (default: true) |

**Slash Command:** `/pipeline-health`

---

#### PageMention (Inline)

**Purpose:** Wiki-style link to another page with backlink tracking.

| Prop | Type | Description |
|------|------|-------------|
| `pageId` | `string` | Target page ID |

**Syntax:** `[[Page Name]]` or `[[Page Name|Display Text]]`

---

#### InlineCitationMark (Inline)

**Purpose:** Inline citation marker that links to source.

| Prop | Type | Description |
|------|------|-------------|
| `citationId` | `string` | Citation reference ID |
| `index` | `number` | Display number (e.g., [1], [2]) |

**Visual:** Teal Blue `#2F7E8A` superscript number

---

### 6.3 Scoping Rules

| Scope | Access | Use Case |
|-------|--------|----------|
| `page` | Current page only | Notes, local data |
| `deal` | All entities linked to deal | Deal-specific queries |
| `company` | All entities linked to company | Company research |
| `document` | Single document | Document-specific Q&A |
| `organization` | All tenant data | Global search |

---

## 7. Module Specifications

Modules provide organized entry points to functionality. Each Module is implemented as a Page with pre-configured blocks.

### 7.1 Command Center (Home)

**Route:** `/` or `/dashboard`

The user's dynamic home dashboard.

**Default Blocks:**
- `InboxBlock` (scope: user) - AI-generated tasks
- `PipelineHealthBlock` - Deal pipeline visualization
- `ActivityTimelineBlock` - Recent activity across all deals
- `SearchBlock` - Quick access to ⌘K

**AI Integration:** PipelineAgent monitors all modules and generates inbox items.

---

### 7.2 Pipeline

**Route:** `/pipeline`

The core deal management view with multiple visualization options.

**Default Blocks:**
- `InboxBlock` (scope: organization) - Urgent pipeline alerts
- `DatabaseViewBlock` (dataSource: deals) - Main pipeline table

**Views:**
1. **Kanban:** Deals as cards grouped by stage
2. **Table:** Traditional spreadsheet with all fields
3. **Timeline:** Gantt-style view by expected close date
4. **Calendar:** Calendar view of key dates
5. **Analytics:** Charts and metrics

**Pipeline Columns (Updated):**
- Name, Stage, Value, **Companies** (multi-chip with roles), Owner, Expected Close, Last Activity

**Deal Quick Actions (Hover):**
- "Open" | "Update Stage" | "Add Company"

---

### 7.3 Discovery

**Route:** `/discovery`

AI-native company sourcing and research.

**Sections:**
1. **Search:** Natural language sourcing ("Find UK SaaS companies with 10-50 employees")
2. **Target Lists:** Saved search results and curated lists
3. **Watched Companies:** User's watch list with notes/tags/priority
4. **Market Maps:** AI-generated industry visualizations

**Key Features:**
- **Natural Language Sourcing:** Complex thesis queries via SourcingAgent
- **Lookalike Discovery:** "Find Lookalikes" from any company
- **Watch Button:** Add companies to personal watch list
- **Auto-Generated Market Maps:** Hexagonal cluster visualizations

---

### 7.4 Diligence (Deal Sub-Page)

**Route:** `/deals/[id]/diligence`

Accessed via Deal Page "Diligence" sub-page, not as standalone module.

**Components:**
- `VDRBlock` - Document upload and management
- `QueryBlock` - Q&A with AI suggestions
- Q&A Review UI (Approve/Edit/Reject workflow)
- Risk Summary Panel

**Q&A Review Flow:**
1. Analyst submits question
2. DiligenceAgent generates answer with citations
3. Answer appears with status `PENDING`
4. Reviewer clicks: **Approve** (→ `APPROVED`) | **Edit** (→ `EDITED`) | **Reject** (→ `REJECTED`)
5. Activity logged to deal timeline

---

### 7.5 Generator (Deal Sub-Page)

**Route:** `/deals/[id]/generator`

Accessed via Deal Page "IC Materials" sub-page.

**Templates:**
- Investment Committee Deck (20 slides)
- LOI Draft
- Buyer Memo
- Executive Summary

**The Golden Citation:**
Every chart, table, and key number in generated output is annotated with a subtle Orange citation link that traces back to the source document.

---

## 8. Data Flow & AI Integration

### 8.1 The 7-Layer Architecture

| Layer | Name | Purpose | Key Components |
|-------|------|---------|----------------|
| 1 | **Data Plane** | Ingestion & Storage | S3, Reducto OCR, BullMQ |
| 2 | **Semantic Layer** | Verifiable Facts & Knowledge Graph | Neo4j, Pinecone, Facts |
| 3 | **TIC Core** | Reasoning Engine | Claude LLM, Embeddings, RAG |
| 4 | **Agentic Layer** | AI Workflow Agents | DocumentAgent, DiligenceAgent |
| 5 | **Experience Layer** | UI/UX & Generative Output | Next.js, Tiptap, tRPC |
| 6 | **Governance Layer** | Security & Audit | NextAuth, Prisma, RBAC |
| 7 | **API Layer** | Connectivity | Fastify routes, REST |

### 8.2 Document Processing Flow

```
User Upload → Data Plane (S3) → DocumentAgent
                                    │
                                    ├─→ OCR (Reducto)
                                    ├─→ Parse & Chunk
                                    ├─→ Embed (Pinecone)
                                    ├─→ Extract Facts (Claude)
                                    ├─→ Store (Neo4j Knowledge Graph)
                                    └─→ Create Document Page (auto-template)
```

### 8.3 Q&A Flow (DiligenceAgent)

```
User Question → DiligenceAgent → TIC Core
                                    │
                                    ├─→ Embed Question
                                    ├─→ Vector Search (Pinecone)
                                    ├─→ Context Retrieval
                                    ├─→ Generate Answer (Claude)
                                    ├─→ Extract Citations
                                    └─→ Return Answer + Sources

Answer → QueryBlock (PENDING) → Human Review → (APPROVED/EDITED/REJECTED)
```

### 8.4 Citation Flow

```
Verified Fact (Semantic Layer)
         │
         ├─→ Fact ID + Source Document + Page/Location
         │
         ▼
InlineCitationMark [N] (Experience Layer)
         │
         └─→ Click → Citation Modal → Source Snippet Highlighted
```

---

## 9. API, Governance & Security

### 9.1 API Layer

- **tRPC Routers:** Type-safe API for all mutations/queries
- **REST Endpoints:** Public API for integrations
- **Webhooks:** Event notifications for external systems

### 9.2 Multi-Tenancy

- **Enforcement:** Every query/mutation MUST filter by `organizationId`
- **Session:** Organization ID derived from authenticated user session
- **Isolation:** Complete data isolation between tenants

### 9.3 Security & Compliance

| Requirement | Implementation |
|-------------|----------------|
| **Trust & Audit** | Immutable log of all AI actions and citations |
| **Compliance** | SOC2 Type II, GDPR |
| **Encryption** | AES-256 (at rest), TLS 1.3 (in transit) |
| **Data Privacy** | "No Training on User Data" policy |
| **Deployment** | Multi-tenant SaaS with Single-Tenant options |

### 9.4 RBAC (Role-Based Access Control)

| Role | Permissions |
|------|-------------|
| `ADMIN` | Full access, user management, settings |
| `MEMBER` | Create/edit deals, documents, Q&A |
| `VIEWER` | Read-only access |

---

## Appendix A: URL Structure

| Route | Entity | Example |
|-------|--------|---------|
| `/` | Dashboard | Command Center |
| `/pipeline` | Pipeline | Deal list views |
| `/discovery` | Discovery | Sourcing module |
| `/deals/[id]` | Deal Page | `/deals/clm123abc` |
| `/deals/[id]/[subpage]` | Deal Sub-page | `/deals/clm123abc/documents` |
| `/companies/[id]` | Company Page | `/companies/clm456def` |
| `/documents/[id]` | Document Page | `/documents/clm789ghi` |
| `/pages/[id]` | Freeform Page | `/pages/clmxyzabc` |

---

## Appendix B: Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘K` / `Ctrl+K` | Open Command Palette |
| `⌘/` / `Ctrl+/` | Open slash command menu |
| `⌘S` / `Ctrl+S` | Save current page |
| `⌘B` / `Ctrl+B` | Bold text |
| `⌘I` / `Ctrl+I` | Italic text |
| `[[` | Start page mention |
| `Escape` | Close modal/palette |

---

## Appendix C: Migration Notes

### From v1.0 to v2.0

1. **Deal.companyId → DealCompany:** Existing `companyId` auto-migrates to `DealCompany` junction with `role=PLATFORM`
2. **Page.type:** New field added with default `FREEFORM`
3. **CompanyWatch:** New table for watch list functionality
4. **QAAnswer:** New model for Q&A review workflow

---

**End of Specification**

*Last Updated: January 15, 2026*
*Maintained by: Trato Hive Development Team*
