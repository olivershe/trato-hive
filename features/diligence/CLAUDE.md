# Feature: Diligence Room (Module 4)

**Parent:** Root CLAUDE.md
**Purpose:** AI-Native Virtual Data Room with Smart Q&A, Citation-First Answers, and Risk Analysis
**Last Updated:** 2025-11-28
**Module Mapping:** Module 4 - AI-Native VDR
**PRD Reference:** `/docs/prds/diligence.md`

---

## 1. Purpose

The Diligence Room is Trato Hive's AI-Native Virtual Data Room (VDR) that transforms due diligence from a document repository into an intelligent Q&A system. Instead of manually searching through hundreds of documents, users ask questions in natural language and receive answers with verifiable citations linking directly to source documents.

**Core Capabilities:**
- **Smart VDR Ingestion:** Drag-and-drop upload with automatic OCR, classification, and indexing
- **Automated Q&A with Citations:** Ask questions, get answers with Teal Blue citation links to exact document excerpts
- **Repeat Question Detection:** Reuse previous answers to similar questions (similarity matching)
- **Risk Flagging:** Automatically identify non-standard clauses, regulatory issues, and financial red flags
- **Document Summaries:** Generate multilingual summaries of contracts, financials, and reports

**Integration with 7-Layer Architecture:**
- **Layer 1 (Data Plane):** Document upload, OCR via Reducto AI, S3 storage
- **Layer 2 (Semantic Layer):** Fact extraction, vector indexing in Pinecone, citation linking
- **Layer 4 (Agentic Layer):** Diligence Agent orchestrates RAG workflow for Q&A
- **Layer 5 (Experience Layer):** VDR uploader UI, Q&A interface, citation modals, risk panel

**Reference:** `/docs/prds/diligence.md` Section 1-2

---

## 2. Ownership

**Owner:** Diligence & AI Engineering Teams
**Shared Responsibility:**
- Document processing pipeline reliability (with Data Plane team)
- Fact extraction quality and citation accuracy (with Semantic Layer team)
- Q&A response quality and hallucination prevention (with AI Core team)
- VDR security and access control (with Auth/Governance teams)

**Changes Requiring Approval:**
- New document format support (requires Data Plane coordination)
- Changes to Q&A prompt templates (requires AI Core review)
- Risk detection algorithms (requires Product approval)
- Citation modal design changes (requires Design review)

---

## 3. Technology Stack

**Frontend:**
- React 19 with Next.js 15 App Router
- Drag-and-drop file upload (react-dropzone)
- Q&A interface with real-time streaming
- Citation modal component (@trato-hive/ui)
- Risk panel with severity badges

**Backend:**
- Fastify + tRPC for API routes
- BullMQ job queues for async document processing
- Prisma for database operations

**AI/ML:**
- Diligence Agent (@trato-hive/agents) - RAG orchestration
- Claude Sonnet 4.5 (@trato-hive/ai-core) - Answer generation
- Pinecone (@trato-hive/semantic-layer) - Vector search for relevant chunks
- Reducto AI (@trato-hive/data-plane) - OCR and document parsing

**Package Dependencies:**
- @trato-hive/data-plane - Document ingestion, OCR, S3 storage
- @trato-hive/semantic-layer - Fact extraction, vector indexing, citation retrieval
- @trato-hive/agents - Diligence Agent workflow
- @trato-hive/ai-core - LLM for answer generation and risk analysis
- @trato-hive/ui - Citation component, Modal, FileUploader
- @trato-hive/db - Document, Fact, Question, Answer models

---

## 4. Data Model

### Data Ownership

**Owns:**
- `Document` - VDR documents with classification, language, status
- `ExtractedFact` - Facts extracted from documents with citation metadata
- `Question` - User-submitted questions with similarity hash
- `Answer` - AI-generated answers with citations and approval status
- `RiskItem` - Flagged risks with severity levels and remediation status

**Reads:**
- `Deal` - Associate documents and Q&A with specific deals
- `User` - Track who uploaded documents and asked questions
- `Firm` - Multi-tenancy isolation (firmId filtering)

