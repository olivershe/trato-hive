# PRD: Generator Module (Module 5)

**Status:** Draft  
**Last Updated:** 2025-11-12  
**Owner:** Product & Engineering Teams  
**Priority:** Medium

---

## 1. Problem Statement

Producing high‑quality investment materials is a core responsibility of M&A professionals. Investment Committee (IC) decks, Letters of Intent (LOIs) and deal memos must synthesise financial data, market insights, risks and narrative context into polished documents. Today, these materials are created manually: analysts copy numbers from spreadsheets, reformat charts in PowerPoint, search through data rooms for supporting clauses and write commentary from scratch. This process takes days and introduces errors when numbers change or sources are misattributed. There is no audit trail to verify that the numbers presented match the underlying documents; during IC meetings, partners often question the provenance of a metric, leading to time‑consuming “back‑to‑source” checks.

Meanwhile, AI platforms like **Hebbia** and **Rogo** show that automated document synthesis is possible. Hebbia’s “Matrix” product creates CIMs and pitch decks by pulling metrics, management bios and market maps directly from source documents with citations【32184628154010†L160-L190】. Rogo generates meeting prep documents and sponsor overviews by integrating internal and external data【248476347016084†L74-L176】. These tools save bankers hours and provide clickable citations to verify facts. However, they are standalone solutions and do not integrate with a firm’s CRM or pipeline. To deliver a truly AI‑native workflow, Trato Hive must embed document generation within the deal lifecycle, drawing from the same Verifiable Fact Layer and maintaining strict traceability.

**Current State:**
- IC decks, LOIs and memos are built manually in PowerPoint or Word; analysts gather data from spreadsheets, VDRs and emails, leading to copy‑paste errors and inconsistent formatting.  
- There is no central source of truth for the facts and figures used in presentations; updates to a financial metric require manual changes in multiple locations.  
- Citation links are rare or non‑existent; documents rely on footnotes or appendices that are hard to verify.  
- Tools like Hebbia, Model ML and Rogo can generate documents, but they operate outside of the firm’s CRM and require costly integrations or separate subscriptions.  
- Non‑standard drafting (e.g. custom slide layouts, bespoke narratives) is handled manually.

**Desired State:**
The **Generator module** will allow users to create auditable materials directly from Trato Hive. Analysts will select a template (IC deck, LOI, memo), and the system will gather all relevant facts, metrics and documents from the Semantic Layer. It will generate a narrative flow, charts and tables, embedding a **Golden Citation** next to every key number or statement. Users can preview, edit and rearrange slides or sections; they can click citation links to view the source document and excerpt. When exported, the resulting PowerPoint or Word files will contain embedded citation metadata for future auditing. The module will rely on internal data and LLMs hosted via the AI Core; external data integrations (e.g. PitchBook, CapIQ) are not required for MVP and will be evaluated separately for cost and value.

---

## 2. Goals & Non‑Goals

### Goals (What we **will** deliver)
1. **Template library:** Provide templates for IC decks, LOIs and memos with defined slide structures, styles and narrative flow.  
2. **Data gathering & synthesis:** Automatically pull facts from the Verifiable Fact Layer and Semantic Layer; compute charts and tables for financials, market and risk sections.  
3. **Golden citation implementation:** Every number, chart and statement includes a citation link (Teal Blue) that opens a modal showing the source document, page and excerpt【564290982268161†L123-L129】.  
4. **Interactive preview & editing:** Allow users to preview the generated material, edit text and charts, rearrange slides and update data; maintain citation links during edits.  
5. **Export & download:** Generate PowerPoint or Word files with embedded citation metadata; support downloading and sharing.  
6. **Internal focus:** Use internal AI services (TIC and AI Core) and data from the Semantic Layer; avoid costly external data integrations in the initial release.

### Non‑Goals (Out of scope for this version)
1. **Custom template builder:** Users cannot create entirely new templates or arbitrary slide layouts; they can choose from predefined templates and modify content.  
2. **Custom LLM training:** The module will not train proprietary models; it will rely on third‑party LLMs via the AI Core.  
3. **External data sources:** Integrations with external financial databases (PitchBook, CapIQ) or news feeds are not included in MVP; optional connectors may be added later.  
4. **Full legal document automation:** Drafting of definitive agreements (purchase agreements, SPA) is out of scope; the focus is on IC decks, LOIs and memos.

---

## 3. User Stories

