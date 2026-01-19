# Trato Hive Web App (apps/web)

**Package:** `@trato-hive/web`
**Framework:** Next.js 15 (App Router), React 19, Tailwind CSS 4
**Last Updated:** January 19, 2026 (Phase 11 Complete)

## Quick Reference

```bash
# Development
pnpm --filter @trato-hive/web dev

# Testing
pnpm --filter @trato-hive/web test        # Unit tests (Vitest)
pnpm --filter @trato-hive/web test:e2e    # E2E tests (Playwright)
pnpm --filter @trato-hive/web typecheck   # Type checking
```

## Directory Structure

```
apps/web/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (dashboard)/        # Authenticated routes (with sidebar)
│   │   │   ├── deals/          # Deal pages
│   │   │   ├── companies/      # Company pages [Phase 11.4]
│   │   │   ├── documents/      # Document pages [Phase 11.6]
│   │   │   ├── discovery/      # Discovery module
│   │   │   └── layout.tsx      # Dashboard layout with sidebar
│   │   └── (auth)/             # Authentication routes
│   ├── components/             # React components
│   │   ├── editor/             # Block editor (Tiptap)
│   │   │   └── extensions/     # Tiptap node extensions
│   │   ├── sidebar/            # Sidebar components [Phase 11.2]
│   │   ├── companies/          # Company-specific components [Phase 11.5]
│   │   ├── deals/              # Deal-specific components [Phase 11.8]
│   │   ├── alerts/             # Alert components [Phase 11.8]
│   │   ├── views/              # View components (Table, Kanban)
│   │   └── CommandPalette*.tsx # Command Palette [Phase 11.3]
│   ├── hooks/                  # Custom React hooks
│   ├── stores/                 # Zustand stores
│   └── lib/                    # Utilities and configurations
├── e2e/                        # Playwright E2E tests
└── public/                     # Static assets
```

## Zustand Stores

### Sidebar Store (`stores/sidebar.ts`)
**Purpose:** Manage sidebar pinned/recent items and expansion state

```typescript
interface SidebarStore {
  pinnedItems: SidebarItem[]     // Max 7 pinned items
  recentItems: SidebarItem[]     // Max 7 recent items (FIFO)
  expandedItemId: string | null  // Currently expanded item

  // Actions
  pin(item: SidebarItem): void
  unpin(itemId: string): void
  isPinned(itemId: string): boolean
  reorderPinned(items: SidebarItem[]): void
  addRecent(item: SidebarItem): void
  removeRecent(itemId: string): void
  clearRecent(): void
  setExpanded(itemId: string | null): void
  toggleExpanded(itemId: string): void
}
```

**Persistence:** localStorage (`trato-sidebar-storage`)

### Command Palette Store (`stores/commandPalette.ts`)
**Purpose:** Manage command palette scope preference

```typescript
interface CommandPaletteStore {
  scopeMode: 'context' | 'global'  // Search scope
  setScopeMode(mode: 'context' | 'global'): void
  toggleScope(): void
}
```

**Persistence:** localStorage (`trato-command-palette-storage`)

### Editor Store (`stores/editor.ts`)
**Purpose:** Provide editor reference for Command Palette integration

```typescript
interface EditorStore {
  editor: Editor | null
  setEditor(editor: Editor | null): void
}
```

## Tiptap Block Extensions (Phase 11)

### Company Blocks (`components/editor/extensions/`)

| Extension | File | Purpose |
|-----------|------|---------|
| `CompanyHeaderBlock` | `CompanyHeaderBlock.tsx` | Company page header with name, industry, metrics |
| `DealHistoryBlock` | `DealHistoryBlock.tsx` | Table of deals involving the company |
| `RelatedCompaniesBlock` | `RelatedCompaniesBlock.tsx` | Similar companies by industry/location |

### Document Blocks

| Extension | File | Purpose |
|-----------|------|---------|
| `DocumentViewerBlock` | `DocumentViewerBlock.tsx` | PDF viewer with zoom/navigation |
| `ExtractedFactsBlock` | `ExtractedFactsBlock.tsx` | Display extracted facts by type |

### AI/Q&A Blocks

| Extension | File | Purpose |
|-----------|------|---------|
| `QueryBlock` | `QueryBlock.tsx` | AI Q&A with review flow (approve/edit/reject) |
| `AIAnswerBlock` | `AIAnswerBlock.tsx` | Inserted AI answers with citations |

## Key Components (Phase 11)

### Navigation System

| Component | File | Description |
|-----------|------|-------------|
| `PinnedSection` | `sidebar/PinnedSection.tsx` | Draggable pinned items (max 7) |
| `RecentSection` | `sidebar/RecentSection.tsx` | Auto-tracked recent items (FIFO) |
| `Sidebar` | `layouts/Sidebar.tsx` | Main sidebar with navigation |

### Command Palette

