# Instructions for PRD Writing Agent

**Project:** Trato Hive - AI-Native M&A CRM
**Task:** Write complete Product Requirements Documents (PRDs)
**Date:** 2025-11-11

---

## 🎯 Your Mission

You are tasked with writing comprehensive Product Requirements Documents (PRDs) for Trato Hive, an AI-Native M&A CRM platform. These PRDs will serve as the authoritative specification for implementation, guiding all development work.

---

## 📚 Required Reading (CRITICAL - Read Before Writing)

**You MUST read these files before writing any PRD:**

1. **Root Governance:**
   - `/CLAUDE.md` - Complete project rules and architecture
   - `/README.md` - Project overview

2. **Source Documents:**
   - `/Trato Hive Product & Design Specification.md` - Primary product specification
   - `/claude_code_2025_solo_dev_playbook_cli_plan_mode_claude.md` - Development playbook

3. **Design System:**
   - `/context/design-principles.md` - UX principles and heuristics
   - `/context/style-guide.md` - The Intelligent Hive design system

4. **Architecture:**
   - `/docs/architecture/7-layer-architecture.md` - System architecture overview (if filled)

5. **Project Structure:**
   - `/PROJECT_STRUCTURE.md` - Complete directory tree
   - `/SETUP_COMPLETION_CHECKLIST.md` - Task checklist

---

## 📋 PRDs to Complete

### 1. Root PRD (HIGHEST PRIORITY)
**File:** `/docs/PRD.md`
**Status:** Template exists - needs complete content
**Priority:** CRITICAL - Must be done first
**Time Estimate:** 2-3 hours
**Scope:** Overall product vision, all 5 modules, complete architecture

---

### 2. Feature PRDs (Complete in this order)

#### Priority 1: Deals Module (CRITICAL)
**File:** `/docs/prds/deals.md`
**Module:** Module 3 - Deals (Interactive Pipeline OS)
**Status:** Empty - needs complete content
**Priority:** HIGHEST (implement first - core CRM)
**Time Estimate:** 1.5 hours
**Reason:** Core CRM functionality, most critical feature

#### Priority 2: Diligence Module (HIGH)
**File:** `/docs/prds/diligence.md`
**Module:** Module 4 - Diligence Room (AI-Native VDR)
**Status:** Empty - needs complete content
**Priority:** HIGH (high-value feature)
**Time Estimate:** 1.5 hours
**Reason:** Key differentiator, automated Q&A with citations

#### Priority 3: Command Center Module (MEDIUM-HIGH)
**File:** `/docs/prds/command-center.md`
**Module:** Module 1 - Hive Command Center
**Status:** Empty - needs complete content
**Priority:** MEDIUM-HIGH (entry point)
**Time Estimate:** 1 hour
**Reason:** User entry point, dashboard, AI query bar

#### Priority 4: Generator Module (MEDIUM)
**File:** `/docs/prds/generator.md`
**Module:** Module 5 - Generator (Auditable Material Creation)
**Status:** Empty - needs complete content
**Priority:** MEDIUM (killer feature with golden citations)
**Time Estimate:** 1.5 hours
**Reason:** Unique value proposition, IC decks with citations

#### Priority 5: Discovery Module (LOW)
**File:** `/docs/prds/discovery.md`
**Module:** Module 2 - Discovery (AI-Native Sourcing)
**Status:** Empty - needs complete content
**Priority:** LOW (implement last)
**Time Estimate:** 1 hour
**Reason:** Can be added after core features are stable

---

## 📐 PRD Template & Structure

Each PRD (including root) must follow this exact structure:

```markdown
# PRD: [Module Name or "Trato Hive Root"]

**Status:** Draft | Review | Approved
**Last Updated:** YYYY-MM-DD
**Owner:** [Team/Role]
**Priority:** Critical | High | Medium | Low

---

## 1. Problem Statement

[2-3 paragraphs describing the specific problem this module/product solves]

**Current State:**
- [What exists today]
- [Pain points]
- [Why current solutions fail]

**Desired State:**
- [What we want to achieve]
- [How this solves the problem]

---

## 2. Goals & Non-Goals

### Goals (What we WILL do)
1. [Specific, measurable goal 1]
2. [Specific, measurable goal 2]
3. [Specific, measurable goal 3]

### Non-Goals (What we will NOT do in this version)
1. [Explicitly out of scope item 1]
2. [Explicitly out of scope item 2]

---

## 3. User Stories

### Primary User Personas
- **[Persona 1]:** [Description, role, needs]
- **[Persona 2]:** [Description, role, needs]

### User Stories (Format: As a [user], I want to [action], so that [benefit])

**Epic 1: [Epic Name]**
- As a [user type], I want to [specific action], so that [specific benefit]
- As a [user type], I want to [specific action], so that [specific benefit]

**Epic 2: [Epic Name]**
- As a [user type], I want to [specific action], so that [specific benefit]
- As a [user type], I want to [specific action], so that [specific benefit]

---

## 4. User Experience (UX Flow)

### Entry Point
[How user accesses this module/feature]

### Main User Flow (Step-by-Step)
1. **User Action:** [What user does]
   - **System Response:** [What system does]
   - **UI State:** [What user sees]

2. **User Action:** [Next action]
   - **System Response:** [System reaction]
   - **UI State:** [Updated view]

3. [Continue for complete flow]

### Exit Points
- [Where user goes next - primary path]
- [Alternative paths]

### Edge Cases
- [What happens if user does X]
- [Error handling scenarios]

---

## 5. Features & Requirements

### Feature 1: [Feature Name]

**Description:**
[2-3 sentences describing the feature]

**Functional Requirements:**
1. [Specific requirement 1]
2. [Specific requirement 2]
3. [Specific requirement 3]

**Non-Functional Requirements:**
- **Performance:** [Response time, load time, etc.]
- **Scalability:** [Concurrent users, data volume]
- **Security:** [Authentication, authorization, encryption]
- **Accessibility:** [WCAG compliance level]

**UI/UX Requirements:**
- **Design System:** Must use "The Intelligent Hive" design tokens
- **Colors:** [Specific color usage from style guide]
- **Typography:** [Font families and sizes]
- **Components:** [Specific components from packages/ui/]
- **Citation-First Principle:** [If applicable - how citations are displayed]

**Dependencies:**
- Packages: [Which packages this feature uses]
- Other Features: [Cross-feature dependencies]
- External Services: [APIs, third-party services]

---

### Feature 2: [Feature Name]
[Repeat structure above]

---

## 6. Data Model & Architecture

### Data Entities

**[Entity Name]** (e.g., Deal, Document, Fact)
```typescript
interface EntityName {
  id: string
  field1: Type
  field2: Type
  // ... all fields
  createdAt: Date
  updatedAt: Date
}
```

### Architecture Layers

**7-Layer Architecture Integration:**
- **Layer 1 (Data Plane):** [How this module uses data ingestion/storage]
- **Layer 2 (Semantic Layer):** [How this module uses facts/knowledge graph]
- **Layer 3 (TIC Core):** [How this module uses AI reasoning]
- **Layer 4 (Agentic Layer):** [Which agents this module invokes]
- **Layer 5 (Experience Layer):** [Frontend/backend components]
- **Layer 6 (Governance Layer):** [Security, audit logging requirements]
- **Layer 7 (API Layer):** [Which API endpoints exposed]

### Data Ownership
- **Owns:** [Data this module owns]
- **Reads:** [Data this module reads from other modules]
- **Writes:** [External data this module updates]

---

## 7. API Specification

### Endpoints

**Endpoint 1: [HTTP Method] [Path]**
```
GET|POST|PUT|PATCH|DELETE /api/v1/[resource]/[action]
```

**Description:** [What this endpoint does]

**Authentication:** Required | Optional | None

**Authorization:** [Roles allowed: Admin, Manager, Analyst, Viewer]

**Request:**
```typescript
// Headers
Authorization: Bearer {token}
Content-Type: application/json