### Primary User Personas
- **M&A Associate:** Responsible for preparing IC materials and LOIs; needs to compile data quickly and accurately.  
- **Diligence Analyst:** Provides updated facts and summaries; wants to ensure the numbers used in documents match the latest insights.  
- **Legal Counsel:** Reviews LOIs and memos; needs to verify that clauses and terms are correctly drafted and supported by source documents.  
- **Investment Committee Member:** Consumes IC decks and memos; needs confidence that all figures are traceable to their sources.

### User Stories (Format: As a [user], I want to [action], so that [benefit])

**Epic 1: Template Selection & Generation**
- *As an M&A Associate, I want to choose an IC deck template (e.g. standard 20‑slide format), so that the system knows which sections to populate.*  
- *As an M&A Associate, I want to click “Generate IC Deck” and receive a draft with company overview, financials, market, risks and team sections, so that I can focus on reviewing content rather than creating slides.*  
- *As a Legal Counsel, I want to generate an LOI draft that pulls verified names, deal terms and key clauses, so that I can start negotiations with accurate information.*

**Epic 2: Golden Citation & Auditability**
- *As an IC Member, I want every number or assertion in the deck to have a clickable citation link, so that I can verify its source during meetings【564290982268161†L123-L129】.*  
- *As a Diligence Analyst, I want to click a citation in the preview and see the underlying document excerpt highlighted, so that I can check accuracy before sharing.*  
- *As an M&A Associate, I want exported decks and memos to retain citation metadata, so that auditors can trace facts back to documents even after download.*

**Epic 3: Preview, Edit & Export**
- *As an M&A Associate, I want to preview the generated deck slide by slide, edit text and charts, and rearrange slides, so that I can tailor the narrative to our investment thesis.*  
- *As a Diligence Analyst, I want to update a number in the deck (e.g. EBITDA) and have the citation automatically update to the new source, so that consistency is maintained.*  
- *As an M&A Associate, I want to download the final deck as a PowerPoint with all slides and citations intact, so that I can present to the IC.*

**Epic 4: Drafting LOIs & Memos**
- *As a Legal Counsel, I want the system to draft an LOI using template language and verified facts (names, price ranges, exclusivity periods), so that I can review and finalise quickly.*  
- *As an M&A Associate, I want to generate a memo summarising the investment thesis, key metrics, risks and rationale, with citations, so that I can share with the investment committee.*  
- *As a Legal Counsel, I want to edit the draft LOI in the UI and add bespoke clauses, so that I don’t need to start from scratch in Word.*

---

## 4. User Experience (UX Flow)

### Entry Point
Users access the Generator module via the **“Generator”** tab in the navigation or through a link in the Deal 360° view. The module shows a list of existing generated documents and a “Generate New” button.

### Main User Flow (Step‑by‑Step)
1. **User Action:** Click “Generate New” and select the type (IC Deck, LOI, Memo).  
   - **System Response:** Display available templates with preview thumbnails; user selects one.  
   - **UI State:** Template cards show number of slides/sections, a brief description and last updated date.
2. **User Action:** Click “Generate.”  
   - **System Response:** The Agentic layer gathers all relevant facts, metrics and clauses from the Semantic Layer; the TIC synthesises narrative text; charts and tables are generated.  
   - **UI State:** A progress bar appears with steps: Gathering Facts → Drafting Content → Embedding Citations → Rendering Slides. Users can see progress and cancel if needed.
3. **User Action:** Preview the generated document.  
   - **System Response:** The UI loads the deck or document with pagination; each slide or section shows content with Teal Blue citation numbers.  
   - **UI State:** Users can click citations to open a modal showing the source document snippet; they can edit text boxes, adjust chart data (within allowed parameters) and reorder slides via drag‑and‑drop.
4. **User Action:** Edit and update.  
   - **System Response:** When users change numbers or text, the system validates that the new data exists in the Semantic Layer; it updates citations accordingly.  
   - **UI State:** Edited elements are highlighted until saved; unsaved changes show a warning. Users can undo or redo edits.
5. **User Action:** Download or Save.  
   - **System Response:** Upon clicking “Download,” the system compiles the document into a PowerPoint (for decks) or Word (for LOIs/memos) with embedded citation metadata.  
   - **UI State:** A confirmation modal appears; once ready, the file downloads; the generated document is saved in the list with status “Ready.”
6. **User Action:** Return to deal.  
   - **System Response:** The Deal 360° view updates to include the generated document under the “Documents” tab with a link to open it.  
   - **UI State:** Users can access the document later for further edits or downloads.

