# Trato Hive - Project Status & Implementation Roadmap

**Last Updated:** January 15, 2026
**Current Phase:** Phase 11: UI/UX Architecture Restructure
**Latest Commit:** `feat: citation UI, fact streaming, and codebase cleanup`
**Overall Progress:** Phases 1-10: 100% Complete | Phase 11: In Progress
**Completed Work Archive:** See [COMPLETED_WORK.md](./COMPLETED_WORK.md) for Phases 1-10

---

## Executive Summary

Trato Hive is an AI-Native M&A CRM built as a "System of Reasoning" following a 7-Layer Architecture with 5 Core Modules. This document tracks active and future work.

**Project Status:**

- Phases 1-10: Foundation Complete (100%) - [Archive](./COMPLETED_WORK.md)
- Phase 11: UI/UX Architecture Restructure (IN PROGRESS)

**Phase 11 Objectives:**
1. Transform module-centric navigation to Page-first architecture
2. Implement Company Pages as first-class entities (hybrid entity graph)
3. Add Deal-Company many-to-many relationships with roles
4. Build global Command Palette with AI integration
5. Add Company watch list functionality
6. Create Document Pages with auto-generation on upload
7. Implement Q&A Review flow (approve/edit/reject)

---

## Phase 11: UI/UX Architecture Restructure

**Status:** 12/46 tasks complete (26%)
**Estimated Time:** ~126 hours total
**Priority:** HIGH (Major architecture evolution)

### 11.0: Documentation & Planning

| Task ID | Task | Status | Est. Hours |
|---------|------|--------|------------|
| **[TASK-080]** | Archive Completed Work | IN PROGRESS | 1 |
| **[TASK-081]** | Restructure Specification Document | ✅ COMPLETE | 6 |

**Task Details:**

- [ ] **[TASK-080] Archive Completed Work** (1 hour) - IN PROGRESS
  - [x] Move Phase 6-10 tasks to COMPLETED_WORK.md
  - [x] Reset PROJECT_STATUS.md for Phase 11
  - [ ] Verify archive completeness

- [x] **[TASK-081] Restructure Specification Document** (6 hours) - ✅ COMPLETE
  - [x] Rewrite `Trato Hive Product & Design Specification.md`
  - [x] Add Information Architecture section (Entity Graph Model)
  - [x] Add Navigation System section (Pinned/Recent + Command Palette)
  - [x] Add Page Templates section (Deal, Company, Document, Freeform)
  - [x] Add Block Reference section (complete catalog with props)
  - [x] Update Module Specifications with new patterns

---

### 11.1: Schema Updates (Database Layer)

| Task ID | Task | Status | Est. Hours | Dependencies |
|---------|------|--------|------------|--------------|
| **[TASK-082]** | DealCompany Junction Table | ✅ COMPLETE | 2 | - |
| **[TASK-083]** | CompanyWatch Table | ✅ COMPLETE | 2 | - |
| **[TASK-084]** | Page Type Enhancement | ✅ COMPLETE | 2 | - |
| **[TASK-085]** | Migration Script | ✅ COMPLETE | 2 | TASK-082 |
| **[TASK-086]** | Update Seed Data | ✅ COMPLETE | 2 | TASK-082, TASK-083 |
| **[TASK-087]** | Schema Unit Tests | ✅ COMPLETE | 2 | TASK-082, TASK-083 |

**Task Details:**

- [x] **[TASK-082] DealCompany Junction Table** (2 hours) - ✅ COMPLETE
  - [x] Create `DealCompany` model with `dealId`, `companyId`, `role`
  - [x] Create `DealCompanyRole` enum: PLATFORM, ADD_ON, SELLER, BUYER, ADVISOR
  - [x] Add unique constraint on `[dealId, companyId]`
  - [x] Add indexes on `dealId` and `companyId`
  - [x] Update `Company` model with `dealCompanies` relation
  - [x] Update `Deal` model with `dealCompanies` relation

