# Trato Hive Design Principles

## Introduction

These principles govern all UX and UI decisions for Trato Hive. They ensure consistency, usability, and alignment with our core value proposition: a verifiable, intelligent, and professional M&A CRM.

**Last Updated:** 2025-11-16
**Version:** 2.0 (Brand Pack Alignment)

## Core Design Principles

### 1. Verifiability First (Trust & Transparency)

**Principle:** Every piece of AI-generated information must be traceable to its source.

**Implementation:**
- All numbers, facts, and claims displayed in the UI must have a visible citation link
- Citation links styled in **Teal Blue (#2F7E8A)** with underline (ONLY color for citations)
- Clicking a citation opens a modal with **Orange (#EE8D1D) border** showing the source document with highlighted text
- Citation modal must load in **<200ms** (critical performance requirement)
- Use `[cite]` notation for AI-generated content awaiting review

**Example:**
```
EBITDA: $12.5M [linked to source document, page 23]
```

### 2. Intelligence Without Noise (Calm & Focused)

**Principle:** AI features should augment, not overwhelm. The interface should feel calm, confident, and professional.

**Implementation:**
- AI-generated content visually distinct (Orange accents for AI actions, Teal Blue ONLY for citations)
- AI suggestions appear contextually (not as pop-ups or interruptions)
- Users always in control (approve, edit, or reject AI outputs)
- Loading states for AI operations ("Generating..." with subtle animation using hexagonal spinner)

**Anti-Pattern:**
- Aggressive AI recommendations
- Flashy animations or attention-grabbing elements
- Forced AI interactions

### 3. Hierarchy & Clarity (Information Architecture)

**Principle:** Complex data must be structured hierarchically and progressively disclosed.

**Implementation:**
- Primary information (deal name, stage, key metrics) immediately visible
- Secondary information (details, documents, history) accessible via tabs or expand/collapse
- Use of visual hierarchy: size, weight, **color contrast (Orange accents for primary actions)**
- Maximum 3 levels of nesting before requiring navigation to new page
- **Hexagonal connection diagrams** for visualizing relationships (deals, companies, stakeholders)

**Visual Hierarchy Tools:**
- **Typography:** Bold (700) for headings, Semibold (600) for subheadings, Regular (400) for body
- **Color:** Orange (#EE8D1D) for primary CTAs, Black (#1A1A1A) for primary text (light mode)
- **Spacing:** Generous whitespace (4px base unit) to separate sections
- **Elevation:** Shadows to lift cards and modals above background

**Example:**
- Deal Card (primary): Deal name, stage, assigned user, **Orange accent line at top**
- Deal 360° Overview (secondary): Full details, tabs for diligence/docs/activity
- Verifiable Fact Sheet (tertiary): Expandable widget within Overview with **prominent Orange border**

### 4. Block-Based Content (Dynamic Experience)

**Principle:** User-generated content should be granular, recursive, and agent-ready.

**Implementation:**
- Use a **Page -> Block** model for all complex entities (Deals, Companies)
- Blocks are the atomic unit of work: Paragraph, Heading, Citation, DealCard
- Support drag-and-drop reordering for logical structuring
- AI Agents operate at the **Block level** (e.g., "Summarize this block")
- Use **Novel/Tiptap** for a consistent, Notion-like writing experience

### 5. Speed & Responsiveness (Performance as a Feature)

**Principle:** The system must feel fast and responsive, even during heavy AI operations.

> **See Also:** "Appendix: High-Performance Web Standards" for detailed performance guidelines.

**Trato Hive Targets:**
- Page load: <2s
- API calls: <500ms (p95)
- AI operations: <5s or async
- Citation modal: <200ms (critical)

### 6. Accessibility as Standard (Inclusive Design)

**Principle:** All users, regardless of ability, must have equal access to features.

> **See Also:** "Appendix: High-Performance Web Standards" for detailed accessibility patterns (focus rings, ARIA, semantics).

**Trato Hive Requirements:**
- WCAG 2.1 AA compliance minimum
- Color contrast: 4.5:1 for normal text, 3:1 for large text
- Teal Blue (#2F7E8A) for citations ONLY—ensures visual distinction

### 6. Consistency & Predictability (Design System)

**Principle:** Users should never be surprised by UI behavior or visual changes.

**Implementation:**
- Strict adherence to The Intelligent Hive design system (v2.0)
- Reusable components from `@trato-hive/ui` package
- Consistent spacing (4px base unit), typography (Inter only), and color usage (Bone/Deep Grey backgrounds, Orange accents)
- Predictable interaction patterns (click to open, hover for preview, drag to move)
- **Hexagonal branding** for decorative elements, **rounded rectangles** for interactive UI components

**Color Consistency Rules:**
- **Backgrounds:** Bone (#E2D9CB) for light mode, Deep Grey (#313131) for dark mode
- **Primary CTAs:** Orange (#EE8D1D) in both modes
- **Citations:** Teal Blue (#2F7E8A) ONLY—never use for general links or buttons
- **Text:** Black (#1A1A1A) on light, Cultured White (#F7F7F7) on dark

### 7. Citation as First-Class Citizen (The Killer Feature)

**Principle:** Citations are not footnotes—they are integral to the user experience.

**Implementation:**
- Citations always visible (not hidden in tooltips or expandable sections)
- Citations styled prominently (**Teal Blue #2F7E8A**, underline, hover effect to Teal Light #4A9DAB)
- Citation modal loads instantly (**<200ms**) on click—this is a critical performance requirement
- Citation modal design: **White background (light mode) or #3A3A3A (dark mode), Orange border (#EE8D1D), 12px border-radius**
- Citation modal shows: source document name, excerpt with highlighted text, link to full document
- Citation count displayed where relevant ("Backed by 3 sources")

## UX Heuristics

### Navigation

**Primary Navigation:**
- Top horizontal nav bar with 5 main modules: Command Center, Discovery, Deals, Diligence, Generator
- Active module highlighted (**Orange #EE8D1D accent underline**)
- Hover state: **Orange text color**
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
- **Primary action:** Orange button (#EE8D1D) with white text (e.g., "Create Deal")
- **Secondary action:** Outline button with Black border (#1A1A1A light mode) or Cultured White border (#F7F7F7 dark mode) (e.g., "Cancel")
- **Destructive action:** Red button (#F44336) with white text (e.g., "Delete")
- **Tertiary action:** Text-only button in Orange (#EE8D1D) with underline on hover

### Modals & Overlays

**Usage:**
- Modals for critical actions requiring focus (delete confirmations, citation views)
- Side panels for contextual information (deal details, document preview)
- Avoid modals for non-critical information (use inline expansion instead)

**Modal Design:**
- Dark overlay (50% opacity light mode, 70% dark mode) with 4px blur to dim background
- Centered modal with **White background (light mode) or #3A3A3A (dark mode)**
- **12px border-radius** (radius-lg)
- Close button (X) in top-right corner styled in Black (#1A1A1A) or Cultured White (#F7F7F7)
- Keyboard accessible (Esc to close, Tab to navigate)
- Fade-in + scale-up animation (200ms ease-out)

## Dark Mode Design Principles

**Philosophy:**
Trato Hive supports both light and dark modes to accommodate user preferences and reduce eye strain during extended usage.

**Theme Switching:**
- User-controlled toggle in settings/profile menu
- System preference detection on first load
- Smooth 300ms transition between modes
- Preference saved to localStorage and user profile

**Dark Mode Guidelines:**
- **Backgrounds:** Deep Grey (#313131) for main app, #3A3A3A for cards/panels
- **Text:** Cultured White (#F7F7F7) for primary, #D4D4D4 for secondary
- **Accents:** Use Faded Orange (#FFB662) more liberally in dark mode to reduce eye strain
- **Shadows:** Stronger shadows (higher opacity) for visibility on dark backgrounds
- **Citations:** Teal Blue (#2F7E8A) remains consistent in both modes

**Dark Mode Best Practices:**
- Avoid pure black (#000000)—use Deep Grey (#313131) for softer contrast
- Reduce saturation of bright colors to prevent glare
- Use elevated surfaces (#3A3A3A, #424242) to create depth
- Test all components in both modes before shipping

## Hexagonal Visual Language

**Philosophy:**
Hexagons are the visual signature of "The Intelligent Hive"—use them strategically to reinforce branding and visualize connections.

**When to Use Hexagons:**
✓ **Appropriate:**
- Background patterns (subtle honeycomb grids at 20-40% opacity)
- Data visualization nodes (relationship maps, org charts, stakeholder networks)
- Decorative accent elements (hero sections, landing pages)
- Loading states (hexagonal spinner animation)
- Connection diagrams (hexagon nodes + Orange connecting lines)

✗ **Avoid:**
- Buttons (use rounded rectangles for usability)
- Input fields (use rounded rectangles)
- Cards (use rounded rectangles)
- Modals (use rounded rectangles)
- Navigation items (use rounded rectangles)

**Hexagon Specifications:**
- **Colors:** Orange (#EE8D1D) in light mode, Faded Orange (#FFB662) in dark mode
- **Sizes:** 24px (small), 48px (medium), 96px (large), 144px (XL)
- **Stroke width:** 2px for outlined hexagons
- **Connection lines:** Orange (#EE8D1D), 2px stroke, 60% opacity

**Rationale:**
Hexagons evoke the "hive" concept (connected intelligence) but are geometrically complex for interactive UI. We use them for branding and data viz while maintaining rounded rectangles for buttons/inputs to ensure usability and accessibility.

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
- Dark mode particularly important for mobile (battery life, outdoor visibility)

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

> **See Also:** "Agent Instructions" in the Vercel Appendix for machine-enforceable rules.

1. **AI Over-Confidence:** Never present AI outputs as absolute truth without citations.
2. **Inconsistent Styling:** Don't deviate from design tokens for "creative" reasons.
3. **Jargon Overload:** Use user-friendly terms (e.g., "Search with AI" not "TIC query").

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

---

## Appendix: High-Performance Web Standards (Vercel Guidelines)

> **Source:** [Vercel Web Interface Guidelines](https://vercel.com/design/guidelines)
> These supplement The Intelligent Hive with low-level interaction and performance standards. All agents MUST apply these rules during UI generation and review.

### Interactions

| Guideline | Implementation |
|-----------|----------------|
| **Keyboard works everywhere** | All flows are keyboard-operable & follow [WAI-ARIA Authoring Patterns](https://www.w3.org/WAI/ARIA/apg/patterns/). |
| **Clear focus** | Every focusable element shows a visible focus ring. Use `:focus-visible` over `:focus`. |
| **Match visual & hit targets** | If visual target < 24px, expand hit target to ≥ 24px. On mobile, minimum is 44px. |
| **Loading buttons** | Show a spinner **and** keep the original label (e.g., "Saving…"). |
| **Minimum loading-state duration** | Add a short show-delay (~150–300ms) and minimum visible time (~300–500ms) to avoid flicker. |
| **URL as state** | Persist filters, tabs, pagination in the URL so share, refresh, and back/forward work. Consider `nuqs`. |
| **Optimistic updates** | Update UI immediately when success is likely; reconcile on response. On failure, roll back or provide Undo. |
| **Ellipsis convention** | Actions opening a follow-up (e.g., "Rename…") and loading states (e.g., "Saving…") end with an ellipsis. |
| **Confirm destructive actions** | Require confirmation or provide Undo with a safe window. |
| **No dead zones** | If part of a control looks interactive, it should be interactive. |
| **Deep-link everything** | Filters, tabs, expanded panels—anytime `useState` is used, sync the state to the URL. |
| **Overscroll behavior** | Set `overscroll-behavior: contain` in modals and drawers. |

### Animations

| Guideline | Implementation |
|-----------|----------------|
| **Honor `prefers-reduced-motion`** | Always provide a reduced-motion variant. |
| **Implementation preference** | CSS > Web Animations API > JavaScript libraries (e.g., `motion`). |
| **Compositor-friendly** | Prioritize `transform`, `opacity`. Avoid `width`, `height`, `top`, `left` for animations. |
| **Never `transition: all`** | Explicitly list only the properties you intend to animate (e.g., `opacity, transform`). |
| **Interruptible** | User input cancels animations. |
| **Correct transform origin** | Anchor motion to where it "physically" starts. |

### Layout

| Guideline | Implementation |
|-----------|----------------|
| **Optical alignment** | Adjust ±1px when perception beats geometry. |
| **Deliberate alignment** | Every element aligns with something intentionally (grid, baseline, edge). |
| **Responsive coverage** | Verify on mobile, laptop, and ultra-wide (zoom to 50% to simulate). |
| **No excessive scrollbars** | Fix overflow issues. On macOS, set "Show scroll bars" to "Always" to see Windows behavior. |
| **Let the browser size things** | Prefer flex/grid/intrinsic layout over JS measurement. |

### Content

| Guideline | Implementation |
|-----------|----------------|
| **Stable skeletons** | Skeletons mirror final content exactly to avoid layout shift. |
| **Accurate page titles** | `<title>` reflects the current context (e.g., "TechCorp Deal · Trato Hive"). |
| **All states designed** | Empty, sparse, dense, and error states must be designed. |
| **Tabular numbers** | Use `font-variant-numeric: tabular-nums` for columns in data tables. |
| **Redundant status cues** | Don't rely on color alone; include text labels. |
| **Icons have labels** | Convey the same meaning with text for non-sighted users (`aria-label`). |
| **Semantics before ARIA** | Prefer native elements (`button`, `a`, `label`, `table`) before `aria-*`. |

### Forms

| Guideline | Implementation |
|-----------|----------------|
| **Enter submits** | In single-input forms, Enter submits. In multi-line inputs (Tiptap), `⌘/⌃+Enter` submits, Enter inserts a new line. |
| **Labels everywhere** | Every control has a `<label>` or is associated with one for assistive tech. |
| **Don't pre-disable submit** | Allow submitting incomplete forms to surface validation feedback. |
| **No dead zones on controls** | Checkboxes & radios have generous hit targets covering the label. |
| **Error placement** | Show errors next to their fields; on submit, focus the first error. |
| **Placeholders signal emptiness** | Placeholders should end with an ellipsis (e.g., "Search…"). |
| **Unsaved changes warning** | Warn before navigation when data could be lost. |

### Performance

| Guideline | Implementation |
|-----------|----------------|
| **Network latency budgets** | `POST/PATCH/DELETE` complete in <500ms. |
| **Keystroke cost** | Make controlled input loops cheap or prefer uncontrolled inputs. |
| **Large lists** | Virtualize large lists using `virtua` or `content-visibility: auto`. |
| **No image-caused CLS** | Set explicit image dimensions and reserve space using `<Image>` component. |
| **Preload critical fonts** | Use `<link rel="preload">` for critical text to avoid flash & layout shift. |

### Design (Visual Polish)

| Guideline | Implementation |
|-----------|----------------|
| **Layered shadows** | Mimic ambient + direct light with at least two shadow layers. |
| **Crisp borders** | Combine borders and shadows; semi-transparent borders improve edge clarity. |
| **Nested radii** | Child radius ≤ parent radius so curves align concentrically. |
| **Hue consistency** | On non-neutral backgrounds, tint borders/shadows/text toward the same hue. |
| **Minimum contrast** | Prefer APCA over WCAG 2 for more accurate perceptual contrast. |
| **Interactions increase contrast** | `:hover`, `:active`, `:focus` have more contrast than rest state. |
| **Browser UI matches background** | Set `<meta name="theme-color">` to align browser chrome with page background. |
| **Set `color-scheme`** | In dark mode, set `color-scheme: dark` on `<html>` so scrollbars have proper contrast. |

---

### Agent Instructions (AI Code Generation)

When generating or reviewing UI code for this project, agents MUST:

1.  **Read this document first** (specifically the "High-Performance Web Standards" appendix).
2.  **Apply all relevant guidelines** during code generation (e.g., add `tabular-nums` to data tables, add ellipsis to loading text).
3.  **Flag violations** during code review (e.g., "This button does not have a visible focus style").
4.  **Prefer native semantics** over ARIA roles (e.g., use `<button>` not `<div role="button">`).
5.  **Never disable paste** in any input field.
6.  **Never use `transition: all`** in CSS.