### Exit Points
- Users can cancel generation at any time; partial progress is discarded.  
- Users can leave the module; generation continues asynchronously and results appear in the document list when ready.

### Edge Cases
- **Large decks:** Generating very large decks (>50 slides) may take longer; show a longer progress indicator and allow background processing.  
- **Missing data:** If required facts are missing (e.g. no revenue data), display a warning and leave placeholders; allow users to input custom values and attach citations manually.  
- **Citation conflicts:** If multiple sources exist for a fact, display a dialog to let users choose the citation with highest confidence.  
- **Time‑outs:** If generation fails due to time‑outs or LLM errors, display an error and allow retrying.

---

## 5. Features & Requirements

### Feature 1: Template Library & Selection

**Description:**  
Provides a curated set of templates for IC decks, LOIs and memos with consistent styling and narrative flow. Users can preview templates and select one for generation.

**Functional Requirements:**
1. **Template listing:** Fetch available templates from the Template service; display as cards with thumbnails and metadata (name, type, slide count, last updated).  
2. **Preview:** Allow users to click a template card to open a preview modal showing sample slides or sections.  
3. **Selection:** Users select a template; store selection in session state.  
4. **Template updates:** When templates change (e.g. new design), ensure backward compatibility; notify users if an existing template is deprecated.

**Non‑Functional Requirements:**
- **Performance:** Template list loads within 500 ms; previews load within 1 second.  
- **Scalability:** Support adding new templates without code changes (configuration driven).  
- **Security:** Templates may include sensitive design elements; restrict editing to Admins.  
- **Accessibility:** Template cards and previews keyboard navigable; alt text for thumbnails.

**UI/UX Requirements:**
- **Card layout:** Soft Sand card backgrounds with Gold borders; display the template name, type, slide count and an image preview.  
- **Preview modal:** White background with radius‑lg; show sample slides and a description; use Teal Blue highlights.  
- **Selection indicator:** Selected template card has a Gold outline and a checkmark icon.

**Dependencies:**
- **Packages:** `packages/template-service` (new or existing), `packages/ui` (Card, Modal components).  
- **Other Features:** None.  
- **External Services:** None; templates stored in internal repo or S3.

---

### Feature 2: Document Generation & Data Synthesis

**Description:**  
Orchestrates the process of gathering facts, computing metrics, drafting narrative text and rendering charts and tables to build the selected document type.

**Functional Requirements:**
1. **Fact retrieval:** Query the Semantic Layer for all relevant facts (financial metrics, management bios, market data, risks) for the deal.  
2. **Narrative generation:** Use LLM prompts to draft narrative text for each section based on retrieved facts and template structure; include introductions and transitions.  
3. **Chart & table creation:** Generate charts (bar, line, pie) and tables for financials, market share, growth rates; compute calculations (CAGR, YoY growth) as needed.  
4. **Golden citation linking:** Attach citation metadata to each number, chart and statement; store as `CitationLink` entities referencing `ExtractedFact` or document excerpts.  
5. **Progress monitoring:** Expose generation status via a job ID; return updates on current step and percentage complete.  
6. **Error handling:** If generation fails due to missing data or model errors, return a descriptive error and allow retry.

**Non‑Functional Requirements:**
- **Performance:** Generate a 20‑slide deck within 30 seconds p95; LOI and memos within 20 seconds.  
- **Scalability:** Support concurrent generation requests; queue jobs and process asynchronously.  
- **Security:** Generation uses internal data only; models do not train on user data; ensure no leakage between tenants.  
- **Accuracy:** Narrative and charts must reflect the latest facts; include confidence scores where applicable.

**UI/UX Requirements:**
- **Progress bar:** Show step names (Gathering Facts, Drafting, Embedding Citations, Rendering) with Gold progress indicator and percentage.  
- **Error states:** Use Teal Blue callouts to display error messages; provide retry options.  
- **Charts & tables:** Use chart components from `@trato-hive/ui`; ensure colours match design palette (Gold accents, Teal Blue highlights).  
- **Narrative text:** Use Inter font for body, Lora for headings; allow inline editing in preview.

**Dependencies:**
- **Packages:** `packages/semantic-layer` (facts), `packages/ai-core` (LLMs), `packages/agents` (Generator Agent orchestrating tasks), `packages/ui` (chart and table components).  
- **Other Features:** Reads facts from Diligence and Deals; writes generated documents to Document service; triggers tasks in Command Center (e.g. “Review deck”).  
- **External Services:** None; generation uses internal models.