- [x] **[TASK-083] CompanyWatch Table** (2 hours) - ✅ COMPLETE
  - [x] Create `CompanyWatch` model with `companyId`, `userId`, `notes`, `tags`, `priority`
  - [x] Add unique constraint on `[companyId, userId]`
  - [x] Add indexes on `companyId` and `userId`
  - [x] Update `Company` model with `watches` relation
  - [x] Update `User` model with `watchedCompanies` relation

- [x] **[TASK-084] Page Type Enhancement** (2 hours) - ✅ COMPLETE
  - [x] Create `PageType` enum: DEAL_PAGE, COMPANY_PAGE, DOCUMENT_PAGE, FREEFORM
  - [x] Add `type` field to `Page` model (default: FREEFORM)
  - [x] Add `companyId` optional field to `Page` model
  - [x] Add `documentId` optional field to `Page` model
  - [x] Add relations: `Page.company`, `Page.document`

- [x] **[TASK-085] Migration Script** (2 hours) - ✅ COMPLETE
  - [x] Create migration for DealCompany, CompanyWatch, Page updates
  - [x] Auto-migrate existing `Deal.companyId` to `DealCompany` with role=PLATFORM
  - [x] Preserve all existing relationships
  - [x] Add rollback script for safety

- [x] **[TASK-086] Update Seed Data** (2 hours) - ✅ COMPLETE
  - [x] Update seed script for `DealCompany` relationships
  - [x] Add sample `CompanyWatch` entries
  - [x] Update existing deals to use junction table
  - [x] Add multiple companies per deal examples

- [x] **[TASK-087] Schema Unit Tests** (2 hours) - ✅ COMPLETE
  - [x] Tests for DealCompany CRUD operations
  - [x] Tests for CompanyWatch CRUD operations
  - [x] Tests for Page type constraints
  - [x] Tests for many-to-many relationship queries

---

### 11.2: Navigation System

| Task ID | Task | Status | Est. Hours | Dependencies |
|---------|------|--------|------------|--------------|
| **[TASK-088]** | Sidebar State Store | ✅ COMPLETE | 3 | - |
| **[TASK-089]** | Sidebar Item Types | ✅ COMPLETE | 1 | - |
| **[TASK-090]** | Pinned Section UI | ✅ COMPLETE | 4 | TASK-088 |
| **[TASK-091]** | Recent Section UI | ✅ COMPLETE | 3 | TASK-088 |
| **[TASK-092]** | Active Page Expansion | ✅ COMPLETE | 3 | TASK-088 |
| **[TASK-093]** | Sidebar Persistence | Pending | 2 | TASK-088 |

**Task Details:**

- [x] **[TASK-088] Sidebar State Store** (3 hours) - ✅ COMPLETE
  - [x] Create Zustand store at `apps/web/src/stores/sidebar.ts`
  - [x] State: `pinnedItems` (7 max), `recentItems` (7 max, FIFO), `expandedItemId`
  - [x] Actions: `pin`, `unpin`, `addRecent`, `setExpanded`, `clearRecent`
  - [x] Persistence middleware for localStorage sync

- [x] **[TASK-089] Sidebar Item Types** (1 hour) - ✅ COMPLETE
  - [x] Define `SidebarItem` interface in `@trato-hive/shared`
  - [x] Properties: `id`, `type`, `title`, `icon`, `href`, `children`
  - [x] Types: `deal`, `company`, `document`, `page`, `module`
  - [x] Export from shared package

- [x] **[TASK-090] Pinned Section UI** (4 hours) - ✅ COMPLETE
  - [x] Implement draggable pinned section in Sidebar
  - [x] 7-item limit with visual indicator when full
  - [x] Unpin functionality on hover
  - [x] Drag-and-drop reordering with dnd-kit

- [x] **[TASK-091] Recent Section UI** (3 hours) - ✅ COMPLETE
  - [x] Implement auto-tracked recent section
  - [x] FIFO logic: newest at top, max 7 items
  - [x] Hook into route changes to track visits (`useRecentTracker`)
  - [x] "Clear Recent" button in section header

