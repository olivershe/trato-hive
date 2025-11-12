# PRD: Diligence Module (Module 4)

**Status:** Draft  
**Last Updated:** 2025-11-12  
**Owner:** Product & Engineering Teams  
**Priority:** High

---

## 1. Problem Statement

Due diligence is the most resource‑intensive phase of an M&A transaction. Analysts are tasked with reading and summarising hundreds of contracts, financial statements, HR policies and compliance certificates. Traditional virtual data rooms (VDRs) act as passive file vaults; they offer secure storage and permissions management but do little to reduce the manual burden of review. Deal teams must search documents one by one for key clauses or figures, answer the same questions repeatedly, and rely on lawyers and consultants to flag risks. This slows deals and increases costs【156822256992488†L45-L60】.

Modern AI‑powered VDRs show what’s possible: they automatically categorise and structure uploaded files, extract key data points, detect non‑standard clauses and generate high‑quality summaries【156822256992488†L161-L176】. AI can answer natural‑language questions by searching across all documents and returning answers with source citations【156822256992488†L184-L193】. Platforms like Imprima offer **Smart Q&A**, which pinpoints relevant documents, highlights supporting paragraphs and drafts answers; they also provide **Smart Summaries**, **AI‑powered indexes** and **contract review** tools to find red flags【407830420033055†L117-L190】. Despite these advances, there is no unified M&A CRM that combines VDR ingestion, automated Q&A, risk flagging and document synthesis within a single workflow.

**Current State:**
- Analysts manually upload documents to third‑party VDRs and rely on folder structures; classification and tagging are manual and error‑prone.  
- There is no automatic extraction of key data points or generation of summaries; users read documents page by page.  
- Q&A processes are handled via spreadsheets or email; questions are answered by humans without reusing prior answers; similar questions are answered multiple times.  
- Risk assessment requires lawyers to review contracts for non‑standard clauses; there is no automated red‑flag detection【156822256992488†L167-L182】.  
- Existing CRMs treat diligence as a separate tool; analysts cannot see how document insights tie into the pipeline or next steps.  
- AI features, if present, are bolt‑ons; there is no citation‑first output or unified fact layer.

**Desired State:**
The Diligence module will transform the static data room into an **AI‑native VDR** fully integrated with Trato Hive’s workflow. Analysts should be able to drag and drop entire data rooms; the system will perform OCR, index documents, classify them by type and extract key facts. Every fact will be stored in the Semantic Layer and surfaced with citations【407830420033055†L117-L190】.  
Users will submit natural‑language questions (“Which contracts lack a change‑of‑control clause?” or “What was net revenue in 2022?”); the system will search the entire corpus and draft answers using retrieval‑augmented generation, complete with citations and confidence scores【156822256992488†L184-L193】. It will detect similar questions and suggest reusing existing answers to avoid duplication.  
AI algorithms will continuously scan documents for non‑standard clauses, inconsistencies or compliance risks and surface them in a risk panel with severity levels【156822256992488†L176-L182】. Documents will also be summarised into structured Word/Excel outputs automatically【407830420033055†L155-L163】. The module will integrate with the Deals module by updating fact sheets and next‑step suggestions based on diligence outcomes.

---

## 2. Goals & Non‑Goals

### Goals (What we **will** deliver)
1. **Smart VDR ingestion & indexing:** Accept drag‑and‑drop uploads of large document sets; perform OCR, detect language, classify files by type (e.g. SPA, NDA, financial statement); extract metadata and store them in the Semantic Layer【407830420033055†L168-L176】.  
2. **Automated Q&A:** Provide a Q&A interface that accepts natural‑language questions, retrieves relevant text via retrieval‑augmented generation and drafts answers with citations; detect similar questions and suggest existing answers【407830420033055†L117-L130】.  
3. **Risk flagging & red‑alert summaries:** Use AI to scan documents for non‑standard clauses, inconsistencies or anomalies (e.g. unusual indemnity clauses, missing compliance certificates) and display them in a risk panel with severity scores【156822256992488†L176-L182】.  
4. **Smart document summaries & extraction:** Automatically summarise long documents into concise bullet points and extract key data into structured Word/Excel formats, supporting multiple languages【407830420033055†L155-L163】.  
5. **Citation‑first outputs:** Ensure all AI‑generated answers, summaries and extracted data link back to the exact source page with confidence scores.  
6. **Integration with pipeline & tasks:** Propagate extracted facts and risk flags to the Deals module and Command Center; generate tasks based on outstanding Q&A items and flagged risks.

### Non‑Goals (Out of scope for this version)
1. Automated negotiation or drafting of definitive agreements; generation of LOIs and IC decks is handled by the Generator module.  
2. Full vendor due diligence features such as clean rooms; this module focuses on buy‑side due diligence.  
3. Real‑time collaboration editing of documents (e.g. contract markup); documents are read‑only.  
4. Building separate AI models; instead we leverage third‑party AI services via the AI Core.

---

## 3. User Stories

