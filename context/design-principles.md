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
