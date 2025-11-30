# Feature: Generator (Module 5)

**Parent:** Root CLAUDE.md
**Purpose:** Auditable Material Creation with Golden Citations - IC Decks, LOIs, Memos
**Last Updated:** 2025-11-28
**Module Mapping:** Module 5 - Investment Material Generation
**PRD Reference:** `/docs/prds/generator.md`

---

## 1. Purpose

The Generator module transforms Trato Hive's verified facts into polished investment materials—IC decks, Letters of Intent (LOIs), and deal memos—with the "Golden Citation" principle: every number, chart, and statement links back to its source document. This eliminates manual copy-paste errors and provides Investment Committee members instant verification.

**Core Capabilities:**
- **Template Library:** Pre-built templates (IC Deck, LOI, Memo) with defined structures
- **One-Click Generation:** Select template → system pulls facts from Semantic Layer → generates complete material in <30s
- **Golden Citations:** Every metric has Teal Blue hyperlink to source (page number, excerpt)
- **Interactive Preview & Editing:** Review slides/sections, edit text/charts, rearrange order
- **Export with Metadata:** Download as PowerPoint/Word with embedded citation data

**Integration with 7-Layer Architecture:**
- **Layer 1 (Data Plane):** Store generated documents in S3
- **Layer 2 (Semantic Layer):** Pull verified facts and citations for all content
- **Layer 3 (TIC Core):** Generate narrative text (investment thesis, risk summary)
- **Layer 4 (Agentic Layer):** Generator Agent orchestrates multi-step assembly workflow
- **Layer 5 (Experience Layer):** Template selector, progress bar, preview editor, export UI

**Why This Matters:**
Analysts spend days building IC decks manually. Generator reduces this to 30 seconds while ensuring every number is traceable. During IC meetings, partners can click citations to verify metrics in real-time.

**Reference:** `/docs/prds/generator.md` Section 1-2

---

## 2. Ownership

**Owner:** Product & Document Engineering Teams
**Shared Responsibility:**
- Template design and structure (with Product/Design teams)
- Narrative generation quality (with AI Core team)
- Citation accuracy and linking (with Semantic Layer team)
- Export file format compatibility (with Data Plane team)

**Changes Requiring Approval:**
- New template types (requires Product approval and design specs)
- Changes to citation format or modal design (requires Design review)
- Export file format changes (requires compatibility testing)
- Narrative generation prompts (requires AI Core review)

---

## 3. Technology Stack

**Frontend:**
- React 19 with Next.js 15 App Router
- Template selector: Card grid with preview modals
- Progress tracking: Real-time updates via WebSocket or SSE
- Preview editor: Rich text editor (Tiptap or Lexical)
- Drag-and-drop: Slide/section reordering (@hello-pangea/dnd)

**Backend:**
- Fastify + tRPC for API routes
- BullMQ job queues for async generation
- pptxgenjs (PowerPoint export)
- docx library (Word export)

**AI/ML:**
- Generator Agent (@trato-hive/agents) - Orchestrates generation workflow
- Claude Sonnet 4.5 (@trato-hive/ai-core) - Narrative text generation
- Semantic Layer (@trato-hive/semantic-layer) - Fact retrieval with citations

**Package Dependencies:**
- @trato-hive/semantic-layer - Fact retrieval, citation linking
- @trato-hive/agents - Generator Agent workflow
- @trato-hive/ai-core - Narrative generation
- @trato-hive/data-plane - Document storage (S3)
- @trato-hive/ui - Citation, Card, Modal, Progress components
- @trato-hive/db - GeneratedDocument, Template models

---

## 4. Data Model

### Data Ownership

**Owns:**
- `GeneratedDocument` - IC decks, LOIs, memos with status and version history
- `CitationLink` - Links from generated content to source facts
- `Template` - Template definitions with slide/section structures

**Reads:**
- `Fact` - From Semantic Layer (all verifiable data)
- `Deal` - Deal name, value, stage for context
- `Company` - Company name, team, financials
- `Document` - Source documents for citations

**Writes:**
- Generated files to S3 (via Data Plane)
- Citation metadata to Semantic Layer
- Generation tasks to Command Center "My Tasks"

### Key Entities (from PRD Section 6)

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

interface CitationLink {
  id: string
  generatedDocumentId: string
  elementId: string // Slide number or section ID
  factId?: string
  sourceId?: string
  pageNumber?: number
  excerpt?: string
  confidence: number
  createdAt: Date
}