### Primary User Personas
- **Diligence Analyst:** Reviews data room documents, answers investor questions and identifies risks. Needs tools to ingest documents quickly, find answers and ensure compliance.  
- **Legal Counsel:** Focuses on contract clauses, compliance and regulatory issues. Needs to see flagged risks, review AI‑generated summaries and approve final answers.  
- **M&A Associate:** Oversees deals and coordinates with diligence teams. Needs high‑level status, summaries and risk indicators to inform pipeline progression.  
- **Investment Committee Member:** Requires concise summaries and assurance that the numbers and statements are verified. Needs to drill into citations when necessary.

### User Stories (Format: As a [user], I want to [action], so that [benefit])

**Epic 1: Smart Ingestion & Indexing**
- *As a Diligence Analyst, I want to drag and drop a folder of documents into the VDR, so that all files are uploaded, OCR’d and indexed automatically without manual renaming or classification.*  
- *As a Diligence Analyst, I want the system to detect document types (e.g. SPA, NDA) and language, so that I can navigate the data room by category and ensure nothing is misplaced【407830420033055†L168-L176】.*  
- *As a Legal Counsel, I want to see metadata (parties, dates, governing law) extracted automatically from contracts, so that I spend less time on data entry and more on analysis.*

**Epic 2: Automated Q&A & Similarity Detection**
- *As a Diligence Analyst, I want to submit questions like “What are the top five customers by revenue?” and receive AI‑drafted answers with citations, so that I can respond quickly and confidently【156822256992488†L184-L193】.*  
- *As a Diligence Analyst, I want the system to alert me when a question is similar to a previously answered question, so that I can reuse existing answers and avoid duplicate work【407830420033055†L117-L130】.*  
- *As a Diligence Analyst, I want to edit or approve AI‑drafted answers before they are shared with buyers, so that I maintain control over the final output.*

**Epic 3: Risk Flagging & Summaries**
- *As a Legal Counsel, I want the system to highlight non‑standard clauses (e.g. unusual indemnities, change‑of‑control provisions) and provide context, so that I can focus my review on potential red flags【156822256992488†L176-L182】.*  
- *As a Diligence Analyst, I want an overview of all flagged risks sorted by severity, so that I can prioritise which documents to review first.*  
- *As an M&A Associate, I want to receive notifications when high‑severity risks are detected, so that I can adjust deal strategy accordingly.*

**Epic 4: Document Summaries & Structured Outputs**
- *As a Diligence Analyst, I want to generate concise summaries of lengthy documents (e.g. 300‑page financial reports) into key bullet points, so that I can understand the essence without reading every page【156822256992488†L167-L174】.*  
- *As a Legal Counsel, I want to export extracted data (e.g. clause lists, lease terms, financial metrics) to Word or Excel, so that I can integrate them into our diligence models and memos【407830420033055†L155-L163】.*  
- *As an Investment Committee Member, I want to view high‑level summaries and KPIs in the Deal 360° view, so that I can make faster decisions without losing traceability.*

---

## 4. User Experience (UX Flow)

### Entry Point
Users access the Diligence module via the **“Diligence”** tab in the global navigation or through the Diligence tab within a deal’s 360° view. The entry screen displays an upload area and a list of previously uploaded VDRs. If no documents are present, an empty state encourages users to drag and drop files.

### Main User Flow (Step‑by‑Step)
1. **User Action:** Upload documents via drag‑and‑drop or file picker.  
   - **System Response:** Files are uploaded to the Data Plane; OCR and language detection run in the background; the UI displays a progress bar.  
   - **UI State:** Cards show upload status; once processed, documents appear with icons representing their type (PDF, Excel, etc.).
2. **User Action:** Navigate to the Q&A interface and submit a question.  
   - **System Response:** The system checks for similar questions; if found, it surfaces the prior answer and cites the sources. Otherwise, it searches the Semantic Layer and runs retrieval‑augmented generation to draft a new answer with citations.  
   - **UI State:** A response card appears with the draft answer highlighted in Teal Blue and a `[cite]` link; users can edit, approve or reject the answer.
3. **User Action:** View the risk panel.  
   - **System Response:** AI models scan documents for non‑standard clauses and anomalies; results are categorised by risk type and severity.  
   - **UI State:** A panel lists risks with icons (Warning Orange, Error Red) and collapsible sections; clicking an item opens the associated document with the clause highlighted.
4. **User Action:** Generate summaries or exports.  
   - **System Response:** Summarisation algorithms produce bullet‑point summaries and structured data outputs; files are available for download.  
   - **UI State:** Summaries display in cards with Soft Sand backgrounds; download buttons use Gold accents.
5. **User Action:** Switch back to the Deal 360° view.  
   - **System Response:** The fact sheet and next steps update based on newly extracted facts and risks.  
   - **UI State:** Updated KPIs appear with Teal Blue hyperlinks; tasks reflect outstanding diligence actions.

### Exit Points
- Users can return to the Command Center or Deals module at any time; the system preserves upload and Q&A state.  
- Documents and summaries can be exported or shared with third‑party advisors via secure links.

