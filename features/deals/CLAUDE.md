# Deals (Module 3)

## Purpose

Core CRM module (Layer 5) for pipeline management, Deal 360° Hub, and Verifiable Fact Sheets.

## Tech Stack

- **Frontend:** Next.js 15, `@dnd-kit` (Kanban), TanStack Table (List)
- **Backend:** tRPC, Prisma, Socket.io (Real-time updates)
- **AI:** Pipeline OS Agent (Next steps), Semantic Layer (Facts)

## Data Model

- **Deal:** Core entity (`stage`, `value`, `probability`)
- **DealActivity:** Audit trail of changes
- **DealSuggestion:** AI-generated next steps

## API Specification

- `deal.list`: Paginated, filtered deal list
- `deal.updateStage`: Kanban drag-and-drop transition
- `deal.getFactSheet`: Verifiable facts with citations
- `deal.getNextSteps`: AI suggestions

## Common Patterns

### Optimistic Stage Update

```typescript
// components/DealKanban.tsx
const mutation = trpc.deal.updateStage.useMutation({
  onMutate: async ({ id, stage }) => {
    await utils.deal.list.cancel()
    utils.deal.list.setData((old) => old.map((d) => (d.id === id ? { ...d, stage } : d)))
  },
})
```

### Fact Sheet Citation

```tsx
// components/FactSheet.tsx
<Citation sourceId={fact.sourceDocumentId} pageNumber={fact.pageNumber}>
  {fact.content}
</Citation>
```

## Non-Negotiables

- **Multi-Tenancy:** Enforce `firmId` on all queries.
- **Citations:** Every fact in Fact Sheet MUST have a citation.
- **Validation:** Prevent invalid stage transitions.
- **Real-Time:** Broadcast stage changes via WebSocket.