- [x] **[TASK-092] Active Page Expansion** (3 hours) - ✅ COMPLETE
  - [x] Auto-expand sidebar item when navigating to page
  - [x] Show sub-pages (children) when expanded
  - [x] Collapse siblings when expanding new item
  - [x] Chevron animation with CSS transitions

- [ ] **[TASK-093] Sidebar Persistence** (2 hours)
  - [ ] Save pinned items to user preferences
  - [ ] Sync with database via tRPC `user.updatePreferences`
  - [ ] Load initial state from DB on mount
  - [ ] Debounced sync to prevent excessive writes

---

### 11.3: Command Palette

| Task ID | Task | Status | Est. Hours | Dependencies |
|---------|------|--------|------------|--------------|
| **[TASK-094]** | CommandPalette Component | Pending | 4 | - |
| **[TASK-095]** | Global Keyboard Hook | Pending | 2 | TASK-094 |
| **[TASK-096]** | Entity Search Mode | Pending | 3 | TASK-094 |
| **[TASK-097]** | AI Query Mode | Pending | 4 | TASK-094 |
| **[TASK-098]** | Quick Actions Mode | Pending | 2 | TASK-094 |
| **[TASK-099]** | Insert as Block Action | Pending | 3 | TASK-097 |
| **[TASK-100]** | Context-Aware Scoping | Pending | 3 | TASK-097 |

**Task Details:**

- [ ] **[TASK-094] CommandPalette Component** (4 hours)
  - [ ] Create modal at `apps/web/src/components/CommandPalette.tsx`
  - [ ] Search input with icon and placeholder
  - [ ] Keyboard navigation: Up/Down arrows, Enter, Escape
  - [ ] Results grouped by type (Pages, Actions, AI)
  - [ ] Design: Dark overlay, centered modal, Intelligent Hive styling

- [ ] **[TASK-095] Global Keyboard Hook** (2 hours)
  - [ ] Hook into K globally in app shell (`_app.tsx` or layout)
  - [ ] Open CommandPalette on trigger
  - [ ] Close on Escape or click outside
  - [ ] Prevent conflicts with editor shortcuts

- [ ] **[TASK-096] Entity Search Mode** (3 hours)
  - [ ] Search across Deals by name, value, stage
  - [ ] Search across Companies by name, industry
  - [ ] Search across Documents by title, folder
  - [ ] Real-time results with debounced input (300ms)

- [ ] **[TASK-097] AI Query Mode** (4 hours)
  - [ ] Detect natural language questions (starts with "what", "how", "why", etc.)
  - [ ] Route to DiligenceAgent via `diligence.askQuestion`
  - [ ] Show inline answer with citations
  - [ ] Loading state with "Thinking..." animation

- [ ] **[TASK-098] Quick Actions Mode** (2 hours)
  - [ ] Slash commands: `/new-deal`, `/new-company`, `/upload`, `/generate`
  - [ ] Show action results in palette
  - [ ] Navigate to created entity after action
  - [ ] Show keyboard shortcuts in action list

- [ ] **[TASK-099] Insert as Block Action** (3 hours)
  - [ ] After AI answer, show "Insert as Block" button
  - [ ] Create CitationBlock with answer content
  - [ ] Insert at cursor position in current page editor
  - [ ] Preserve citations and sources in block properties

- [ ] **[TASK-100] Context-Aware Scoping** (3 hours)
  - [ ] Inherit search scope from current page (if on Deal, scope to deal docs)
  - [ ] Toggle to expand scope to organization
  - [ ] Show current scope indicator in palette header
  - [ ] Remember user's scope preference

---

### 11.4: Company Pages

