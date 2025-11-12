# Trato Hive Design Principles

## Introduction

These principles govern all UX and UI decisions for Trato Hive. They ensure consistency, usability, and alignment with our core value proposition: a verifiable, intelligent, and professional M&A CRM.

## Core Design Principles

### 1. Verifiability First (Trust & Transparency)

**Principle:** Every piece of AI-generated information must be traceable to its source.

**Implementation:**
- All numbers, facts, and claims displayed in the UI must have a visible citation link
- Citation links styled in Teal Blue (#2F7E8A) with underline
- Clicking a citation opens a modal showing the source document with highlighted text
- Use `[cite]` notation for AI-generated content awaiting review

**Example:**
```
EBITDA: $12.5M [linked to source document, page 23]
```

### 2. Intelligence Without Noise (Calm & Focused)

**Principle:** AI features should augment, not overwhelm. The interface should feel calm, confident, and professional.

**Implementation:**
- AI-generated content visually distinct (Teal Blue color)
- AI suggestions appear contextually (not as pop-ups or interruptions)
- Users always in control (approve, edit, or reject AI outputs)
- Loading states for AI operations ("Generating..." with subtle animation)

**Anti-Pattern:**
- Aggressive AI recommendations
- Flashy animations or attention-grabbing elements
- Forced AI interactions

### 3. Hierarchy & Clarity (Information Architecture)

**Principle:** Complex data must be structured hierarchically and progressively disclosed.

**Implementation:**
- Primary information (deal name, stage, key metrics) immediately visible
- Secondary information (details, documents, history) accessible via tabs or expand/collapse
- Use of visual hierarchy: size, weight, color contrast
- Maximum 3 levels of nesting before requiring navigation to new page

**Example:**
- Deal Card (primary): Deal name, stage, assigned user
- Deal 360° Overview (secondary): Full details, tabs for diligence/docs/activity
- Verifiable Fact Sheet (tertiary): Expandable widget within Overview

### 4. Speed & Responsiveness (Performance as a Feature)

**Principle:** The system must feel fast and responsive, even during heavy AI operations.

**Implementation:**
- Optimistic UI updates (show change immediately, sync in background)
- Skeleton loaders for list views
- Progress indicators for operations >2s
- Pagination and virtualization for large data sets
- Cached data with TTL to reduce backend calls

**Targets:**
- Page load: <2s
- API calls: <500ms (p95)
- AI operations: <5s or async

### 5. Accessibility as Standard (Inclusive Design)

**Principle:** All users, regardless of ability, must have equal access to features.

**Implementation:**
- WCAG 2.1 AA compliance minimum
- Keyboard navigation for all interactive elements
- Screen reader support (semantic HTML, ARIA labels)
- Color contrast: 4.5:1 for normal text, 3:1 for large text
- No reliance on color alone for information conveyance

### 6. Consistency & Predictability (Design System)

**Principle:** Users should never be surprised by UI behavior or visual changes.

**Implementation:**
- Strict adherence to The Intelligent Hive design system
- Reusable components from `@trato-hive/ui` package
- Consistent spacing, typography, and color usage
- Predictable interaction patterns (click to open, hover for preview, drag to move)

### 7. Citation as First-Class Citizen (The Killer Feature)

**Principle:** Citations are not footnotes—they are integral to the user experience.

**Implementation:**
- Citations always visible (not hidden in tooltips or expandable sections)
- Citations styled prominently (Teal Blue, underline, hover effect)
- Citation modal loads instantly (<200ms) on click
- Citation modal shows: source document name, excerpt with highlighted text, link to full document
- Citation count displayed where relevant ("Backed by 3 sources")

## UX Heuristics

### Navigation

**Primary Navigation:**
- Top horizontal nav bar with 5 main modules: Command Center, Discovery, Deals, Diligence, Generator
- Active module highlighted (Gold accent underline)
- User profile and settings in top-right corner

**Secondary Navigation:**
- Tabs within modules (e.g., Deal 360° tabs: Overview, Diligence, Documents, Activity)
- Breadcrumbs for deep navigation paths

### Feedback & States

**Loading States:**
- Skeleton loaders for initial page loads
- Spinner for inline actions
- Progress bar for multi-step operations (VDR upload, IC deck generation)

**Empty States:**
- Friendly, actionable empty states ("No deals yet. Create your first deal.")
- Illustration or icon to reduce perceived emptiness

**Error States:**
- User-friendly error messages (not technical jargon)
- Actionable next steps ("Try refreshing" or "Contact support")
- Errors logged to ERROR_LOG.md for debugging

**Success States:**
- Toast notifications for successful actions (3s auto-dismiss)
- Green checkmark icon for confirmation
- Subtle animations (fade-in, slide-up) for visual feedback

### Forms & Inputs

**Form Design:**
- Labels above inputs (not placeholders as labels)
- Required fields marked with asterisk (*)
- Inline validation (show error on blur or submit)
- Clear error messages ("Email is required" not "Invalid input")

**Button Hierarchy:**
- Primary action: Gold button (e.g., "Create Deal")
- Secondary action: Outline button (e.g., "Cancel")
- Destructive action: Red button (e.g., "Delete")

### Modals & Overlays

**Usage:**
- Modals for critical actions requiring focus (delete confirmations, citation views)
- Side panels for contextual information (deal details, document preview)
- Avoid modals for non-critical information (use inline expansion instead)

**Modal Design:**
- Dark overlay (50% opacity) to dim background
- Centered modal with Soft Sand background
- Close button (X) in top-right corner
- Keyboard accessible (Esc to close, Tab to navigate)

## Mobile & Responsive Design

**Philosophy:**
- Desktop-first design (primary users are professionals on laptops)
- Mobile-responsive for on-the-go access (viewing, not heavy editing)

**Breakpoints:**
- Desktop: ≥1440px (optimized)
- Laptop: ≥1024px
- Tablet: ≥768px
- Mobile: <768px

**Mobile Considerations:**
- Simplified navigation (hamburger menu)
- Stacked layouts (no side-by-side columns)
- Touch-friendly targets (min 44x44px)

## Tone & Voice

**Product Voice:**
- **Professional:** Serious, trustworthy, no unnecessary casualness
- **Intelligent:** Sophisticated, knowledgeable, not condescending
- **Helpful:** Guiding, supportive, not prescriptive

**Microcopy Examples:**
- "Verifying sources..." (not "Hold on, AI is thinking...")
- "3 new insights discovered" (not "Wow! Check this out!")
- "Review AI-suggested answer" (not "AI found an answer for you!")

## Anti-Patterns to Avoid

1. **Information Overload:** Don't show everything at once; use progressive disclosure
2. **AI Over-Confidence:** Never present AI outputs as absolute truth without citations
3. **Inconsistent Styling:** Don't deviate from design tokens for "creative" reasons
4. **Hidden Actions:** Don't hide critical actions in nested menus or obscure UI
5. **Jargon Overload:** Don't use technical terms without context (e.g., "TIC query" → "Search with AI")

## Decision Framework

When faced with a design decision, ask:

1. **Does this increase verifiability?** (citations, source links)
2. **Does this reduce cognitive load?** (clarity, hierarchy)
3. **Is this consistent with The Intelligent Hive?** (design tokens, patterns)
4. **Is this accessible to all users?** (keyboard nav, screen readers)
5. **Does this feel fast?** (optimistic UI, loaders)

If the answer to any is "no," reconsider the design.

## Review & Approval Process

**Before Implementation:**
- Validate against this document
- Validate against `/context/style-guide.md`
- Run `/design:quick-check` for minor changes
- Invoke `@agent-design-review` for major changes

**Before Merge:**
- Attach 1440px screenshots to PR
- Confirm design system compliance
- Verify citation links functional
- Check accessibility (keyboard nav, color contrast)

## Appendix: Design System References

- **Style Guide:** `/context/style-guide.md`
- **Component Library:** `packages/ui/`
- **Root CLAUDE.md:** Design Governance section
