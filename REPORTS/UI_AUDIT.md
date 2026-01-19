# UI Audit Report

**Generated:** 2026-01-19T13:21:00+04:00  
**Scope:** `apps/web/src/components` (64 files), `packages/ui/src/components` (2 files)  
**Guidelines:** [Vercel Web Interface Guidelines](https://vercel.com/design/guidelines) + [design-principles.md](file:///Users/olivershewan/Developer/trato-hive/context/design-principles.md)

---

## Executive Summary

| Category | Status | Issues Found |
|----------|--------|--------------|
| **Animations** | ⚠️ Needs Work | 45+ `transition-all` violations |
| **Accessibility (Focus)** | ⚠️ Needs Work | 0 `focus-visible` usage |
| **Data Tables** | ⚠️ Needs Work | 0 `tabular-nums` usage |
| **Reduced Motion** | ⚠️ Needs Work | 0 `prefers-reduced-motion` support |
| **Modal Behavior** | ⚠️ Needs Work | 0 `overscroll-behavior` on modals |
| **Aria Labels** | ✅ Good | 10+ usages found |
| **Loading States** | ✅ Good | Proper spinner + disabled patterns |
| **Placeholder Format** | ⚠️ Mixed | Most use `...` instead of `…` |

---

## Critical Issues (Priority 1)

### 1. `transition-all` Usage (Vercel: "Never `transition: all`")
**45+ violations found.** This can cause unintended property animations and performance issues.

**Top Affected Files:**
| File | Count |
|------|-------|
| `DatabaseViewBlock.tsx` | 38 |
| `CommandListRenderer.tsx` | 2 |
| `WikiLinkSuggestion.tsx` | 2 |
| `RelatedCompaniesBlock.tsx` | 1 |
| `ViewSwitcher.tsx` | 1 |

**Recommended Fix:**
Replace `transition-all` with explicit properties:
```diff
- className="... transition-all duration-150"
+ className="... transition-colors transition-opacity duration-150"
```

---

### 2. Missing `focus-visible` (Vercel: "Clear focus")
**0 usages found.** All focusable elements should show a visible focus ring using `:focus-visible`.

**Affected Patterns:** All buttons, inputs, and interactive elements.

**Recommended Fix:**
Add focus ring utility classes:
```diff
- className="... focus:outline-none focus:ring-2 focus:ring-gold/30"
+ className="... focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/30"
```

---

### 3. Missing `tabular-nums` (Vercel: "Tabular numbers for comparisons")
**0 usages found.** Data tables with numeric columns should use `font-variant-numeric: tabular-nums` for alignment.

**Affected Components:**
- `DatabaseViewBlock.tsx` (table cells)
- `DealHistoryBlock.tsx` (deal values)
- `PipelineHealthBlock.tsx` (metrics)

**Recommended Fix:**
Add to numeric columns:
```tsx
<td className="font-[tabular-nums]">{value}</td>
```
Or add to Tailwind config:
```css
.tabular-nums { font-variant-numeric: tabular-nums; }
```

---

## High Priority Issues (Priority 2)

### 4. Missing `prefers-reduced-motion` Support (Vercel: "Honor prefers-reduced-motion")
**0 usages found.** Animations should respect user's motion preferences.

**Recommended Fix:**
Add media query wrapper in global CSS or use Tailwind's `motion-safe:` / `motion-reduce:` variants:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

### 5. Missing `overscroll-behavior` on Modals (Vercel: "Set overscroll-behavior: contain")
**0 usages found.** Modals/drawers should prevent background scroll.

**Affected Components:**
- `CommandPalette.tsx`
- `QueryBlock.tsx` (EditModal, RejectModal)
- `CitationSidebar.tsx`

**Recommended Fix:**
```diff
- <div className="fixed inset-0 z-50 ..."
+ <div className="fixed inset-0 z-50 overscroll-contain ..."
```

---

## Medium Priority Issues (Priority 3)

### 6. Placeholder Format (Vercel: "Placeholders signal emptiness")
**Mixed usage.** Most placeholders use `...` instead of the proper ellipsis character `…`.

**Examples Found:**
- `"Ask AI to edit..."` → `"Ask AI to edit…"`
- `"Search pages..."` → `"Search pages…"`
- `"Add option..."` → `"Add option…"`

**Count:** ~15 instances

---

## Good Practices Found ✅

### Aria Labels
10+ proper `aria-label` usages found in:
- `CommandPalette.tsx` (3)
- `DatabaseViewBlock.tsx` (7)

### Loading States
Proper loading patterns observed:
- Spinners displayed during async operations
- Buttons disabled while loading
- "Loading..." text indicators

### Semantic HTML
Good use of:
- `role="dialog"` for modals
- `role="listbox"` / `role="option"` for CommandPalette
- `<button>` elements for actions (not `<div>`)

---

## Recommended Fix Order

1. **Phase 1: Global CSS** (~1 hour)
   - Add `prefers-reduced-motion` media query
   - Add `tabular-nums` utility class
   
2. **Phase 2: DatabaseViewBlock.tsx** (~2 hours)
   - Replace 38 `transition-all` usages
   - Add `tabular-nums` to numeric cells
   - Add `focus-visible` to interactive elements

3. **Phase 3: Modal Components** (~1 hour)
   - Add `overscroll-contain` to CommandPalette, QueryBlock modals
   - Add `focus-visible` to buttons
   
4. **Phase 4: All Other Components** (~2 hours)
   - Replace remaining `transition-all` usages
   - Update placeholder `...` to `…`

---

## File-by-File Summary

| File | Issues | Priority |
|------|--------|----------|
| `DatabaseViewBlock.tsx` | 38 transition-all, no tabular-nums | P1 |
| `CommandPalette.tsx` | No overscroll-contain, no focus-visible | P2 |
| `QueryBlock.tsx` | Modals lack overscroll-contain | P2 |
| `WikiLinkSuggestion.tsx` | 2 transition-all | P3 |
| `CommandListRenderer.tsx` | 2 transition-all | P3 |
| `RelatedCompaniesBlock.tsx` | 1 transition-all | P3 |
| `ViewSwitcher.tsx` | 1 transition-all | P3 |

---

**Next Steps:** Approve this report and I can begin implementing fixes phase-by-phase, starting with global CSS changes.