### Edge Cases
- **Large uploads:** For very large data rooms (>10 GB), show an estimate of processing time and allow background processing with email notifications when complete.  
- **Unsupported languages:** If OCR detects an unsupported language, display a warning and skip summarisation.  
- **Sensitive content:** If redaction is required (e.g., PII), prompt users to run the redaction tool before sharing.  
- **Access restrictions:** Users without the appropriate role cannot view certain documents; the UI hides sensitive files and prompts them to request permission.

---

## 5. Features & Requirements

### Feature 1: Smart VDR Ingestion & Indexing

**Description:**  
Enables drag‑and‑drop upload of entire data rooms; automatically performs OCR, language detection, classification and indexing. Extracts metadata (document type, parties, dates, governing law) and stores the information in the Semantic Layer.【156822256992488†L161-L176】

**Functional Requirements:**
1. **Bulk upload:** Accept zipped folders or multiple files; process asynchronously and show progress indicators.  
2. **OCR & language detection:** Use AI services to convert scanned PDFs to text and detect language; store text for downstream processing.  
3. **Classification:** Classify documents into categories (e.g. SPA, NDA, financial statement, HR) using ML models; tag with metadata.  
4. **Metadata extraction:** Extract key fields (parties, dates, contract terms) using NLP and store them as facts in the Semantic Layer.  
5. **Version tracking:** Maintain version history if documents are replaced; highlight differences between versions.

**Non‑Functional Requirements:**
- **Performance:** Should ingest and process up to 10 GB of documents within a reasonable time (display progress; full indexing may take hours but initial metadata extraction must be available within minutes).  
- **Scalability:** Support hundreds of documents per deal and thousands per firm; processing pipelines must scale horizontally.  
- **Security:** All documents encrypted at rest and in transit; access controlled via firmId and role.  
- **Accessibility:** Upload area keyboard accessible; progress updates via ARIA live regions.

**UI/UX Requirements:**
- **Drag‑and‑drop zone:** Soft Sand background with dashed border; Gold icon and text prompting users to upload.  
- **Progress indicators:** Use Gold progress bars and Teal Blue status messages.  
- **Document list:** Display document name, type icon, upload date and status; allow sorting and filtering.  
- **Classification labels:** Show coloured chips for document type (e.g. teal for contracts, gold for finance).

**Dependencies:**
- **Packages:** `packages/data-plane` (upload and storage), `packages/semantic-layer` (metadata storage), `packages/ai-core` (OCR and classification services), `packages/ui` (upload components).  
- **Other Features:** Feeds extracted facts to Deals module; triggers tasks in Command Center.  
- **External Services:** OCR providers (Tesseract.js or AWS Textract), AI classification APIs, translation APIs for cross‑language support.

---

### Feature 2: Automated Q&A & Similarity Detection

**Description:**  
Provides a conversational interface for analysts to ask questions and receive AI‑drafted answers. Uses retrieval‑augmented generation to search across all documents, returns answers with citations and confidence scores, and detects similar questions to reuse existing answers【156822256992488†L184-L193】.

**Functional Requirements:**
1. **Submit question:** Analysts submit a text question; the system logs it with a unique ID and associated deal.  
2. **Similarity check:** Before generating a new answer, compute semantic similarity to existing questions; if above a threshold, display the previous answer and citations.  
3. **Answer generation:** If no similar answer exists, retrieve relevant document passages from the Semantic Layer and run an LLM to draft an answer; include citations (document ID, page number, excerpt) and confidence score.  
4. **Editing & approval:** Analysts can edit the draft answer; a Legal Counsel or designated approver must approve before it is finalised.  
5. **Audit trail:** Record all Q&A interactions, including edits, approvals and rejections.

**Non‑Functional Requirements:**
- **Performance:** Response time for similarity check and answer generation <5 seconds for typical questions; retrieval may be asynchronous for large corpora.  
- **Security:** Answers must be restricted to users with appropriate roles; personal data should not be exposed.  
- **Reliability:** Ensure citations match the source; maintain a high confidence threshold to avoid hallucinations.  
- **Compliance:** Store Q&A interactions in an audit log for traceability.

**UI/UX Requirements:**
- **Question input:** Text area with placeholder; Gold “Ask” button; support multi‑line input.  
- **Answer cards:** Display AI‑drafted answer in Teal Blue text; include `[cite]` links; show confidence as a percentage; provide buttons for “Edit,” “Approve” and “Reject.”  
- **Similarity alert:** If a similar question exists, display a banner with a link to the previous answer.  
- **History:** List past questions and answers with search and filtering.

**Dependencies:**
- **Packages:** `packages/semantic-layer` (document retrieval), `packages/ai-core` (LLM and similarity search), `packages/agents` (Diligence Agent orchestrating Q&A), `packages/ui` (Q&A components).  
- **Other Features:** Integrates with Deals module to update fact sheets and tasks; uses Generator module for exporting Q&A logs.  
- **External Services:** LLM providers for answer generation; vector database for semantic similarity.

---

### Feature 3: Risk Flagging & Red‑Alert Summaries