// Body (if applicable)
{
  field1: Type,
  field2: Type
}
```

**Response (Success):**
```typescript
// Status: 200 | 201 | 204
{
  data: {
    // Response data
  },
  meta?: {
    page: number,
    limit: number,
    total: number
  }
}
```

**Response (Error):**
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

**Validation:**
- [Field 1: Required, type, constraints]
- [Field 2: Optional, type, constraints]

**Rate Limiting:** [Requests per minute]

---

### Endpoint 2: [Repeat structure]

---

## 8. Testing & Acceptance Criteria

### Unit Testing Requirements
- [ ] All services have unit tests (>80% coverage)
- [ ] All utility functions tested
- [ ] Edge cases covered

### Integration Testing Requirements
- [ ] API endpoints tested end-to-end
- [ ] Database interactions tested
- [ ] External service mocks tested

### E2E Testing Requirements (User Flows)
- [ ] [User flow 1: Description]
- [ ] [User flow 2: Description]
- [ ] [User flow 3: Description]

### Acceptance Criteria (Checklist)

**Functional:**
- [ ] [Specific functional requirement 1 met]
- [ ] [Specific functional requirement 2 met]
- [ ] All user stories implemented
- [ ] All API endpoints functional
- [ ] All UI components match design system

**Non-Functional:**
- [ ] Performance: [Specific metric achieved]
- [ ] Security: [Security requirements met]
- [ ] Accessibility: WCAG 2.1 AA compliant
- [ ] Testing: >80% code coverage

**Design:**
- [ ] The Intelligent Hive design system followed
- [ ] Color palette correct (Soft Sand, Gold, Charcoal Black, Teal Blue)
- [ ] Typography correct (Lora for headings, Inter for UI)
- [ ] 8px minimum border-radius on all components
- [ ] Citations implemented correctly (if applicable)
- [ ] Visual regression tests pass

**Documentation:**
- [ ] API documentation complete
- [ ] Component documentation (Storybook if UI)
- [ ] README updated
- [ ] CHANGELOG updated

---

## 9. Design Specifications

### The Intelligent Hive Integration

**Color Usage:**
- **Soft Sand (#F5EFE7):** [Where used in this module]
- **Gold/Honey (#E2A74A):** [Where used - accents, CTAs, citations]
- **Charcoal Black (#1A1A1A):** [Where used - text]
- **Teal Blue (#2F7E8A):** [Where used - AI insights, links, citations]

**Typography:**
- **Headings:** Lora or Playfair Display (serif)
- **Body/UI:** Inter or Public Sans (sans-serif)

**Components:**
- [List specific components from packages/ui/ to be used]

**Citation-First Principle (if applicable):**
- [How citations are displayed]
- [Citation link styling: Teal Blue with underline]
- [Citation modal behavior]

### Wireframes / Mockups
[Describe key screens/components visually or reference Figma links]

---

## 10. Security & Compliance

### Authentication & Authorization
- **Authentication Required:** Yes | No
- **Roles Allowed:** [Admin, Manager, Analyst, Viewer]
- **Row-Level Security:** [firmId checks required]

### Data Privacy
- **PII Handling:** [What PII is collected/stored]
- **GDPR Compliance:** [Right to erasure, data export]
- **Encryption:** [At rest: AES-256, In transit: TLS 1.3]

### Audit Logging
**Events to Log:**
- [User action 1 - what to log]
- [User action 2 - what to log]

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
- [Input validation requirements]
- [XSS prevention measures]
- [SQL injection prevention]
- [Rate limiting]

---

## 11. Performance Requirements

### Response Times
- **Page Load:** [Target time]
- **API Calls:** [Target time (p50, p95, p99)]
- **AI Operations:** [Target time or async requirement]

### Scalability
- **Concurrent Users:** [Expected number]
- **Data Volume:** [Documents, records, etc.]
- **Peak Load:** [Requests per second]

### Optimization Strategies
- [Caching strategy]
- [Database indexing]
- [Lazy loading]
- [Code splitting]

---

## 12. Risks & Mitigations

### Technical Risks

**Risk 1: [Risk Description]**
- **Impact:** High | Medium | Low
- **Likelihood:** High | Medium | Low
- **Mitigation:** [How to address]

**Risk 2: [Risk Description]**
- **Impact:** High | Medium | Low
- **Likelihood:** High | Medium | Low
- **Mitigation:** [How to address]

### Business Risks

**Risk 1: [Risk Description]**
- **Impact:** High | Medium | Low
- **Mitigation:** [How to address]

### Open Questions
- [ ] **Question 1:** [Open question needing answer]
  - **Status:** Open | Answered
  - **Decision:** [If answered]

- [ ] **Question 2:** [Open question]
  - **Status:** Open | Answered
  - **Decision:** [If answered]

---

## 13. Dependencies & Integrations

### Internal Dependencies
- **Packages:**
  - `packages/[name]`: [How used]
  - `packages/[name]`: [How used]

- **Other Features:**
  - `features/[name]`: [Integration point]

### External Dependencies
- **APIs/Services:**
  - [Service name]: [Purpose, API version]

- **Third-Party Libraries:**
  - [Library name]: [Purpose, version]

---

## 14. Rollout Plan

### Phase 1: Alpha (Internal Testing)
- **Timeline:** [Dates or duration]
- **Scope:** [What to release]
- **Users:** Internal team only
- **Success Criteria:** [How to measure]

### Phase 2: Beta (Limited Users)
- **Timeline:** [Dates or duration]
- **Scope:** [Additional features]
- **Users:** [Selected customers]
- **Success Criteria:** [How to measure]

### Phase 3: General Availability
- **Timeline:** [Dates or duration]
- **Scope:** [Complete feature set]
- **Users:** All users
- **Success Criteria:** [How to measure]

### Rollback Plan
[How to rollback if issues occur]

---

## 15. Success Metrics & KPIs

### User Adoption Metrics
- **Metric 1:** [Name] - Target: [Value]
- **Metric 2:** [Name] - Target: [Value]

### Performance Metrics
- **Metric 1:** [Name] - Target: [Value]
- **Metric 2:** [Name] - Target: [Value]

### Quality Metrics
- **Metric 1:** [Name] - Target: [Value]
- **Metric 2:** [Name] - Target: [Value]

### Business Metrics
- **Metric 1:** [Name] - Target: [Value]
- **Metric 2:** [Name] - Target: [Value]

---

## 16. Appendix

### Glossary
- **Term 1:** Definition
- **Term 2:** Definition

### References
- [Link to design mockups]
- [Link to technical specs]
- [Link to related PRDs]

### Revision History
| Date | Version | Author | Changes |
|------|---------|--------|---------|
| YYYY-MM-DD | 0.1 | [Name] | Initial draft |
| YYYY-MM-DD | 1.0 | [Name] | Approved version |

---

**End of PRD**
```

