# Diligence Room (Module 4)

## Purpose

AI-Native VDR (Layer 5) with smart ingestion, automated Q&A, and citation-backed answers.

## Tech Stack

- **Frontend:** Next.js 15, `react-dropzone`
- **Backend:** BullMQ (Processing), Reducto AI (OCR)
- **AI:** Diligence Agent (RAG), Pinecone (Vector Search)

## Data Model

- **Document:** VDR file (`classification`, `status`)
- **Question/Answer:** Q&A pairs with citations
- **RiskItem:** Flagged risks (`severity`, `category`)

## API Specification

- `POST /upload`: Batch document upload
- `POST /qa`: Ask question (returns answer + citations)
- `GET /risks`: Automated risk analysis
- `GET /documents`: VDR file list

## Common Patterns

### Q&A with Citations

```typescript
// services/qa-service.ts
const answer = await diligenceAgent.answerQuestion(question, dealId)
// Returns: { text, citations: [{ sourceId, pageNumber, excerpt }] }
```

### Citation Modal

```tsx
// components/CitationModal.tsx
<Citation sourceId={srcId} excerpt={excerpt}>
  $15.2M
</Citation>
// Opens modal with highlighted excerpt in <200ms
```

## Non-Negotiables

- **Citations:** Every AI answer MUST include ≥1 citation.
- **Performance:** Citation modals load <200ms.
- **OCR:** Use Reducto AI (primary) or Tesseract (fallback).
- **Security:** Strict `firmId` isolation for VDR files.