**Description:**  
Continuously scans all ingested documents to identify non‑standard clauses, inconsistencies and anomalies; surfaces these in a dedicated risk panel with severity levels and provides context to accelerate legal review【156822256992488†L176-L182】.

**Functional Requirements:**
1. **Clause extraction:** Parse contracts to identify specific clause types (indemnity, change‑of‑control, termination, confidentiality); use regex and ML models.  
2. **Deviation detection:** Compare extracted clauses to market norms or template clauses; flag deviations and assign severity scores.  
3. **Financial anomaly detection:** Identify inconsistent numbers across documents (e.g. revenue figures that don’t match across statements); flag for review.  
4. **Risk categorisation:** Group flagged items into categories (legal, financial, regulatory) and assign colour codes (orange, red, teal).  
5. **Notification & tasks:** Notify relevant users of high‑severity risks and create tasks in the Command Center.

**Non‑Functional Requirements:**
- **Performance:** Run scans incrementally as documents are ingested; risk panel updates within minutes.  
- **Security:** Risk data is sensitive; restrict access to authorized roles; encrypt underlying analytics.  
- **Accuracy:** Use training data and SME feedback to improve false positives/negatives; allow manual overrides.  
- **Explainability:** Provide context and reasoning for each flagged item to aid human judgment.

**UI/UX Requirements:**
- **Risk panel:** Card on the right side of the interface; Soft Sand background with Gold header; list items with icons indicating severity.  
- **Details fly‑out:** Clicking a risk opens a fly‑out with details (clause text, market norm, recommended action).  
- **Filters:** Allow filtering by risk category or severity; search bar to locate specific clauses.  
- **Icons:** Use Warning Orange for medium risks and Error Red for high risks.

**Dependencies:**
- **Packages:** `packages/semantic-layer` (fact storage), `packages/ai-core` (risk models), `packages/ui` (panel components).  
- **Other Features:** Interacts with Deals module to show risk status; triggers tasks in Command Center; may feed into Generator for risk summaries in IC decks.  
- **External Services:** Data sources for market norms and regulatory benchmarks; optional legal databases.

---

### Feature 4: Document Summaries & Structured Extraction

**Description:**  
Automatically summarises long documents into bullet points and extracts key fields into structured formats (Word/Excel), supporting multilingual documents【407830420033055†L155-L163】.

**Functional Requirements:**
1. **Summary generation:** For each document, generate a concise summary covering the purpose, parties, key terms and risks; output as bullet points.  
2. **Key field extraction:** Identify and extract data such as dates, amounts, parties, terms and obligations; structure them into a table for export.  
3. **Multilingual support:** Translate non‑English documents into English before summarisation; maintain original language text for reference.  
4. **Export formats:** Provide downloads in Word and Excel formats; include citations within the document for traceability.  
5. **Revision control:** When documents are updated, regenerate summaries and maintain version history.

**Non‑Functional Requirements:**
- **Performance:** Summaries should be ready within a few minutes for typical documents (≤50 pages); large documents may take longer but should not block other operations.  
- **Scalability:** Support summarisation of hundreds of documents concurrently.  
- **Accuracy:** Use best‑in‑class models and allow users to provide feedback to refine summary quality.  
- **Security:** Summaries may contain sensitive data; apply the same security controls as original documents.

**UI/UX Requirements:**
- **Summary cards:** Display summaries in Soft Sand cards with Teal Blue bullet icons; show last updated timestamp.  
- **Extraction tables:** Render extracted fields in a responsive table with sorting and filtering; provide export buttons.  
- **Language badges:** Indicate the source language and translation status on each document.  
- **Loading states:** Use skeleton loaders during generation; provide progress bars for longer operations.

**Dependencies:**
- **Packages:** `packages/ai-core` (summarisation and extraction services), `packages/data-plane` (document content), `packages/ui` (table and card components).  
- **Other Features:** Summaries feed into Generator module for IC decks and memos; extracted fields populate the Verifiable Fact Layer.  
- **External Services:** Translation APIs; summarisation models (LLM).  

---

## 6. Data Model & Architecture

### Data Entities

**Document**
```typescript
interface Document {
  id: string
  dealId: string
  name: string
  fileType: DocumentType // pdf | xlsx | docx | other
  language: string
  classification: string // spa | nda | financial_statement | hr | other
  storageUrl: string
  uploadedAt: Date
  processedAt?: Date
}
```

**ExtractedFact**
```typescript
interface ExtractedFact {
  id: string
  dealId: string
  documentId: string
  key: string // e.g. 'revenue_2022'
  value: string | number
  unit?: string
  pageNumber: number
  confidence: number // 0‑1
  createdAt: Date
  updatedAt: Date
}
```

**Question**
```typescript
interface Question {
  id: string
  dealId: string
  userId: string
  text: string
  similarityHash: string
  createdAt: Date
  updatedAt: Date
}
```

**Answer**
```typescript
interface Answer {
  id: string
  questionId: string
  responderId: string // system or user
  text: string
  citations: Citation[]
  confidence: number
  status: 'draft' | 'approved' | 'rejected'
  createdAt: Date
  updatedAt: Date
}
```