| Component | File | Description |
|-----------|------|-------------|
| `CommandPalette` | `CommandPalette.tsx` | Modal UI with keyboard navigation |
| `CommandPaletteProvider` | `CommandPaletteProvider.tsx` | Search/AI/actions orchestration |
| `CommandPaletteAIAnswer` | `CommandPaletteAIAnswer.tsx` | AI answer display with citations |

### Company Pages

| Component | File | Description |
|-----------|------|-------------|
| `WatchButton` | `companies/WatchButton.tsx` | Toggle watch status (Eye icon) |

### Pipeline Updates

| Component | File | Description |
|-----------|------|-------------|
| `CompaniesCell` | `views/CompaniesCell.tsx` | Multi-company display with role badges |
| `AlertsBlock` | `alerts/AlertsBlock.tsx` | AI alerts for stale deals |
| `DealQuickActions` | `deals/DealQuickActions.tsx` | Hover overlay with keyboard shortcuts |

## Custom Hooks (Phase 11)

| Hook | File | Purpose |
|------|------|---------|
| `useCommandPalette` | `hooks/useCommandPalette.ts` | Global ⌘K keyboard listener |
| `usePageContext` | `hooks/usePageContext.ts` | Detect current page context for scoping |
| `useRecentTracker` | `hooks/useRecentTracker.ts` | Auto-track route visits |
| `useSidebarSync` | `hooks/useSidebarSync.ts` | Sync sidebar with database |
| `useActivePageExpansion` | `hooks/useActivePageExpansion.ts` | Auto-expand sidebar on navigation |
| `useWatch` | `hooks/useWatch.ts` | Company watch toggle with optimistic updates |

## E2E Testing

**Location:** `apps/web/e2e/`
**Framework:** Playwright

### Test Files

| File | Coverage |
|------|----------|
| `editor.spec.ts` | Block editor basics |
| `database.spec.ts` | Database view blocks |
| `auto-save.spec.ts` | Auto-save behavior |
| `page-hierarchy.spec.ts` | Page tree navigation |
| `navigation.spec.ts` | Sidebar + Command Palette [TASK-122] |
| `company-pages.spec.ts` | Company pages + watch [TASK-123] |
| `qa-review.spec.ts` | Q&A review flow [TASK-124] |

### Running Tests

```bash
# Start dev server first
pnpm --filter @trato-hive/web dev

# Run E2E tests
pnpm --filter @trato-hive/web test:e2e

# UI mode (interactive)
pnpm --filter @trato-hive/web test:e2e:ui
```

## Design Compliance

**System:** The Intelligent Hive (Brand Pack v2.0)

### Critical Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Orange | `#E07B39` | Accent, buttons, active states |
| Charcoal | `#262827` | Text, backgrounds |
| Teal Blue | `#2F7E8A` | **CITATIONS ONLY** |

### Status Badge Colors

| Status | Background | Text |
|--------|------------|------|
| Pending | `bg-amber-100` | `text-amber-800` |
| Approved | `bg-emerald-100` | `text-emerald-800` |
| Edited | `bg-blue-100` | `text-blue-800` |
| Rejected | `bg-red-100` | `text-red-800` |

### Deal Stage Colors

| Stage | Color |
|-------|-------|
| SOURCING | Blue |
| INITIAL_REVIEW | Violet |
| PRELIMINARY_DUE_DILIGENCE | Pink |
| DEEP_DUE_DILIGENCE | Orange |
| NEGOTIATION | Amber |
| CLOSING | Emerald |
| CLOSED_WON | Green |
| CLOSED_LOST | Red |

### Deal Company Role Colors

| Role | Color |
|------|-------|
| PLATFORM | Charcoal |
| ADD_ON | Orange |
| SELLER | Emerald |
| BUYER | Blue |
| ADVISOR | Violet |

## Patterns & Best Practices

### tRPC Integration

```typescript
// Query with React Query
const { data, isLoading } = api.company.get.useQuery({ id: companyId });

// Mutation with optimistic updates
const utils = api.useUtils();
const mutation = api.watch.add.useMutation({
  onSuccess: () => {
    utils.watch.isWatched.invalidate({ companyId });
    utils.watch.list.invalidate();
  },
});
```

### Tiptap Extension Pattern

```typescript
// Node extension structure
export const MyBlock = Node.create({
  name: 'my_block',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      myProp: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="my_block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'my_block' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MyBlockComponent);
  },
});
```

### Zustand Store Pattern

```typescript
// Store with persist middleware
export const useMyStore = create<MyStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => set((state) => ({ items: [...state.items, item] })),
    }),
    {
      name: 'trato-my-storage',
    }
  )
);
```

## Related Documentation

- **Root CLAUDE.md:** `/CLAUDE.md` - Project-wide architecture
- **API Docs:** `/apps/api/CLAUDE.md` - tRPC routers
- **Design Tokens:** `/context/design-tokens.md` - Brand colors/fonts
- **Architecture:** `/docs/architecture/` - 7-Layer Architecture