---

### Feature 3: Golden Citation & Verification

**Description:**  
Implements the citation‑first principle within generated documents; ensures every fact, figure and statement links back to the source with a high confidence score.

**Functional Requirements:**
1. **Citation data model:** For each generated element (chart, table cell, narrative sentence), create a `CitationLink` object referencing the `ExtractedFact` or document excerpt; include page number and excerpt.  
2. **Rendering:** Display small superscript numbers (Gold or Teal Blue) next to each fact; these numbers act as citation anchors.  
3. **Modal:** When clicked, open a modal showing the source document name, page number and highlighted excerpt; allow navigation to full document.  
4. **Confidence:** Include a confidence score (0–1); if below a threshold, highlight the citation in Warning Orange and prompt users to verify.  
5. **Export:** Embed citation metadata in the exported file (e.g. as custom XML in PPTX/Docx) so that citations persist outside the platform.

**Non‑Functional Requirements:**
- **Performance:** Opening a citation modal must load within 200 ms【516335038796236†L90-L99】.  
- **Accessibility:** Numbers must be keyboard focusable; modals trap focus and are screen reader friendly.  
- **Security:** Citations should not expose confidential information beyond the excerpt; enforce row‑level security.  
- **Reliability:** Maintain citation links when users edit or reorder slides.

**UI/UX Requirements:**
- **Citation styling:** Use Teal Blue for numbers by default; underline on hover; change to Gold when selected.  
- **Modal design:** White panel with Soft Sand overlay, radius‑lg, shadow‑xl; display excerpt with yellow highlight; provide a button to open the full document (if permitted).  
- **Confidence indicator:** Use a small bar or colour coding to show confidence; red if low (<0.6), yellow if medium (<0.8), teal if high.  
- **Number ordering:** Automatically order citations in the order they appear in the document.

**Dependencies:**
- **Packages:** `packages/semantic-layer` (citation data), `packages/ui` (CitationModal), `packages/data-plane` (documents).  
- **Other Features:** Integrates with Diligence to retrieve document excerpts; interacts with Deals to update fact sheets if a fact changes.  
- **External Services:** None; citations rely on internal documents.

---

### Feature 4: Preview, Editing & Export

**Description:**  
Provides a rich preview interface for generated documents, enabling inline editing, slide rearrangement, and export as PowerPoint or Word with citation metadata.

**Functional Requirements:**
1. **Slide preview:** Render slides/sections in a scrollable viewer; support thumbnails for quick navigation.  
2. **Inline editing:** Allow users to edit text boxes and chart values; validate edits against the Semantic Layer; update citations automatically.  
3. **Reordering:** Enable drag‑and‑drop to reorder slides/sections; persist order.  
4. **Save draft:** Allow saving drafts without exporting; store in database with status `draft`.  
5. **Export:** Convert the internal representation to PPTX (for decks) or DOCX (for LOIs/memos); embed citation metadata; provide download link.

**Non‑Functional Requirements:**
- **Performance:** Editing operations should be instantaneous; exporting should complete within 10 seconds for standard documents.  
- **Scalability:** Support documents up to 100 slides or 10 sections.  
- **Security:** Only authorized users may edit and export; apply firmId filtering.  
- **Accessibility:** Editor must be keyboard navigable; provide ARIA labels for drag handles.

**UI/UX Requirements:**
- **Viewer:** Soft Sand background; slide canvas with White background and Gold page outline; show page number and citations.  
- **Toolbar:** Provide actions (save, undo, redo, export); use Teal Blue icons; disable export until all required fields populated.  
- **Drag handles:** Use subtle handles for reordering; highlight drop targets in Teal Light.  
- **Notifications:** Toasts for save success, export completion or errors.

**Dependencies:**
- **Packages:** `packages/ui` (DocumentViewer, Editor components), `packages/template-service`, `packages/semantic-layer`, `packages/ai-core`.  
- **Other Features:** Saves generated documents to Document service; tasks created in Command Center for review.  
- **External Services:** None.

---

## 6. Data Model & Architecture

### Data Entities

**GeneratedDocument**
```typescript
interface GeneratedDocument {
  id: string
  dealId: string
  type: 'ic_deck' | 'loi' | 'memo'
  templateId: string
  status: 'draft' | 'generating' | 'ready' | 'error'
  version: number
  fileUrl?: string
  createdAt: Date
  updatedAt: Date
}
```