**RiskItem**
```typescript
interface RiskItem {
  id: string
  dealId: string
  documentId: string
  type: string // legal | financial | regulatory
  description: string
  severity: 'low' | 'medium' | 'high'
  citation: Citation
  createdAt: Date
  updatedAt: Date
}
```

### Architecture Layers

**7‑Layer Architecture Integration:**
- **Layer 1 (Data Plane):** Handles document uploads, storage (S3), OCR and language detection.  
- **Layer 2 (Semantic Layer):** Stores extracted facts, summaries and metadata; powers retrieval for Q&A and fact sheets.  
- **Layer 3 (TIC Core):** Uses LLMs to generate answers, summaries and risk classifications; performs similarity checks and extraction tasks.  
- **Layer 4 (Agentic Layer):** Orchestrates multi‑step workflows (ingestion, Q&A, risk detection, summarisation) through the Diligence Agent.  
- **Layer 5 (Experience Layer):** Next.js frontend & Express API; displays VDR UI, Q&A interface, risk panel and summary cards.  
- **Layer 6 (Governance Layer):** Enforces authentication, authorization and audit logging; ensures row‑level security based on firmId.  
- **Layer 7 (API Layer):** Exposes REST endpoints for uploads, Q&A, risk retrieval, summary exports and integration with other modules.

### Data Ownership
- **Owns:** Documents, ExtractedFacts, Questions, Answers, RiskItems and Summaries.  
- **Reads:** Reads deals, users and companies from the Deals and Discovery modules.  
- **Writes:** Updates facts and risk items that feed back into the Deals module and Generator.

---

## 7. API Specification

### Endpoints

**Upload VDR** – `POST /api/v1/deals/:id/vdr/upload`

**Description:** Upload one or more documents for a deal’s data room; returns processing status.

**Authentication:** Required  
**Authorization:** Roles allowed: Admin, Manager, Analyst  
**Request:**
```typescript
// Headers
Authorization: Bearer {token}
Content-Type: multipart/form-data

// Form Data
files: File[]
```
**Response (202 – Accepted):**
```typescript
{
  data: {
    uploadId: string,
    status: 'processing'
  }
}
```

**List Documents** – `GET /api/v1/deals/:id/vdr/documents`

**Description:** List all documents uploaded for a deal; supports pagination and filtering by type or status.

**Authentication:** Required  
**Authorization:** Roles allowed: Admin, Manager, Analyst, Viewer  
**Request:**
```typescript
GET /api/v1/deals/{id}/vdr/documents?page=1&limit=25&type=spa
```
**Response (200):**
```typescript
{
  data: Document[],
  meta: { page: number, limit: number, total: number }
}
```

**Submit Question** – `POST /api/v1/deals/:id/diligence/qa`

**Description:** Submit a natural‑language question; the system will return a draft answer or a similar existing answer.

**Authentication:** Required  
**Authorization:** Roles allowed: Analyst, Manager  
**Request:**
```typescript
{
  question: string
}
```
**Response (200):**
```typescript
{
  data: {
    questionId: string,
    answer: {
      text: string,
      citations: Citation[],
      confidence: number,
      reuse: boolean // true if reused existing answer
    }
  }
}
```

**List Q&A Items** – `GET /api/v1/deals/:id/diligence/qa`

**Description:** Retrieve all questions and their answers for a deal; supports pagination and filtering by status.

**Authentication:** Required  
**Authorization:** Roles allowed: Analyst, Manager, Viewer  
**Response (200):**
```typescript
{
  data: {
    questions: Question[],
    answers: Answer[]
  },
  meta: { page: number, limit: number, total: number }
}
```

**Approve/Edit Answer** – `PATCH /api/v1/deals/:id/diligence/qa/:qaId`

**Description:** Update an answer (edit text or change status to approved/rejected). Creates an audit record.

**Authentication:** Required  
**Authorization:** Roles allowed: Manager, Legal Counsel  
**Request:**
```typescript
{
  text?: string,
  status?: 'approved' | 'rejected'
}
```
**Response (200):**
```typescript
{
  data: Answer
}
```

**Get Risk Summary** – `GET /api/v1/deals/:id/diligence/risks`

**Description:** Retrieve all identified risk items for a deal; supports filtering by type or severity.

**Authentication:** Required  
**Authorization:** Roles allowed: Analyst, Manager, Legal Counsel, Viewer  
**Response (200):**
```typescript
{
  data: RiskItem[],
  meta: { page: number, limit: number, total: number }
}
```

**Generate Summaries** – `POST /api/v1/deals/:id/diligence/summaries`

**Description:** Generate summaries and structured extractions for selected documents; returns job status.

**Authentication:** Required  
**Authorization:** Roles allowed: Analyst, Manager  
**Request:**
```typescript
{
  documentIds: string[]
}
```
**Response (202):**
```typescript
{
  data: {
    jobId: string,
    status: 'processing'
  }
}
```

**Check Summary Job** – `GET /api/v1/deals/:id/diligence/summaries/:jobId`