**Writes:**
- Extracted facts feed into Deals module (Fact Sheet)
- Risk items appear in Command Center (My Tasks)
- Generated summaries can be exported via Generator module

### Key Entities (from PRD Section 6)

```typescript
interface Document {
  id: string
  dealId: string
  name: string
  s3Url: string
  classification: 'contract' | 'financial' | 'legal' | 'technical' | 'other'
  language: string
  status: 'uploading' | 'processing' | 'completed' | 'failed'
  pageCount: number
  uploadedBy: string
  createdAt: Date
}

interface Question {
  id: string
  dealId: string
  text: string
  similarityHash: string // For duplicate detection
  askedBy: string
  createdAt: Date
}

interface Answer {
  id: string
  questionId: string
  text: string
  citations: Citation[]
  confidence: number
  approved: boolean
  approvedBy?: string
  createdAt: Date
}

interface RiskItem {
  id: string
  dealId: string
  documentId: string
  category: 'legal' | 'financial' | 'operational' | 'regulatory'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  status: 'open' | 'investigating' | 'mitigated' | 'accepted'
  createdAt: Date
}
```

---

## 5. API Specification

### Endpoints (from PRD Section 7)

**Document Upload & Management:**
- `POST /api/v1/deals/:id/vdr/upload` - Upload documents to VDR
- `GET /api/v1/deals/:id/vdr/documents` - List all documents with filters
- `GET /api/v1/deals/:id/vdr/documents/:docId` - Get single document metadata
- `DELETE /api/v1/deals/:id/vdr/documents/:docId` - Delete document

**Q&A Interface:**
- `POST /api/v1/deals/:id/diligence/qa` - Submit question, get AI answer with citations
- `GET /api/v1/deals/:id/diligence/qa` - List all Q&A items (paginated)
- `GET /api/v1/deals/:id/diligence/qa/:qaId` - Get single Q&A with full context
- `PATCH /api/v1/deals/:id/diligence/qa/:qaId` - Approve/edit answer, add notes

**Risk Analysis:**
- `GET /api/v1/deals/:id/diligence/risks` - Get risk summary with severity breakdown
- `PATCH /api/v1/deals/:id/diligence/risks/:riskId` - Update risk status

**Document Summaries:**
- `POST /api/v1/deals/:id/diligence/summaries` - Generate summary for document(s)

### Validation & Rate Limiting
- Document upload: max 100MB per file, 50 files per batch
- Q&A: rate limit 10 questions per minute per user
- Risk analysis: triggered automatically on upload, manual refresh limited to 1/minute

---

## 6. Cross-Feature Integration

**Dependencies on Other Features:**
- **Deals:** Associate all VDR documents and Q&A with Deal entities
- **Discovery:** Import company documents discovered during sourcing
- **Generator:** Pull verified facts from Diligence for IC deck generation

**Exposes to Other Features:**
- **Deals:** Extracted facts for Fact Sheet display
- **Command Center:** Risk items appear in "My Tasks" inbox
- **Generator:** Document summaries and risk analysis for memo generation

---

## 7. UI Components

**Key Components:**
- `VDRUploader` - Drag-and-drop file upload with progress bars
- `DocumentList` - Table/grid view of uploaded documents with filters
- `QAInterface` - Chat-style interface for asking questions
- `CitationModal` - Display source document excerpt (Teal Blue border, <200ms load)
- `RiskPanel` - Dashboard of flagged risks with severity badges
- `DocumentSummary` - Collapsible summary cards for long documents