**CitationLink**
```typescript
interface CitationLink {
  id: string
  generatedDocumentId: string
  elementId: string // slide number or section id
  factId?: string
  sourceId?: string
  pageNumber?: number
  excerpt?: string
  confidence: number
  createdAt: Date
}
```

**Template**
```typescript
interface Template {
  id: string
  name: string
  type: 'ic_deck' | 'loi' | 'memo'
  slides: SlideDefinition[]
  createdAt: Date
  updatedAt: Date
}
```

**SlideDefinition**
```typescript
interface SlideDefinition {
  id: string
  title: string
  layout: string
  placeholders: PlaceholderDefinition[]
}
```

**PlaceholderDefinition**
```typescript
interface PlaceholderDefinition {
  id: string
  type: 'text' | 'chart' | 'table' | 'image'
  dataBinding: string // e.g. fact key or narrative section
}
```

### Architecture Layers

**7‑Layer Architecture Integration:**
- **Layer 1 (Data Plane):** Stores generated documents (files) in S3 or equivalent; manages file downloads.  
- **Layer 2 (Semantic Layer):** Supplies facts, metrics, clauses and narrative content; updates facts when edits occur.  
- **Layer 3 (TIC Core):** Generates narrative text using prompts; ensures logical flow.  
- **Layer 4 (Agentic Layer):** Orchestrates the generation workflow via the Generator Agent; handles progress tracking and error handling.  
- **Layer 5 (Experience Layer):** Provides UI for template selection, progress display, preview/edit and export; built with React/Next.js.  
- **Layer 6 (Governance Layer):** Enforces authentication, authorization and audit logging; ensures row‑level security.  
- **Layer 7 (API Layer):** Exposes endpoints for generation, preview, editing and download.

### Data Ownership
- **Owns:** GeneratedDocument, CitationLink, Template and version history.  
- **Reads:** Facts from Semantic Layer, templates from Template service, documents from Data Plane.  
- **Writes:** Generated documents to Data Plane; citation links to Semantic Layer.

---

## 7. API Specification

### Endpoints

**Generate Document** – `POST /api/v1/deals/:id/generate/{type}`

**Description:** Initiate generation of an IC deck, LOI or memo for a deal using a selected template.

**Authentication:** Required  
**Authorization:** Roles allowed: Manager, Analyst, Legal Counsel (for LOIs)  
**Request:**
```typescript
{
  templateId: string
}
```
**Response (202):**
```typescript
{
  data: {
    generatedDocumentId: string,
    status: 'generating'
  }
}
```

**Check Generation Status** – `GET /api/v1/deals/:id/generate/status?docId={generatedDocumentId}`

**Description:** Retrieve the current status and progress of a generation job.

**Authentication:** Required  
**Authorization:** Roles allowed: Manager, Analyst, Legal Counsel, Viewer  
**Response (200):**
```typescript
{
  data: {
    status: 'generating' | 'ready' | 'error',
    progress: number,
    message?: string
  }
}
```

**Preview Generated Document** – `GET /api/v1/deals/:id/generate/preview?docId={generatedDocumentId}`

**Description:** Retrieve the internal representation of the generated document for preview and editing.

**Authentication:** Required  
**Authorization:** Roles allowed: Manager, Analyst, Legal Counsel, Viewer  
**Response (200):**
```typescript
{
  data: {
    document: GeneratedDocument,
    slides: Slide[],
    citations: CitationLink[]
  }
}
```

**Save Draft / Edit Document** – `PATCH /api/v1/deals/:id/generate/{docId}`

**Description:** Save edits made to the generated document (text changes, chart updates, reorder slides).

**Authentication:** Required  
**Authorization:** Roles allowed: Manager, Analyst, Legal Counsel  
**Request:**
```typescript
{
  slides: UpdatedSlide[],
  citations?: UpdatedCitationLink[],
  version: number
}
```
**Response (200):**
```typescript
{
  data: GeneratedDocument
}
```

**Download Document** – `POST /api/v1/deals/:id/generate/download`

**Description:** Generate and download the final document as a PPTX or DOCX with embedded citation metadata.

**Authentication:** Required  
**Authorization:** Roles allowed: Manager, Analyst, Legal Counsel, Viewer  
**Request:**
```typescript
{
  docId: string
}
```
**Response (200):**
```typescript
{
  data: {
    fileUrl: string
  }
}
```