---

## ✅ Quality Checklist (Use Before Finalizing)

Before marking a PRD as complete, verify:

### Content Completeness
- [ ] All 16 sections filled with detailed content
- [ ] No [TBD] or [To be filled] placeholders remaining
- [ ] All user stories written in proper format
- [ ] All API endpoints fully specified
- [ ] All acceptance criteria are specific and measurable

### Technical Accuracy
- [ ] Architecture layers correctly identified
- [ ] Package dependencies accurate
- [ ] Data model aligns with database schema conventions
- [ ] API response formats follow project standards

### Design System Compliance
- [ ] The Intelligent Hive colors referenced correctly
- [ ] Typography specifications correct
- [ ] Citation-first principle addressed (if applicable)
- [ ] 8px minimum border-radius mentioned

### Cross-Reference Accuracy
- [ ] References to other PRDs are correct
- [ ] References to architecture docs are correct
- [ ] Package names match actual package names
- [ ] Feature paths match actual directory structure

### Clarity & Readability
- [ ] No ambiguous language
- [ ] Technical terms defined in glossary
- [ ] User flows are step-by-step and clear
- [ ] Acceptance criteria are unambiguous

---

## 🎯 Specific Instructions by PRD

### For Root PRD (`/docs/PRD.md`)

**Special Requirements:**
- Must cover all 5 modules at high level
- Must explain 7-Layer Architecture
- Must define overall product vision
- Must include complete success metrics for entire product
- Must reference all 5 feature PRDs

**Source Sections:**
- Use Trato Hive spec Section 1 (Introduction & Core Principles)
- Use Trato Hive spec Section 2 (Design System overview)
- Use Trato Hive spec Section 3 (7-Layer Architecture)
- Use Trato Hive spec Section 4 (All 5 modules - high level)
- Use Trato Hive spec Section 6 (API, Governance, Security)

---

### For Command Center PRD (`/docs/prds/command-center.md`)

**Module:** Module 1 - Hive Command Center

**Key Features to Detail:**
1. Conversational AI Bar (TIC Query)
2. AI-Generated "My Tasks" inbox
3. Pipeline Health Widget (honeycomb chart)
4. Activity Feed (real-time updates)

**Source Section:**
- Trato Hive spec Section 4, Module 1 (lines 69-90)

**Special Focus:**
- Natural language query processing
- AI task generation logic
- Real-time activity feed implementation
- Honeycomb chart visualization (hexagonal pattern)

**Architecture Layers:**
- Layer 3 (TIC): Query processing
- Layer 4 (Agentic): Task generation
- Layer 5 (Experience): Dashboard UI