| Task ID | Task | Status | Est. Hours | Dependencies |
|---------|------|--------|------------|--------------|
| **[TASK-101]** | CompanyHeaderBlock | Pending | 4 | - |
| **[TASK-102]** | Company Page Route | Pending | 3 | - |
| **[TASK-103]** | Company Page Template | Pending | 4 | TASK-101, TASK-082 |
| **[TASK-104]** | Deal History DatabaseView | Pending | 4 | TASK-082 |
| **[TASK-105]** | Related Companies Section | Pending | 3 | - |
| **[TASK-106]** | Company tRPC Router | Pending | 3 | TASK-083 |

**Task Details:**

- [ ] **[TASK-101] CompanyHeaderBlock** (4 hours)
  - [ ] Create Tiptap extension at `apps/web/src/components/editor/extensions/CompanyHeaderBlock.tsx`
  - [ ] Display: Company name, industry, revenue, employees, location
  - [ ] Editable fields with inline editing
  - [ ] Logo upload/display support
  - [ ] Watch button integration

- [ ] **[TASK-102] Company Page Route** (3 hours)
  - [ ] Create route at `app/(dashboard)/companies/[id]/page.tsx`
  - [ ] Layout with breadcrumbs (Home > Companies > [Company Name])
  - [ ] Page metadata and SEO
  - [ ] 404 handling for invalid company IDs

- [ ] **[TASK-103] Company Page Template** (4 hours)
  - [ ] Define `CompanyTemplate` in shared templates
  - [ ] Auto-create on company creation:
    - CompanyHeaderBlock
    - Deal History DatabaseViewBlock
    - AI Insights section (placeholder)
    - Key Contacts DatabaseViewBlock
  - [ ] Hook into `company.create` mutation

- [ ] **[TASK-104] Deal History DatabaseView** (4 hours)
  - [ ] Graph-powered query via Neo4j `KnowledgeGraphService`
  - [ ] Show all deals involving company with roles (Platform, Add-on, etc.)
  - [ ] Columns: Deal Name, Stage, Value, Role, Created At
  - [ ] Click to navigate to deal page

- [ ] **[TASK-105] Related Companies Section** (3 hours)
  - [ ] Neo4j query for companies sharing facts
  - [ ] Filter by same industry, overlapping key persons
  - [ ] Display as card grid with similarity score
  - [ ] "View Company" and "Compare" actions

- [ ] **[TASK-106] Company tRPC Router** (3 hours)
  - [ ] Create `companyRouter` at `apps/api/src/routers/company.ts`
  - [ ] Procedures: `company.create`, `company.get`, `company.update`, `company.delete`
  - [ ] Procedures: `company.list`, `company.search`
  - [ ] Multi-tenancy enforcement via organizationId

---

### 11.5: Watch List System

| Task ID | Task | Status | Est. Hours | Dependencies |
|---------|------|--------|------------|--------------|
| **[TASK-107]** | Watch Button Component | Pending | 2 | TASK-083 |
| **[TASK-108]** | Watch List View | Pending | 3 | TASK-083 |
| **[TASK-109]** | Watch tRPC Procedures | Pending | 2 | TASK-083 |

**Task Details:**

- [ ] **[TASK-107] Watch Button Component** (2 hours)
  - [ ] Create `WatchButton.tsx` component
  - [ ] Toggle watch/unwatch on click
  - [ ] Visual states: Watching (filled), Not watching (outline)
  - [ ] Integrate into CompanyHeaderBlock and company cards

- [ ] **[TASK-108] Watch List View** (3 hours)
  - [ ] Add "Watched Companies" section to Discovery module
  - [ ] Display watched companies with notes and tags
  - [ ] Filter by priority, tags, date added
  - [ ] Quick actions: Remove watch, Open company, Add note

- [ ] **[TASK-109] Watch tRPC Procedures** (2 hours)
  - [ ] `watch.add` - Add company to watch list with notes/tags
  - [ ] `watch.remove` - Remove company from watch list
  - [ ] `watch.list` - Get user's watched companies with pagination
  - [ ] `watch.update` - Update notes, tags, priority

---

### 11.6: Document Pages