### Validation & Rate Limiting
- Validate that templateId exists and belongs to the correct document type.  
- Ensure users have permission for the document type (e.g. only Legal Counsel may draft LOIs).  
- Rate limit generation requests to prevent abuse (e.g. 10 generation jobs per user per day).  
- Validate version numbers on edits to prevent conflicts.

---

## 8. Testing & Acceptance Criteria

### Unit Testing Requirements
- ≥80 % coverage for template selection, data retrieval, citation linking and export functions.  
- Test narrative generation prompts and ensure proper fallback when data is missing.  
- Validate that citations attach correctly to each generated element and persist through edits.  
- Test version control and concurrency handling for edits.

### Integration Testing Requirements
- End‑to‑end tests for generation of each document type (deck, LOI, memo) including progress reporting, preview, editing and export.  
- Validate that edits update citations and facts correctly; test export downloads.  
- Mock LLM responses and ensure outputs match expected patterns.  
- Test API permissions and role checks.

### E2E Testing Requirements (User Flows)
- [ ] User selects a template → generates an IC deck → previews → edits → exports as PPTX → citations open in modal.  
- [ ] Legal counsel generates an LOI → reviews clauses → modifies language → exports; citations remain valid.  
- [ ] User generates a memo → summarises investment thesis → downloads as Word; verifies narrative accuracy.  
- [ ] Concurrent edits on a draft deck resolve correctly (version conflicts detected).

### Acceptance Criteria (Checklist)

**Functional:**
- [ ] Template library displays available templates; users can preview and select.  
- [ ] Generation produces complete decks, LOIs and memos with appropriate sections and slides.  
- [ ] Golden citations appear next to every fact and link to the correct source.  
- [ ] Users can edit content and reorder slides; changes persist.  
- [ ] Exported files download successfully with embedded citation metadata.  
- [ ] Version history maintained; edits do not overwrite previous versions.

**Non‑Functional:**
- [ ] Generation times meet performance targets (<30 s for decks).  
- [ ] Citation modals load <200 ms.  
- [ ] All operations adhere to security and compliance requirements (encryption, role checks).  
- [ ] Accessibility: Keyboard navigation, screen reader labels, colour contrast adherence.  
- [ ] Testing: >80 % unit test coverage; integration and E2E tests pass.

**Design:**
- [ ] Templates and generated slides use The Intelligent Hive design palette (Soft Sand backgrounds, Gold accents, Charcoal Black text, Teal Blue citations).  
- [ ] Typography follows Lora for headings and Inter for body.  
- [ ] Minimum 8 px border‑radius on cards and modals.  
- [ ] Charts use Gold and Teal colour palette; tables are legible.  
- [ ] Citation styling matches spec (Teal Blue with underline; hover effect).

**Documentation:**
- [ ] All API endpoints documented.  
- [ ] Template library documented with guidelines.  
- [ ] User guides for editing and exporting.  
- [ ] CHANGELOG updated; glossary updated.

---

## 9. Design Specifications

### The Intelligent Hive Integration

**Colour Usage:**
- **Soft Sand (`#F5EFE7`):** Use as slide backgrounds, preview panel backgrounds and template cards.  
- **Gold/Honey (`#E2A74A`):** Use for progress bars, citation numbers (when selected), primary buttons and chart accents.  
- **Charcoal Black (`#1A1A1A`):** Use for primary text and headings.  
- **Teal Blue (`#2F7E8A`):** Use for citation numbers, links and highlights【516335038796236†L13-L17】.

**Typography:**
- Headings in generated slides use Lora (bold or semibold), sizes 32–18 px depending on hierarchy.  
- Body text uses Inter at 14–16 px; footnotes use Inter at 12 px.  
- Maintain consistent spacing (8 px grid) and line heights【861078381458516†L85-L97】.

**Components:**
- **Template cards & modals:** Use card and modal components from `@trato-hive/ui`.  
- **Progress bar:** Use progress component with labels; animate transitions.  
- **Viewer & editor:** Use `DocumentViewer` and `RichTextEditor` components; integrate drag‑and‑drop library for slide ordering.  
- **Citation modal:** Use `CitationModal` with radius‑lg; include copy button to copy citation.  
- **Export button:** Primary Gold button; disable while generation in progress.

**Citation‑First Principle:**
- Render all numbers and statements with a `VerifiableNumber` or `CitationLink` component.  
- Citation numbers are superscript, Teal Blue and underlined; they become Gold on hover.  
- Clicking opens a modal showing document name, page and highlighted excerpt; modal loads under 200 ms【516335038796236†L90-L99】.