**Description:** Check the status of a summarisation job and retrieve results when ready.

**Authentication:** Required  
**Authorization:** Roles allowed: Analyst, Manager, Legal Counsel, Viewer  
**Response (200):**
```typescript
{
  data: {
    jobId: string,
    status: 'processing' | 'ready' | 'error',
    summaries?: Summary[],
    extractionTables?: Table[]
  }
}
```

### Validation & Rate Limiting
- All inputs validated using Zod schemas; invalid requests return 400 with error details.  
- Rate limit endpoints at 60 requests per minute per user to prevent abuse.  
- File uploads limited to 15 GB per request.

---

## 8. Testing & Acceptance Criteria

### Unit Testing Requirements
- Achieve ≥80 % code coverage across services.  
- Test OCR, classification and extraction utilities with multilingual documents.  
- Verify similarity detection logic returns the correct existing question for near duplicates.  
- Test risk detection models against known templates and ensure correct flagging.  
- Validate summary generation outputs meet expected formats.

### Integration Testing Requirements
- End‑to‑end tests for upload → ingestion → Q&A → risk panel → summary generation flows.  
- Validate that extracted facts update the Deal 360° fact sheet.  
- Test authorization and firm isolation for all endpoints.  
- Mock external services (OCR, translation, LLM providers) to ensure predictable behaviour.

### E2E Testing Requirements (User Flows)
- [ ] Analyst uploads a data room → sees progress → receives indexed documents.  
- [ ] Analyst asks a question → system returns an answer with citations → user edits and approves.  
- [ ] Legal Counsel views risk panel → opens flagged clause → approves or overrides risk.  
- [ ] Analyst generates summaries → downloads Word/Excel with extracted fields.  
- [ ] KPIs and tasks in Deals module update when new facts or risks are added.

### Acceptance Criteria (Checklist)

**Functional:**
- [ ] Drag‑and‑drop upload with classification, OCR and indexing works for all supported formats.  
- [ ] Q&A system returns relevant answers with citations; similarity detection avoids duplicate answers.  
- [ ] Risk panel displays detected anomalies and allows navigation to source.  
- [ ] Summaries and extraction outputs are accurate and downloadable.  
- [ ] Extracted facts appear in the Deal 360° fact sheet.  
- [ ] Approvals and edits are logged and auditable.

**Non‑Functional:**
- [ ] Average response time <5 seconds for Q&A requests; <2 minutes for summary generation on standard documents.  
- [ ] SOC2 and GDPR compliance upheld: encrypted storage, audit logs, deletion on request.  
- [ ] Accessibility: keyboard navigation for all actions; screen reader labels for upload, Q&A and risk interfaces.  
- [ ] Testing: >80 % unit test coverage; integration and E2E tests pass.

**Design:**
- [ ] VDR UI uses Soft Sand backgrounds with Gold and Teal accents; components follow The Intelligent Hive design system.  
- [ ] Minimum 8 px border‑radius on cards and panels.  
- [ ] Citation links displayed in Teal Blue with underline; hover state uses Teal Light.  
- [ ] Risk severity colours follow design palette (Warning Orange, Error Red).  
- [ ] Summaries and extraction tables are responsive and legible.  
- [ ] Modal and fly‑out components follow radius‑lg and shadow‑xl standards.

**Documentation:**
- [ ] API endpoints documented with examples.  
- [ ] User guides for analysts and counsel included.  
- [ ] CHANGELOG updated.  
- [ ] Glossary of terms defined in appendix.

---

## 9. Design Specifications

### The Intelligent Hive Integration

**Color Usage:**
- **Soft Sand (`#F5EFE7`):** Primary background for upload zones, panels and summary cards.  
- **Gold/Honey (`#E2A74A`):** Used for buttons, progress bars and risk severity headers.  
- **Charcoal Black (`#1A1A1A`):** For primary text and headings.  
- **Teal Blue (`#2F7E8A`):** For links, AI‑generated text, icons and citation numbers【516335038796236†L13-L17】.

**Typography:**
- **Headings:** Lora (semibold) for H1–H3, sizes 36–24 px; H4 uses Inter.  
- **Body/UI:** Inter (regular) sizes 16 px for body text, 14 px for labels; 12 px for captions【861078381458516†L85-L97】.  
- Use semibold weight for labels and strong text; regular weight for paragraphs.

**Components:**
- **Upload:** Use `UploadZone` component with dashed outline and file preview chips.  
- **Q&A:** Use `QuestionForm`, `AnswerCard` and `HistoryList` components.  
- **Risk Panel:** Use `RiskCard` and `RiskFlyOut` components.  
- **Summary & Extraction:** Use `SummaryCard`, `ExtractionTable` and `DownloadButton` components.  
- **Modals:** Use `CitationModal` and `ExportModal` components; modals follow radius‑lg (12 px) and shadow‑xl guidelines.  
- All components imported from `@trato-hive/ui` and adhere to 8 px grid and design tokens.