**Design Compliance (from PRD Section 9):**
- VDR cards: Bone background (#E2D9CB), Orange accent on hover
- Citation links: Teal Blue (#2F7E8A) with underline
- Citation modal: Orange border (#EE8D1D), loads in <200ms
- Risk badges: Red (critical), Orange (high), Yellow (medium), Green (low)
- All text: Inter font (no Lora serif)

---

## 8. Testing Requirements

### Unit Tests (≥80% coverage)
- Document classification logic
- Similarity detection algorithm (question matching)
- Risk flagging heuristics
- Citation extraction from LLM responses

### Integration Tests (≥70% coverage)
- Upload → OCR → fact extraction → indexing flow
- Q&A flow: question → retrieval → answer generation → citation linking
- Risk analysis pipeline with sample documents

### E2E Tests (Playwright)
- User flow: Upload document → wait for processing → ask question → click citation → verify modal
- Analyst approves/edits AI answer
- User filters documents by classification
- Risk panel updates when new risks detected

**Acceptance Criteria (from PRD Section 8):**
- [ ] Upload completes within 30 seconds for <10MB PDFs
- [ ] Q&A answers return within 10 seconds with ≥2 citations
- [ ] Citation modals load in <200ms
- [ ] Duplicate question detection >90% accuracy
- [ ] Risk detection identifies ≥80% of known red flags

---

## 9. Performance Requirements

**Targets:**
- Document upload: <30s for PDFs <50 pages
- Q&A response time: <10s (p95)
- Citation modal load: <200ms (CRITICAL)
- Risk analysis: completes within 2 minutes of upload
- Vector search: <500ms for similarity matching

**Optimization Strategies:**
- Batch document processing via BullMQ workers
- Cache frequently accessed citations in Redis
- Lazy load citation modals (prefetch on hover)
- Index documents asynchronously (don't block upload UI)

---

## 10. Common Patterns

**Upload with Progress Tracking:**
```typescript
// Frontend: apps/web
import { useUploadDocument } from '@/lib/hooks/useUploadDocument'

const { upload, progress, status } = useUploadDocument()

await upload(files, dealId)
// Progress tracked via BullMQ job events
```

**Q&A with Citations:**
```typescript
// Backend: features/diligence/backend/services/qa-service.ts
import { DiligenceAgent } from '@trato-hive/agents'
import { getCitation } from '@trato-hive/semantic-layer'

const answer = await diligenceAgent.answerQuestion(question, dealId)
// Returns: { text, citations: [{ factId, sourceId, pageNumber, excerpt }] }
```

**Citation Modal (UI):**
```typescript
// Frontend: features/diligence/frontend/components/CitationModal.tsx
import { Citation } from '@trato-hive/ui'

<Citation sourceId={fact.sourceDocumentId} pageNumber={fact.pageNumber}>
  $15.2M
</Citation>
// Clicking opens modal with document excerpt highlighted
```

---

## 11. Troubleshooting

**Issue: Document stuck in "processing" status**
- Check BullMQ worker logs for errors
- Verify Reducto API key is valid
- Restart worker: `pnpm --filter api worker:restart`

**Issue: Q&A returns answers with no citations**
- Check Pinecone index has vectors for this deal
- Verify semantic-layer fact extraction completed
- Review LLM prompt template for citation instruction

**Issue: Citation modal shows wrong excerpt**
- Verify bounding box coordinates from Reducto OCR
- Check pageNumber field matches actual PDF page
- Ensure presigned S3 URL hasn't expired

---

## 12. Non-Negotiables

1. **Every answer MUST include ≥1 citation** (no unsourced claims)
2. **Citation modals MUST load <200ms** (performance requirement)
3. **All documents MUST be filtered by firmId** (multi-tenancy security)
4. **OCR MUST use Reducto AI primary, Tesseract fallback** (quality over cost)
5. **Risk analysis MUST NOT auto-approve** (human review required)
6. **Document deletion MUST cascade to facts and citations** (data integrity)
7. **Q&A MUST check for similar questions** (avoid duplicate work)
8. **VDR access MUST log to audit trail** (compliance requirement)

---

**For More Information:**
- PRD: `/docs/prds/diligence.md`
- Architecture: `/docs/architecture/agentic-layer.md` (Diligence Agent)
- Data Plane: `/packages/data-plane/CLAUDE.md` (OCR, S3 upload)
- Semantic Layer: `/packages/semantic-layer/CLAUDE.md` (Vector search, citations)
- Agents: `/packages/agents/CLAUDE.md` (RAG workflow)