**Wireframes / Mockups:**
- Figma designs will include the template selection screen, generation progress screen, preview/editor and citation modal.  
- Provide dark mode variations if applicable.  
- Show mobile breakpoints with stacked layouts and simplified editing controls.

---

## 10. Security & Compliance

### Authentication & Authorization
- **Authentication Required:** Yes; JWT tokens for all endpoints.  
- **Roles Allowed:** Only Manager, Analyst and Legal Counsel can generate documents; Viewers can preview and download.  
- **Row‑Level Security:** Ensure users only access documents belonging to their firm (check firmId on generation and retrieval).

### Data Privacy
- **PII Handling:** Generated documents may include sensitive information (names, addresses); enforce encryption at rest and limit distribution.  
- **GDPR Compliance:** Support deletion of generated documents upon request; include the ability to export citation logs.  
- **No Model Training:** LLMs used for generation do not train on customer data; only transient retrieval is used.  
- **Encryption:** Use AES‑256 at rest and TLS 1.3 in transit.  
- **Limited External Exposure:** Do not include external data sources in MVP; only use internal data to avoid privacy issues.

### Audit Logging
- Log document generation, edits, downloads and deletions; include userId, firmId, docId and timestamps.  
- Retain logs for auditing and compliance checks.

### Security Considerations
- Validate all inputs (templateId, docId, edits) via Zod schemas.  
- Use parameterised queries to prevent SQL injection.  
- Escape user‑edited content when rendering to avoid XSS.  
- Restrict file downloads to authenticated sessions; sign URLs with expiry.  
- Rate limit generation and export endpoints to prevent abuse.

---

## 11. Performance Requirements

### Response Times
- **Generation:** Decks should generate within 30 seconds p95; LOIs and memos within 20 seconds.  
- **Preview & editing:** Slides load within 500 ms; editing changes apply instantly.  
- **Export:** Final file generation and download begins within 10 seconds.  
- **Citation modal:** Opens within 200 ms with excerpt loaded.

### Scalability
- Support simultaneous generation of up to 20 documents per firm without degradation.  
- Use asynchronous job processing; queue jobs and scale workers horizontally.  
- Cache generated narrative templates for reuse; store extracted facts to reduce repeated retrieval.

### Optimization Strategies
- Precompute and cache frequently used metrics and facts.  
- Use incremental rendering for preview; load slides in batches.  
- Compress exported files to reduce size; stream file download.  
- Defer heavy chart computations to the client if possible (render via JavaScript on preview); compute server‑side for export.

---

## 12. Risks & Mitigations

### Technical Risks

**Risk 1: Inaccurate or irrelevant narrative generation**  
- **Impact:** Medium  
- **Likelihood:** Medium  
- **Mitigation:** Develop robust prompts with context; include fallback heuristics; require human review; display confidence scores.

**Risk 2: Citation mismatch after edits**  
- **Impact:** High  
- **Likelihood:** Medium  
- **Mitigation:** Track element IDs and update citations when content changes; validate citations before export; provide warning if citation cannot be updated.

**Risk 3: Long generation times under heavy load**  
- **Impact:** Medium  
- **Likelihood:** Medium  
- **Mitigation:** Use job queue with auto‑scaling workers; monitor performance; set timeouts and gracefully handle delays.

### Business Risks

**Risk 1: User distrust of AI‑generated narratives**  
- **Impact:** Medium  
- **Mitigation:** Provide clear indication that narrative is AI‑drafted; encourage edits; embed citations to build trust; collect feedback to improve prompts.

**Risk 2: Template rigidity limiting adoption**  
- **Impact:** Low  
- **Mitigation:** Offer multiple templates; allow rearranging slides and editing content; gather feedback for future template customization features.

**Risk 3: Cost of external data sources**  
- **Impact:** Low (for MVP)  
- **Mitigation:** Avoid external integrations in MVP; evaluate cost/benefit before adding optional connectors.

### Open Questions
- [ ] **Question 1:** Should we support generation of additional document types (e.g. Investment Thesis decks, buyer profiles) in future versions?  
  - **Status:** Open  
  - **Decision:** TBD (based on user demand and resource availability).  
- [ ] **Question 2:** How should we prioritise integration with external datasets (market data, comps) given cost constraints?  
  - **Status:** Open  
  - **Decision:** TBD (conduct cost analysis and user research).

---

## 13. Dependencies & Integrations