---

### For Discovery PRD (`/docs/prds/discovery.md`)

**Module:** Module 2 - Discovery (AI-Native Sourcing)

**Key Features to Detail:**
1. Natural Language Sourcing (complex thesis queries)
2. Lookalike Discovery (Grata-style)
3. Auto-Generated Market Maps (hexagonal visualizations)

**Source Section:**
- Trato Hive spec Section 4, Module 2 (lines 92-111)

**Special Focus:**
- Natural language query → company search
- Lookalike algorithm (deep attribute matching)
- Market map visualization (hexagonal patterns, Teal Blue)
- Integration with external data sources

**Architecture Layers:**
- Layer 3 (TIC): Query understanding
- Layer 4 (Agentic): Sourcing Agent
- Layer 5 (Experience): Discovery UI

**Data Model:**
- Company entity (owned by this feature)
- Target list entity
- Search query entity

---

### For Deals PRD (`/docs/prds/deals.md`)

**Module:** Module 3 - Deals (Interactive Pipeline OS)

**Key Features to Detail:**
1. Interactive Pipeline View (Kanban + List toggle)
2. Deal 360° View (4 tabs: Overview, Diligence, Documents, Activity)
3. Verifiable Fact Sheet (citation-first with teal blue hyperlinks)
4. AI-Suggested Next Steps

**Source Section:**
- Trato Hive spec Section 4, Module 3 (lines 113-136)

**Special Focus:**
- **CRITICAL:** Verifiable Fact Sheet with citation-first principle
- Drag-and-drop Kanban functionality
- Deal 360° tab structure and data loading
- Citation modal behavior (click number → see source document with highlight)

**Architecture Layers:**
- Layer 2 (Semantic): Verifiable facts with citations
- Layer 4 (Agentic): Pipeline OS Agent for AI suggestions
- Layer 5 (Experience): Pipeline UI, Deal 360° UI

**Data Model:**
- Deal entity (CRITICAL - main entity)
- PipelineStage enum (sourcing, screening, diligence, ic_prep, closing, portfolio)
- Fact entity (with sourceId, pageNumber, excerpt)

**API Endpoints (MUST INCLUDE):**
```
GET    /api/v1/deals                   # List with pagination
GET    /api/v1/deals/:id               # Get single deal
POST   /api/v1/deals                   # Create deal
PATCH  /api/v1/deals/:id               # Update deal
DELETE /api/v1/deals/:id               # Delete deal
GET    /api/v1/deals/:id/fact-sheet   # Verifiable Fact Sheet
GET    /api/v1/deals/:id/next-steps   # AI-suggested next steps
PATCH  /api/v1/deals/:id/stage        # Update pipeline stage
```

**Design Requirements:**
- Deal cards: Soft Sand background, Gold accent line at top
- Kanban columns: Charcoal Black headers with font-serif
- Fact sheet: Gold border, numbers in Teal Blue (clickable)
- Citations: Teal Blue text with underline, hover to Gold

---

### For Diligence PRD (`/docs/prds/diligence.md`)

**Module:** Module 4 - Diligence Room (AI-Native VDR)

**Key Features to Detail:**
1. Smart VDR Ingestion (drag-and-drop, OCR, indexing)
2. Automated Q&A (AI suggests answers with [cite] links)
3. Repeat Question Detection
4. Automatic Risk Summaries (non-standard clauses)

**Source Section:**
- Trato Hive spec Section 4, Module 4 (lines 138-160)

**Special Focus:**
- VDR upload workflow (drag-and-drop → OCR → index → fact extraction)
- Automated Q&A workflow:
  1. Analyst uploads question
  2. Diligence Agent searches VDR
  3. AI suggests answer in Teal Blue with [cite] link
  4. Human reviews, edits, approves
- Citation modal (click [cite] → see source document page with highlight)
- Risk scanning (scan SPAs for non-standard clauses)

**Architecture Layers:**
- Layer 1 (Data Plane): VDR upload, OCR, document parsing
- Layer 2 (Semantic): Fact extraction, indexing
- Layer 3 (TIC): Q&A generation, risk analysis
- Layer 4 (Agentic): Diligence Agent orchestration
- Layer 5 (Experience): VDR UI, Q&A interface