**Citation‑First Principle:**
- All extracted facts, answer snippets and summary bullet points are rendered as `VerifiableNumber` or `CitationText` components.  
- Clicking a citation opens a modal showing the document name, page number and highlighted excerpt; the modal loads within 200 ms and traps focus for accessibility【516335038796236†L90-L99】.

**Wireframes / Mockups:**
- Detailed wireframes will be provided via Figma. Key screens include: upload page, Q&A interface, risk panel, summary list, extraction tables and the integration with Deal 360°. Each screen follows responsive breakpoints (mobile, tablet, desktop).

---

## 10. Security & Compliance

### Authentication & Authorization
- **Authentication Required:** All endpoints require JWT tokens issued via the Auth service.  
- **Roles Allowed:** Only Admin, Manager or Analyst may upload documents; Legal Counsel or Manager must approve answers; Viewers may read summaries and Q&A.  
- **Row‑Level Security:** Enforce firmId checks on all data access; restrict document and Q&A visibility based on user roles.

### Data Privacy
- **PII Handling:** Documents may contain personal data. Implement automatic redaction for names, addresses, social security numbers, etc., before sharing externally.  
- **GDPR Compliance:** Support the right to erasure by purging documents and associated extracted data; provide data export on request.  
- **Encryption:** Use AES‑256 for data at rest and TLS 1.3 for data in transit.  
- **Data Minimisation:** Store only necessary metadata; avoid persisting raw document content in logs or analytics.

### Audit Logging
- **Events to log:** Document uploads, deletions, Q&A submissions, answer approvals/rejections, risk flag detections, summary generations and downloads.  
- **Log format:** Follows the format defined in the root PRD (timestamp, userId, firmId, action, resourceId, metadata).  
- **Retention:** Audit logs retained for seven years or as per regulatory requirements.

### Security Considerations
- Input validation on all file uploads and API inputs; reject unsupported formats.  
- Use parameterised queries to prevent SQL injection.  
- Apply content security policies to prevent XSS in document previews.  
- Rate limit Q&A and summarisation endpoints to prevent abuse.  
- Perform regular penetration tests and vulnerability scans.

---

## 11. Performance Requirements

### Response Times
- **Uploads:** UI should display upload progress immediately; metadata extraction available within minutes; full indexing can run asynchronously.  
- **Q&A:** Similarity check and answer generation <5 seconds p95; answers should render as soon as retrieval completes.  
- **Risk Detection:** New risks should appear in the panel within 10 minutes of document ingestion.  
- **Summaries & Extraction:** Standard documents (<50 pages) summarised within 2 minutes; large documents (<300 pages) within 5 minutes.  
- **API Calls:** General CRUD endpoints respond in <500 ms p95.

### Scalability
- Support concurrent uploads of data rooms up to 15 GB each; queue processing tasks to maintain performance.  
- Design retrieval and similarity search to scale across millions of document embeddings; use sharded vector indexes if necessary.  
- Ensure Q&A and summarisation microservices auto‑scale based on load.  
- Cache frequently accessed summaries and answers.

### Optimization Strategies
- Use streaming OCR and incremental indexing to provide early results.  
- Cache similarity search results; implement LRU caching for repeated questions.  
- Parallelise risk scanning across document batches.  
- Use message queues (e.g. RabbitMQ) to decouple upload and processing pipelines.  
- Compress stored text to reduce storage footprint.

---

## 12. Risks & Mitigations

### Technical Risks

**Risk 1: Inaccurate extractions or hallucinated answers**  
- **Impact:** High  
- **Likelihood:** Medium  
- **Mitigation:** Use high‑quality LLMs and fine‑tune extraction models; incorporate human review before finalising answers; expose confidence scores; continuously retrain models with feedback【156822256992488†L184-L193】.

**Risk 2: Performance bottlenecks with large data rooms**  
- **Impact:** Medium  
- **Likelihood:** Medium  
- **Mitigation:** Implement streaming ingestion and incremental indexing; offload heavy processing to background workers; allow asynchronous notifications.

**Risk 3: Sensitive data leakage**  
- **Impact:** High  
- **Likelihood:** Low  
- **Mitigation:** Enforce strict role‑based access; automatic redaction for PII; encrypt all stored content; audit all downloads and share links.

### Business Risks

**Risk 1: Over‑reliance on AI without human oversight**  
- **Impact:** Medium  
- **Mitigation:** Always require human approval for answers and risk decisions; provide explainability and citations to build trust; train users on AI limitations.

**Risk 2: Adoption resistance**  
- **Impact:** Medium  
- **Mitigation:** Provide training and onboarding; highlight time saved; allow gradual adoption (use only ingestion or Q&A initially).

### Open Questions
- [ ] **Question 1:** Should the platform support uploading and processing video or audio files (e.g. management presentations)?  
  - **Status:** Open  
  - **Decision:** TBD (requires additional research on transcription and summarisation).  
- [ ] **Question 2:** How will custom clause templates be managed to determine deviations?  
  - **Status:** Open  
  - **Decision:** TBD (possible integration with legal knowledge bases).

---

## 13. Dependencies & Integrations

