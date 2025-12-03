## 8. Design Governance (The Intelligent Hive)

**Design System Version:** 2.0 (Brand Pack Implementation)
**Last Updated:** 2025-11-16

### Design System Tokens

**Light Mode Colors:**
- **Bone:** `#E2D9CB` (primary app background)
- **Alabaster:** `#F0EEE6` (card/panel backgrounds)
- **Dark Vanilla:** `#CEC2AE` (secondary panels, borders)
- **Black:** `#1A1A1A` (primary text)
- **Orange:** `#EE8D1D` (primary CTAs, accent borders, interactive elements)
- **Deep Orange:** `#CB552F` (strong CTAs, urgent actions)
- **Faded Orange:** `#FFB662` (hover states, tertiary accents)
- **Teal Blue:** `#2F7E8A` (**CITATIONS ONLY** - verifiable fact links)

**Dark Mode Colors:**
- **Deep Grey:** `#313131` (primary app background)
- **Panel Dark:** `#3A3A3A` (card/panel backgrounds)
- **Panel Darker:** `#424242` (elevated surfaces)
- **Cultured White:** `#F7F7F7` (primary text)
- **Orange:** `#EE8D1D` (primary CTAs, accent borders)
- **Faded Orange:** `#FFB662` (links, hover states - softer for dark mode)
- **Teal Blue:** `#2F7E8A` (**CITATIONS ONLY** - consistent across modes)

**Typography:**
- **All Text:** Inter (Google Fonts) - Modern Sans Serif
- **Weights:** 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)
- **No Serif Fonts:** Previous versions used Lora for headings—removed in v2.0

**UI Principles:**
- **Rounded corners** for interactive components (8px border-radius minimum)
- **Hexagonal patterns** for branding, decorative elements, and data visualization
- **Orange accent lines** for prominent cards (4px border-top on Deal cards)
- **Citation links** always in Teal Blue `#2F7E8A` with underline (NEVER use Teal for general links/buttons)
- **Citation modals** have Orange `#EE8D1D` borders and must load in <200ms
- All numbers in verifiable contexts must be hyperlinked to sources
- **Dark mode support** with smooth 300ms transitions between themes

### Visual Development Protocol

**Quick Visual Check (after any UI change):**
1. Identify changed components/pages
2. Navigate affected pages via Playwright browser control
3. Verify design compliance: check `/context/design-principles.md` & `/context/style-guide.md`
4. Validate feature intent: ensure change fulfills acceptance criteria
5. **Test both light AND dark modes** - toggle theme and verify colors, contrast, readability
6. Capture evidence: full-page screenshot at 1440px desktop viewport (both modes if applicable)
7. Check errors: run console messages check and fix issues
8. **Verify color accessibility:** Check `/context/color-accessibility.md` for approved combinations
9. Log: attach screenshots to PR; update CHANGELOG if user-visible

**Comprehensive Design Review (before PR merge of significant UI/UX):**
- Invoke `@agent-design-review` for accessibility, responsiveness, token usage checks
- Require Green decision (or resolved Yellow items) before merge
- Must include dark mode testing and WCAG 2.1 AA compliance verification

**Design Compliance Checklist:**
- [ ] Bone `#E2D9CB` background in light mode, Deep Grey `#313131` in dark mode
- [ ] Orange family (`#EE8D1D`, `#CB552F`, `#FFB662`) used for CTAs and accents
- [ ] Teal Blue `#2F7E8A` used ONLY for citations
- [ ] Inter font used for all text (no Lora serif)
- [ ] Hexagons used for decorative/branding only (not buttons/inputs)
- [ ] All text meets WCAG 2.1 AA contrast ratios (4.5:1 normal, 3:1 large)
- [ ] Dark mode variant implemented and tested
- [ ] Citation modal has Orange border and loads in <200ms

**Slash Commands:**
- `/design:quick-check {scope}`: Run Quick Visual Check on {scope}
- `/design:review {scope}`: Invoke comprehensive design review agent