**API Endpoints:**
```
POST   /api/v1/deals/:id/vdr/upload           # Upload VDR documents
GET    /api/v1/deals/:id/vdr/documents        # List VDR documents
POST   /api/v1/deals/:id/diligence/qa         # Submit question
GET    /api/v1/deals/:id/diligence/qa         # List Q&A items
PATCH  /api/v1/deals/:id/diligence/qa/:qaId   # Approve/edit answer
GET    /api/v1/deals/:id/diligence/risks      # Get risk summary
```

**Design Requirements:**
- VDR upload: Drag-and-drop area with progress indicator
- Q&A list: AI-suggested answers in Teal Blue with [cite] button
- Citation modal: Full-screen overlay, source document viewer, highlighted excerpt
- Risk panel: Gold accent, risk items with severity levels

---

### For Generator PRD (`/docs/prds/generator.md`)

**Module:** Module 5 - Generator (Auditable Material Creation)

**Key Features to Detail:**
1. One-Click IC Decks (20-slide PowerPoint, auto-generated)
2. The "Golden" Citation (every number hyperlinked to source - KILLER FEATURE)
3. LOI / Memo Drafting (legal document first drafts)

**Source Section:**
- Trato Hive spec Section 4, Module 5 (lines 162-181)

**Special Focus:**
- **CRITICAL:** Golden Citation implementation
  - Every chart, table, key number in IC deck has small Gold citation link
  - Click link in IC meeting → traces back to source document
  - This is THE killer feature - emphasize thoroughly
- IC deck generation workflow:
  1. User clicks "Generate IC Deck"
  2. AI queries Verifiable Fact Layer for all content
  3. Generates 20-slide deck (Company Overview, Financials, Market, Risks, Team)
  4. Every number/claim has citation metadata embedded
  5. User reviews in preview mode
  6. Downloads as PowerPoint with clickable citations
- LOI drafting (pulls verified facts: names, numbers, clauses)

**Architecture Layers:**
- Layer 2 (Semantic): Query Verifiable Fact Layer for all deck content
- Layer 3 (TIC): Content generation, narrative synthesis
- Layer 4 (Agentic): Generator Agent orchestration
- Layer 5 (Experience): Template selection UI, preview panel, download

**API Endpoints:**
```
POST   /api/v1/deals/:id/generate/ic-deck     # Generate IC deck
POST   /api/v1/deals/:id/generate/loi         # Generate LOI draft
GET    /api/v1/deals/:id/generate/status      # Check generation status
GET    /api/v1/deals/:id/generate/preview     # Preview generated content
POST   /api/v1/deals/:id/generate/download    # Download final document
```

**Data Model:**
- GeneratedDocument entity (type: ic_deck | loi | memo)
- CitationLink entity (links fact to position in document)
- Template entity (deck templates, LOI templates)

**Design Requirements:**
- Template selector: Card grid with preview thumbnails
- Generation progress: Progress bar with step indicators
- Preview panel: Deck viewer with citation highlights (Gold indicators)
- Download button: Primary Gold button

---

## 🚨 Critical Requirements for ALL PRDs

### Citation-First Principle (If Applicable)
For any module that displays AI-generated facts or numbers:

**MUST Include:**
1. **Visual Treatment:**
   - All verifiable numbers/facts styled in Teal Blue (#2F7E8A)
   - Underline on hover
   - Cursor: pointer
   - Small [cite] indicator or superscript number

2. **Citation Modal Specification:**
   - **Trigger:** Click on citation link
   - **Content:**
     - Source document name
     - Page number
     - Full excerpt with highlighted text (yellow background on relevant text)
     - Link to full document
   - **Design:**
     - Modal overlay (rgba(0,0,0,0.5))
     - White background (#FFFFFF)
     - Border-radius: 12px (radius-lg)
     - Shadow: shadow-xl
     - Max-width: 600px
     - Escape to close, focus trap
   - **Performance:** Load in <200ms

3. **Data Structure:**
```typescript
interface Citation {
  factId: string
  sourceId: string        // Document ID
  pageNumber: number
  excerpt: string         // Text excerpt with context
  confidence: number      // 0-1 confidence score
  timestamp: Date         // When fact was extracted
}
```

### The Intelligent Hive Design Compliance
**Every PRD must specify:**
- Which colors used where (Soft Sand, Gold, Charcoal Black, Teal Blue)
- Typography (Lora for headings, Inter for UI)
- Border-radius (minimum 8px on all components)
- Specific components from `packages/ui/` (Button, Input, Card, Citation, etc.)

### 7-Layer Architecture Mapping
**Every PRD must document:**
- Which layers this module uses
- How it uses each layer (specific functions/interfaces)
- Which packages it depends on
- Which agents it invokes (if applicable)

### Security & Compliance
**Every PRD must include:**
- Authentication requirements (JWT required? Yes/No)
- Authorization (which roles: Admin, Manager, Analyst, Viewer)
- Row-level security (firmId checks)
- Audit logging (what events to log)
- Input validation (Zod schemas)
- Data encryption (at rest, in transit)

### Testing Requirements
**Every PRD must specify:**
- Unit test coverage target (minimum 80%)
- Integration tests (which API flows)
- E2E tests (which user flows with Playwright)
- Visual regression tests (if UI changes)

---

## 📊 Estimated Time by PRD

| PRD | Priority | Time Estimate | Complexity |
|-----|----------|---------------|------------|
| **Root PRD** | CRITICAL | 2-3 hours | High (covers all modules) |
| **Deals** | HIGHEST | 1.5 hours | High (core feature, citation-first) |
| **Diligence** | HIGH | 1.5 hours | High (VDR, automated Q&A, citations) |
| **Command Center** | MEDIUM-HIGH | 1 hour | Medium (dashboard, AI query) |
| **Generator** | MEDIUM | 1.5 hours | High (golden citations - killer feature) |
| **Discovery** | LOW | 1 hour | Medium (sourcing, lookalike) |
| **Total** | - | **9-10 hours** | - |

---

## 🎨 Writing Style Guidelines

### Tone
- **Professional** but clear (not overly academic)
- **Specific** not vague (use exact numbers, not "fast" or "many")
- **Actionable** not aspirational (requirements, not wishes)

### Language
- Use active voice ("User clicks..." not "The button is clicked...")
- Use present tense for requirements ("System validates..." not "System will validate...")
- Avoid jargon without definition (define in Glossary)
- Be precise with technical terms (use exact package names, function names)

### Examples
❌ **Vague:** "The system should be fast"
✅ **Specific:** "API response time <500ms (p95) for list queries"

❌ **Vague:** "Users can search for companies"
✅ **Specific:** "As a PE Associate, I want to search companies using natural language queries like 'UK SaaS companies with 10-50 employees and >20% YoY growth' so that I can quickly find acquisition targets matching our investment thesis"

❌ **Vague:** "Citations are displayed"
✅ **Specific:** "All AI-generated numbers are rendered in Teal Blue (#2F7E8A) with an underline. Clicking opens a modal (max-width: 600px, border-radius: 12px) displaying the source document name, page number, and highlighted excerpt (yellow background). Modal loads in <200ms."

---

## ✅ Final Checklist Before Submission

- [ ] All 16 sections complete with detailed content
- [ ] No placeholders or [TBD] remaining
- [ ] Source document sections referenced
- [ ] Architecture layers identified
- [ ] API endpoints fully specified (request/response formats)
- [ ] Data models defined with TypeScript interfaces
- [ ] User stories in proper format (As a..., I want..., so that...)
- [ ] Acceptance criteria specific and measurable
- [ ] The Intelligent Hive design system referenced
- [ ] Citation-first principle detailed (if applicable)
- [ ] Security requirements complete
- [ ] Testing requirements complete
- [ ] File saved in correct location (`/docs/PRD.md` or `/docs/prds/[module].md`)
- [ ] Markdown formatting correct (links, code blocks, tables)
- [ ] Cross-references accurate (other PRDs, architecture docs, packages)

---

## 🆘 Need Help?

If you encounter issues:

1. **Re-read source documents:** The answer is usually in the Trato Hive spec
2. **Check PROJECT_STRUCTURE.md:** For package names and directory structure
3. **Review CLAUDE.md:** For project rules and architecture
4. **Check style-guide.md:** For exact design tokens
5. **Ask for clarification:** If requirements are ambiguous

---

## 📤 Submission

Once complete, ensure:
1. File saved in correct location
2. Markdown formatting clean
3. All checklists verified
4. Status updated to "Review" in PRD header

---

**Remember:** These PRDs are the source of truth for implementation. Be thorough, specific, and clear. Developers will rely on these documents to build Trato Hive correctly.

---

**Good luck! 🚀**