| Task ID | Task | Status | Est. Hours | Dependencies |
|---------|------|--------|------------|--------------|
| **[TASK-110]** | DocumentViewerBlock | Pending | 5 | - |
| **[TASK-111]** | Document Page Route | Pending | 3 | TASK-084 |
| **[TASK-112]** | Document Page Template | Pending | 3 | TASK-110 |
| **[TASK-113]** | Document Agent Integration | Pending | 2 | TASK-111 |

**Task Details:**

- [ ] **[TASK-110] DocumentViewerBlock** (5 hours)
  - [ ] Create Tiptap extension for embedded document viewer
  - [ ] PDF rendering with page navigation
  - [ ] Zoom controls and fullscreen mode
  - [ ] Text selection for citation creation
  - [ ] Highlight extracted facts on hover

- [ ] **[TASK-111] Document Page Route** (3 hours)
  - [ ] Create route at `app/(dashboard)/documents/[id]/page.tsx`
  - [ ] Auto-create page when document uploaded
  - [ ] Layout with breadcrumbs and document metadata
  - [ ] Handle various document types (PDF, DOCX, XLSX)

- [ ] **[TASK-112] Document Page Template** (3 hours)
  - [ ] Define `DocumentTemplate` in shared templates
  - [ ] Auto-apply on document upload:
    - DocumentViewerBlock (full width)
    - Extracted Facts DatabaseViewBlock
    - Q&A History (scoped to document)
  - [ ] Hook into document upload flow

- [ ] **[TASK-113] Document Agent Integration** (2 hours)
  - [ ] Hook into DocumentAgent `processDocument` completion
  - [ ] Auto-create Page with template after processing
  - [ ] Link Page to Document via `documentId`
  - [ ] Notify user when page is ready

---

### 11.7: Q&A Review Flow

| Task ID | Task | Status | Est. Hours | Dependencies |
|---------|------|--------|------------|--------------|
| **[TASK-114]** | QAAnswer Status Enum | Pending | 1 | - |
| **[TASK-115]** | QAAnswer Model | Pending | 2 | TASK-114 |
| **[TASK-116]** | Q&A Review UI | Pending | 4 | TASK-115 |
| **[TASK-117]** | Q&A Activity Logging | Pending | 2 | TASK-115 |
| **[TASK-118]** | Q&A Sub-page Template | Pending | 2 | TASK-116 |

**Task Details:**

- [ ] **[TASK-114] QAAnswer Status Enum** (1 hour)
  - [ ] Create `QAAnswerStatus` enum: PENDING, APPROVED, EDITED, REJECTED
  - [ ] Add to Prisma schema
  - [ ] Export from shared types

- [ ] **[TASK-115] QAAnswer Model** (2 hours)
  - [ ] Create `QAAnswer` model in Prisma
  - [ ] Fields: `id`, `question`, `answer`, `citations`, `status`, `editedAnswer`, `reviewerId`, `reviewedAt`
  - [ ] Relations: `deal`, `document`, `reviewer` (User)
  - [ ] Indexes for efficient queries

- [ ] **[TASK-116] Q&A Review UI** (4 hours)
  - [ ] Enhance QueryBlock with review actions
  - [ ] Approve button: Mark as APPROVED, log activity
  - [ ] Edit button: Open edit modal, save as EDITED
  - [ ] Reject button: Mark as REJECTED with reason
  - [ ] Status badges: Pending (yellow), Approved (green), Edited (blue), Rejected (red)

- [ ] **[TASK-117] Q&A Activity Logging** (2 hours)
  - [ ] Create activity types: QA_APPROVED, QA_EDITED, QA_REJECTED
  - [ ] Log reviewer, timestamp, changes
  - [ ] Show in deal activity timeline
  - [ ] Include in activity summary metrics

- [ ] **[TASK-118] Q&A Sub-page Template** (2 hours)
  - [ ] Update Deal template to auto-create "Q&A" sub-page
  - [ ] Include QueryBlock with review UI
  - [ ] Show Q&A history filtered to deal
  - [ ] Add to deal page navigation