interface Template {
  id: string
  name: string
  type: 'ic_deck' | 'loi' | 'memo'
  slides: SlideDefinition[]
  createdAt: Date
  updatedAt: Date
}
```

---

## 5. API Specification

### Endpoints (from PRD Section 7)

**Template Management:**
- `GET /api/v1/templates` - List available templates with previews

**Generation:**
- `POST /api/v1/deals/:id/generate/{type}` - Start generation (type: ic_deck, loi, memo)
  - Input: `{ templateId }`
  - Returns: `{ generatedDocumentId, status: 'generating' }`
- `GET /api/v1/deals/:id/generate/status?docId={id}` - Check progress
  - Returns: `{ status, progress: 0-100, message? }`

**Preview & Editing:**
- `GET /api/v1/deals/:id/generate/preview?docId={id}` - Get document for preview
  - Returns: `{ document, slides, citations }`
- `PATCH /api/v1/deals/:id/generate/{docId}` - Save edits
  - Input: `{ slides: UpdatedSlide[], citations?, version }`

**Export:**
- `POST /api/v1/deals/:id/generate/download` - Generate PPTX/DOCX file
  - Input: `{ docId }`
  - Returns: `{ fileUrl }` (S3 presigned URL, 1-hour expiry)

### Validation & Rate Limiting
- Generation: max 10 generations per user per day
- Export: max 5 exports per document (prevent abuse)
- Preview: rate limit 20 requests per minute per user
- Version conflicts: optimistic locking with version field

---

## 6. Cross-Feature Integration

**Dependencies on Other Features:**
- **Deals:** Generate materials for specific deals (pull name, value, stage)
- **Diligence:** Use extracted facts and risk summaries in generated content
- **Discovery:** Include company profiles and market maps in IC decks

**Exposes to Other Features:**
- **Deals:** Link to generated documents in Deal 360° "Materials" tab
- **Command Center:** Create "Review IC Deck" tasks in My Tasks inbox
- **Diligence:** Export Q&A summaries for inclusion in memos

---

## 7. UI Components

**Key Components:**
- `TemplateSelector` - Grid of template cards with preview thumbnails
- `GenerationProgress` - Step indicator (Gathering Facts → Drafting → Embedding Citations → Rendering)
- `DocumentPreview` - Slide/section viewer with pagination
- `SlideEditor` - Inline editing for text, charts, tables
- `CitationHighlight` - Teal Blue numbers with click handler
- `ExportButton` - Download as PPTX/DOCX with loading state

**Design Compliance (from PRD Section 9):**
- Template cards: Bone background (#E2D9CB), Gold borders on hover
- Progress bar: Gold (#EE8D1D) with percentage label
- Citation numbers: Teal Blue (#2F7E8A) with underline
- Citation modals: Orange border (#EE8D1D), <200ms load
- Slide backgrounds: Soft Sand (#E2D9CB in templates)
- All text: Inter font (no Lora serif)

---

## 8. Testing Requirements

### Unit Tests (≥80% coverage)
- Template selection and validation
- Fact retrieval and aggregation logic
- Citation linking (fact → slide element)
- Export file generation (PPTX/DOCX structure)

### Integration Tests (≥70% coverage)
- End-to-end generation flow with mocked LLM responses
- Preview → edit → save → export workflow
- Version conflict handling
- Citation persistence after edits

### E2E Tests (Playwright)
- User flow: Select template → generate IC deck → preview → edit slide → export → verify citations in file
- User flow: Generate LOI → edit clauses → download Word doc
- User flow: Generate memo → verify all facts have citations
- Concurrent editing: two users edit same document → version conflict detected

**Acceptance Criteria (from PRD Section 8):**
- [ ] IC deck generation completes <30 seconds (p95)
- [ ] LOI/memo generation <20 seconds (p95)
- [ ] Preview loads <500ms
- [ ] Citation modals load <200ms (CRITICAL)
- [ ] Export downloads <10 seconds
- [ ] ALL numbers have citations (100% coverage)

---

## 9. Performance Requirements

**Targets:**
- IC deck generation: <30s for 20-slide deck (p95)
- LOI/memo generation: <20s (p95)
- Preview load: <500ms
- Editing: instant feedback (<50ms UI response)
- Export: file ready in <10s
- Citation modal: <200ms (CRITICAL SLA)

**Optimization Strategies:**
- Cache template structures (no re-fetch per generation)
- Batch fact retrieval (single query, not N+1)
- Stream narrative generation (show progress as chunks arrive)
- Lazy render preview slides (viewport only)
- Prefetch citations on hover (before modal open)
- Use CDN for template thumbnails

---

## 10. Common Patterns

**Start Generation:**
```typescript
// Frontend: features/generator/frontend/hooks/useGenerateDocument.ts
import { api } from '@/lib/api-client'

const generate = api.generator.create.useMutation()

const { generatedDocumentId } = await generate.mutateAsync({
  dealId: "deal-123",
  type: "ic_deck",
  templateId: "template-standard-ic"
})
```

**Preview with Citations:**
```typescript
// Frontend: features/generator/frontend/components/DocumentPreview.tsx
import { Citation } from '@trato-hive/ui'

const { data: preview } = api.generator.preview.useQuery({ docId })

return preview.slides.map((slide) => (
  <Slide key={slide.id}>
    <h2>{slide.title}</h2>
    <p>Revenue: <Citation sourceId={slide.facts.revenue.sourceId}>${slide.facts.revenue.value}M</Citation></p>
  </Slide>
))
```

---

## 11. Troubleshooting

**Issue: Generation stuck at "Gathering Facts" step**
- Check Semantic Layer has indexed facts for this deal
- Verify Pinecone index is accessible
- Restart Generator Agent worker: `pnpm --filter api workers:restart`

**Issue: Generated deck has missing citations**
- Review LLM prompt template (must instruct to include citations)
- Verify facts have sourceDocumentId and pageNumber
- Regenerate document with verbose logging enabled

**Issue: Export file is corrupted**
- Verify pptxgenjs/docx library versions
- Test with minimal template
- Check for special characters in text

---

## 12. Non-Negotiables

1. **EVERY number/fact MUST have a citation** (Golden Citation principle)
2. **Citation modals MUST load <200ms** (performance SLA)
3. **Generation MUST NOT auto-export** (human review required)
4. **Templates MUST be version-controlled** (no silent changes)
5. **Export files MUST embed citation metadata** (audit trail)
6. **Edits MUST preserve citations** (no broken links)
7. **Generation MUST use internal data only** (no external APIs in MVP)
8. **Narrative MUST be editable** (no locked AI content)

---

**For More Information:**
- PRD: `/docs/prds/generator.md`
- Architecture: `/docs/architecture/agentic-layer.md` (Generator Agent)
- Semantic Layer: `/packages/semantic-layer/CLAUDE.md` (Fact retrieval)
- AI Core: `/packages/ai-core/CLAUDE.md` (Narrative generation)
