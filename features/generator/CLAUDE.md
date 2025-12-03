# Generator (Module 5)

## Purpose

Material generation engine (Layer 5) for IC decks, LOIs, and memos with "Golden Citations".

## Tech Stack

- **Frontend:** Next.js 15, Tiptap (Editor), `@hello-pangea/dnd`
- **Backend:** `pptxgenjs`, `docx`, BullMQ
- **AI:** Generator Agent (Orchestration), Claude Sonnet (Narrative)

## Data Model

- **GeneratedDocument:** Output file (`type`, `status`, `version`)
- **CitationLink:** Link from doc element to source fact
- **Template:** Structure definition (`slides`, `sections`)

## API Specification

- `POST /generate`: Start async generation job
- `GET /preview`: View document with live citations
- `PATCH /edit`: Modify text/charts (preserves citations)
- `POST /download`: Export to PPTX/DOCX

## Common Patterns

### Generation Trigger

```typescript
// hooks/useGenerate.ts
const generate = api.generator.create.useMutation()
await generate.mutateAsync({
  dealId: 'deal-123',
  type: 'ic_deck',
  templateId: 'standard-ic',
})
```

### Preview with Citations

```tsx
// components/SlidePreview.tsx
<p>
  Revenue: <Citation sourceId={fact.sourceId}>${fact.value}</Citation>
</p>
```

## Non-Negotiables

- **Golden Citations:** EVERY number must be cited.
- **Performance:** Citation modals <200ms.
- **Audit:** Exported files must embed citation metadata.
- **Review:** Human must review before export.