### Internal Dependencies
- **Packages:** `packages/semantic-layer` (facts), `packages/ai-core` (LLM prompts), `packages/template-service`, `packages/ui`, `packages/agents`, `packages/data-plane` (storage), `packages/auth`.  
- **Other Features:** Requires Diligence module for document excerpts and risk analysis; integrates with Deals to update fact sheets; interacts with Command Center for task creation.  
- **Database:** Uses Postgres for metadata; uses S3 or similar for file storage.

### External Dependencies
- **APIs/Services:** None in MVP; optional integrations with market data providers or news feeds may be added later.  
- **Third‑Party Libraries:** `pptxgenjs` for PowerPoint generation; `docx` for Word output; `chart.js` or similar for chart rendering.

---

## 14. Rollout Plan

### Phase 1: Alpha (Internal Testing)
- **Timeline:** 4 weeks  
- **Scope:** Implement template library, basic IC deck generation (financials, overview sections) and citation linking; preview and editing limited to text edits.  
- **Users:** Internal teams.  
- **Success Criteria:** Deck generation completes; citations link to correct sources; users can edit and export decks.

### Phase 2: Beta (Limited Release)
- **Timeline:** 4 weeks  
- **Scope:** Add LOI and memo generation; support charts and tables; implement progress monitoring and version control; enable slide reordering and editing of numeric values.  
- **Users:** Selected firms.  
- **Success Criteria:** Users generate and customise decks/LOIs/memos; citation integrity maintained after edits; positive feedback on time savings.

### Phase 3: General Availability
- **Timeline:** 6 weeks after Beta  
- **Scope:** Refine narrative generation, add advanced templates, implement confidence indicators for citations; integrate with Command Center to create tasks for review; consider optional external data connectors.  
- **Users:** All customers.  
- **Success Criteria:** Adoption across ≥70 % of deals; 30 % reduction in time spent creating materials; high user satisfaction.

### Rollback Plan
If generation issues cause corrupted files or inaccurate content, disable the Generator module temporarily; revert to previous manual processes; notify users; fix underlying issues and redeploy.

---

## 15. Success Metrics & KPIs

### User Adoption Metrics
- **Documents Generated:** Number of decks/LOIs/memos generated per month (target: ≥2 per active deal).  
- **Edit Engagement:** Percentage of generated documents edited before export (target: >50 %, indicating active use).  
- **Repeat Usage:** Number of users generating documents again after initial try (target: >70 %).

### Performance Metrics
- **Generation Time:** p95 latency for deck generation (<30 s); LOI/memo generation (<20 s).  
- **Export Success Rate:** Percentage of export jobs that complete without error (>99 %).  
- **Citation Accuracy:** Percentage of citations that link to the correct source (>99 %).

### Quality Metrics
- **User Rating:** Average user rating of generated documents (target: ≥4/5).  
- **Narrative Relevance:** Percentage of narrative sections rated relevant by users (>90 %).  
- **Error Rate:** Rate of generation errors or incomplete documents (<2 %).  
- **Template Usefulness:** Rate of template selection across different document types; feedback for improvement.

### Business Metrics
- **Time Savings:** Reduction in average time spent preparing IC decks and LOIs (target: 50 % reduction).  
- **Deal Velocity:** Impact on deal cycle time (target: 15 % reduction).  
- **Upsell & Retention:** Increased adoption of Trato Hive due to Generator module (target: +10 % net revenue retention).

---

## 16. Appendix

### Glossary
- **IC Deck:** Investment Committee deck, a slide presentation summarising the deal for approval.  
- **LOI:** Letter of Intent, a preliminary agreement outlining the terms of a proposed deal.  
- **Memo:** A written document summarising analysis, risks and rationale for an investment.  
- **Golden Citation:** A design pattern where every number or statement is hyperlinked to the original source document with confidence metadata.  
- **Template:** A pre‑defined structure for a document type (slides or sections) including layouts and placeholders.

### References
- Trato Hive Product & Design Specification Section 4, Module 5 (lines 162‑181) for core requirements.  
- External AI platforms (Hebbia, Rogo, Model ML) demonstrating automated document synthesis and citations【32184628154010†L160-L190】【248476347016084†L74-L176】.  
- The Intelligent Hive design system guidelines【516335038796236†L13-L17】【861078381458516†L85-L97】.  
- Golden citation implementation guidelines from Deals module PRD.  

### Revision History
| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2025-11-12 | 0.1 | Product & Engineering Teams | Initial draft using internal specs and external research; avoided external data integrations |

---

**End of PRD**