---

### 11.8: Pipeline Updates

| Task ID | Task | Status | Est. Hours | Dependencies |
|---------|------|--------|------------|--------------|
| **[TASK-119]** | Deal Companies Column | Pending | 3 | TASK-082 |
| **[TASK-120]** | AI Alerts InboxBlock | Pending | 3 | - |
| **[TASK-121]** | Deal Quick Actions | Pending | 2 | - |

**Task Details:**

- [ ] **[TASK-119] Deal Companies Column** (3 hours)
  - [ ] Update Pipeline DatabaseViewBlock columns
  - [ ] Show multiple companies with role badges
  - [ ] "Platform" company shown first, others as +N
  - [ ] Expand to see all companies on hover

- [ ] **[TASK-120] AI Alerts InboxBlock** (3 hours)
  - [ ] Add InboxBlock to top of Pipeline page
  - [ ] Show urgent items from PipelineAgent (stub for now)
  - [ ] Alert types: Stage overdue, Document pending, Action required
  - [ ] Dismiss and snooze actions

- [ ] **[TASK-121] Deal Quick Actions** (2 hours)
  - [ ] Hover card on deal in pipeline
  - [ ] Actions: "Open", "Update Stage", "Add Company"
  - [ ] Keyboard shortcuts for power users
  - [ ] Update optimistically with rollback on error

---

### 11.9: Testing & Documentation

| Task ID | Task | Status | Est. Hours | Dependencies |
|---------|------|--------|------------|--------------|
| **[TASK-122]** | Navigation E2E Tests | Pending | 3 | TASK-088-093 |
| **[TASK-123]** | Company Pages E2E Tests | Pending | 3 | TASK-101-106 |
| **[TASK-124]** | Q&A Review E2E Tests | Pending | 2 | TASK-114-118 |
| **[TASK-125]** | Update CLAUDE.md Files | Pending | 2 | All |

**Task Details:**

- [ ] **[TASK-122] Navigation E2E Tests** (3 hours)
  - [ ] Playwright tests for Pinned section (add, remove, reorder)
  - [ ] Tests for Recent section (auto-track, FIFO, clear)
  - [ ] Tests for K Command Palette (search, AI query, actions)
  - [ ] Tests for page expansion in sidebar

- [ ] **[TASK-123] Company Pages E2E Tests** (3 hours)
  - [ ] Tests for company creation with auto-template
  - [ ] Tests for company page navigation
  - [ ] Tests for watch button toggle
  - [ ] Tests for deal history display

- [ ] **[TASK-124] Q&A Review E2E Tests** (2 hours)
  - [ ] Tests for approve workflow
  - [ ] Tests for edit workflow
  - [ ] Tests for reject workflow
  - [ ] Tests for activity logging

- [ ] **[TASK-125] Update CLAUDE.md Files** (2 hours)
  - [ ] Update `apps/web/CLAUDE.md` with new components
  - [ ] Update `features/*/CLAUDE.md` with new patterns
  - [ ] Document new Zustand stores
  - [ ] Document new tRPC routers

---

## Progress Tracking

### Summary Statistics

**By Phase:**