### Internal Dependencies
- **Packages:** `packages/data-plane` for uploads and storage; `packages/semantic-layer` for facts; `packages/ai-core` for OCR, summarisation and answer generation; `packages/agents` for orchestrating workflows; `packages/ui` for user interfaces; `packages/auth` for authentication.  
- **Other Features:** Interacts with Deals module to update fact sheets and pipeline stages; triggers tasks in Command Center; provides summaries and risk flags to Generator for IC deck creation.  
- **Database:** Relies on Postgres via Prisma; uses vector database (e.g. Pinecone) for semantic search.

### External Dependencies
- **APIs/Services:** OCR (AWS Textract or Google Vision); Translation (DeepL or Google Translate); LLM providers (OpenAI, Anthropic) via the AI Core; Legal clause databases for norm comparison; News and regulatory feeds for risk context.  
- **Third‑Party Libraries:** `tesseract.js` for fallback OCR; `pdfjs` for parsing PDFs; `pptxgenjs` (via Generator) for exporting extracts into presentations.

---

## 14. Rollout Plan

### Phase 1: Alpha (Internal Testing)
- **Timeline:** 4 weeks  
- **Scope:** Implement basic upload, OCR, classification and Q&A capabilities; risk detection limited to a small set of clauses; manual summarisation via existing LLM providers.  
- **Users:** Internal Trato Hive team and selected early adopters.  
- **Success Criteria:** Successful ingestion and extraction for ≥90 % of test documents; Q&A returns accurate answers with citations; at least 5 time‑to‑answer reduction compared with manual process.

### Phase 2: Beta (Limited Release)
- **Timeline:** 6 weeks  
- **Scope:** Add similarity detection, risk panel with severity scoring, document summarisation and export; integrate with Deals module to update fact sheets.  
- **Users:** Selected private equity and M&A advisory firms; feedback collected via surveys.  
- **Success Criteria:** 80 % of users agree the system saves them time; risk flags are accurate with <5 % false positives; summarisation quality rated ≥4/5.

### Phase 3: General Availability
- **Timeline:** 8 weeks after Beta  
- **Scope:** Full functionality including multi‑language support, advanced clause templates, performance optimisations, and deeper integration with Command Center and Generator modules.  
- **Users:** All customers.  
- **Success Criteria:** Adoption across ≥70 % of deals; reduction in diligence cycle time by 30 %; positive feedback and renewal intention.

### Rollback Plan
If severe issues arise (e.g. data corruption, major security vulnerability), disable the Diligence module and revert to manual Q&A via fallback processes; maintain access to uploaded documents and provide manual download options; communicate outage to users and roll back to prior stable version.

---

## 15. Success Metrics & KPIs

### User Adoption Metrics
- **Active Users:** Number of analysts and counsel actively using the Diligence module per week (target: 50 % of all deal teams within three months).  
- **Question Volume:** Number of questions submitted via the Q&A interface (target: ≥5 per deal on average).  
- **Uploads:** Number of documents uploaded and processed per deal (target: ≥80 % of diligence documents uploaded through the module).

### Performance Metrics
- **Q&A Response Time:** p95 latency for answer generation (<5 s).  
- **Summarisation Throughput:** Documents summarised per minute.  
- **Risk Detection Latency:** Time from document upload to risk panel update (<10 min).  
- **Error Rate:** Percentage of failed uploads or processing errors (<1 %).

### Quality Metrics
- **Answer Accuracy:** Proportion of answers rated accurate by analysts and counsel (>90 %).  
- **Risk Flag Precision:** Percentage of flagged items that are true positives (>80 %).  
- **Summary Quality:** User rating of summary usefulness (>4/5).  
- **Citation Coverage:** Percentage of generated outputs with at least one citation (100 %).

### Business Metrics
- **Cycle Time Reduction:** Average reduction in time spent on due diligence (target: 30 %).  
- **Cost Savings:** Reduction in external diligence costs due to AI automation (target: 20 %).  
- **Renewal & Expansion:** Rate of customers renewing or expanding usage due to Diligence module (>90 %).

---

## 16. Appendix

### Glossary
- **VDR:** Virtual Data Room, a secure online repository for storing and sharing documents during due diligence.  
- **OCR:** Optical Character Recognition, technology used to convert scanned images into text.  
- **RAG:** Retrieval‑Augmented Generation, technique where AI models retrieve relevant passages from a corpus and use them to generate answers.  
- **Similarity Detection:** Process of identifying when two questions are semantically similar to avoid duplicate answers.

### References
- External VDR and due diligence platforms (Imprima, V7 Go, etc.) for inspiration and benchmarks【407830420033055†L117-L190】【156822256992488†L161-L193】.  
- Trato Hive Product & Design Specification Section 4, Module 4 (lines 138‑160) for core requirements.  
- The Intelligent Hive design system (Style Guide) for colours, typography and components【516335038796236†L13-L17】.

### Revision History
| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2025-11-12 | 0.1 | Product & Engineering Teams | Initial draft incorporating internal specs and external research |

---

**End of PRD**