- Phases 1-5: Foundation & Documentation - 100% - [Archive](./COMPLETED_WORK.md)
- Phase 6: Foundation Packages - 100% - [Archive](./COMPLETED_WORK.md#phase-6-foundation-packages)
- Phase 7: Frontend - 100% (10/11 tasks) - [Archive](./COMPLETED_WORK.md#phase-7-frontend-block-protocol--editor)
- Phase 8: Backend - 100% - [Archive](./COMPLETED_WORK.md#phase-8-backend)
- Phase 9: AI Stack - 100% - [Archive](./COMPLETED_WORK.md#phase-9-ai-stack)
- Phase 10: Features - 100% - [Archive](./COMPLETED_WORK.md#phase-10-features)
- **Phase 11: UI/UX Architecture - 15% (7/46 tasks)**

**Phase 11 Breakdown:**

| Sub-Phase | Tasks | Status |
|-----------|-------|--------|
| 11.0: Documentation | TASK-080, TASK-081 | 1/2 |
| 11.1: Schema | TASK-082 to TASK-087 | ✅ 6/6 |
| 11.2: Navigation | TASK-088 to TASK-093 | 0/6 |
| 11.3: Command Palette | TASK-094 to TASK-100 | 0/7 |
| 11.4: Company Pages | TASK-101 to TASK-106 | 0/6 |
| 11.5: Watch List | TASK-107 to TASK-109 | 0/3 |
| 11.6: Document Pages | TASK-110 to TASK-113 | 0/4 |
| 11.7: Q&A Review | TASK-114 to TASK-118 | 0/5 |
| 11.8: Pipeline Updates | TASK-119 to TASK-121 | 0/3 |
| 11.9: Testing & Docs | TASK-122 to TASK-125 | 0/4 |

**Total Time:**

- Completed (Phases 1-10): ~250 hours
- Phase 11 Estimated: ~126 hours
- Total Project: ~376 hours

---

## Current Status & Next Actions

**Current Phase:** Phase 11: UI/UX Architecture Restructure

**Recently Completed:**
- [TASK-082] DealCompany Junction Table ✅
- [TASK-083] CompanyWatch Table ✅
- [TASK-084] Page Type Enhancement ✅
- [TASK-085] Migration Script ✅
- [TASK-086] Update Seed Data ✅
- [TASK-087] Schema Unit Tests ✅ (27 tests passing)

**In Progress:**
- [TASK-080] Archive Completed Work (verify archive completeness)

**Next Up:**
1. [TASK-088] Sidebar State Store
2. [TASK-089] Sidebar Item Types
3. [TASK-090] Pinned Section UI
4. [TASK-091] Recent Section UI

**Recommended Execution Order:**

1. **Week 1: Foundation** - TASK-080 to TASK-087 (Documentation + Schema)
2. **Week 2-3: Navigation** - TASK-088 to TASK-100 (Sidebar + Command Palette)
3. **Week 4: Company System** - TASK-101 to TASK-109 (Company Pages + Watch List)
4. **Week 5: Documents & Q&A** - TASK-110 to TASK-118 (Document Pages + Q&A Review)
5. **Week 6: Polish** - TASK-119 to TASK-125 (Pipeline Updates + Testing)

**Key Architectural Decisions (Confirmed):**
- Deal-Company Roles: `PLATFORM, ADD_ON, SELLER, BUYER, ADVISOR`
- CompanyWatch: Separate table with userId, notes, tags, priority
- URL Structure: `/companies/[id]` (clear separation from deals)
- K Scope: Inherit from current page, toggle to expand
- Migration: Auto-migrate existing `companyId` to `DealCompany` with PLATFORM role

---

**Last Updated:** January 15, 2026 (Phase 11.1 Schema Complete)
**Maintained By:** All team members (update after every task)
**Reference:** Root CLAUDE.md Section 5 (EPC Workflow)
**Completed Work:** See [COMPLETED_WORK.md](./COMPLETED_WORK.md)
**Plan File:** See `~/.claude/plans/mutable-soaring-nygaard.md` for detailed implementation plan

**Files Modified in Phase 11.1:**
- `packages/db/prisma/schema.prisma` - DealCompany, CompanyWatch, PageType additions
- `packages/db/prisma/migrations/20260115_phase11_schema_updates/migration.sql` - Migration script
- `packages/db/prisma/migrations/20260115_phase11_schema_updates/rollback.sql` - Rollback script
- `packages/db/prisma/seed/phase11.ts` - Phase 11 seed data
- `packages/db/prisma/seed.ts` - Updated to include Phase 11 seeding
- `packages/db/src/schema.test.ts` - 27 unit tests for new schema
- `packages/db/vitest.config.ts` - Vitest configuration
