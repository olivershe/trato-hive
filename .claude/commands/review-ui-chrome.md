# Chrome UI Review

Interactive UI review using the Claude Chrome extension for real-time browser automation.

## Prerequisites
- Chrome browser open with Claude extension installed
- Dev server running (`pnpm dev` on localhost:3000)

## Usage
```
/review-ui-chrome [url]
```
If no URL provided, defaults to `http://localhost:3000`

## Review Process

### 1. Setup
1. Call `tabs_context_mcp` to get/create browser tab
2. Navigate to target URL
3. Wait for page load (check title changes from "localhost")
4. Take initial screenshot

### 2. Visual Review Checklist
For each page/view, check:

**Layout & Hierarchy**
- [ ] Clear visual hierarchy (headings, sections)
- [ ] Consistent spacing (4px base unit)
- [ ] No ghost/duplicate text rendering issues
- [ ] Proper alignment (grid-based)

**Brand Compliance (The Intelligent Hive)**
- [ ] Orange (#EE8D1D) for primary CTAs only
- [ ] Teal Blue (#2F7E8A) for citations ONLY
- [ ] Bone (#E2D9CB) background in light mode
- [ ] Inter font family throughout
- [ ] 12px border-radius on cards/modals

**Empty & Loading States**
- [ ] Skeleton loaders (not blank screens)
- [ ] Actionable empty states with illustrations
- [ ] Loading spinners have labels ("Loading...")
- [ ] No stuck loading indicators

**Interactive Elements**
- [ ] All buttons have visible labels
- [ ] Hover states increase contrast
- [ ] Focus rings visible (`:focus-visible`)
- [ ] Touch targets ≥44px on mobile

### 3. Accessibility Audit
Use `read_page` with `filter: "interactive"` to check:

- [ ] All buttons have accessible names (`aria-label` or text content)
- [ ] All links have descriptive text (not "click here")
- [ ] Form inputs have associated labels
- [ ] Images have alt text
- [ ] Proper heading hierarchy (h1 → h2 → h3)

### 4. Console Check
Use `read_console_messages` with `onlyErrors: true` to check:

- [ ] No JavaScript errors
- [ ] No failed network requests
- [ ] Debug logs use `console.log` not `console.error`

### 5. Responsive Testing
Use `resize_window` to test breakpoints:

| Breakpoint | Width | Height |
|------------|-------|--------|
| Mobile | 375 | 812 |
| Tablet | 768 | 1024 |
| Laptop | 1024 | 768 |
| Desktop | 1440 | 900 |

**Note:** Chrome extension may have viewport capture limitations. For comprehensive responsive testing, use browser DevTools.

### 6. View Switching
For pages with multiple views (Board/Table/Timeline):
1. Click each view tab
2. Screenshot each view
3. Verify consistent styling across views

## Output Format

Generate a report with:

```markdown
## UI Review Report: [Page Name] ([URL])

### Screenshots
[Attach screenshots with IDs]

### Positives
| Category | Details |
|----------|---------|
| ... | ... |

### Issues Found
| Severity | Issue | Location | Recommendation |
|----------|-------|----------|----------------|
| High/Medium/Low | ... | ... | ... |

### Accessibility
- Buttons without labels: [list refs]
- Missing ARIA: [list issues]

### Console
- Errors: [count]
- Warnings: [count]

### Recommendation
[ ] Approve - Ready to merge
[ ] Needs Revision - Fix issues first
```

## Tools Used
- `mcp__claude-in-chrome__tabs_context_mcp` - Get/create tab
- `mcp__claude-in-chrome__navigate` - Go to URL
- `mcp__claude-in-chrome__computer` (screenshot) - Capture views
- `mcp__claude-in-chrome__computer` (wait) - Wait for loads
- `mcp__claude-in-chrome__computer` (left_click) - Interact with UI
- `mcp__claude-in-chrome__read_page` - Get accessibility tree
- `mcp__claude-in-chrome__find` - Locate elements by description
- `mcp__claude-in-chrome__read_console_messages` - Check for errors
- `mcp__claude-in-chrome__resize_window` - Test breakpoints

## Design References
- `/context/design-principles.md` - Core design principles
- `/context/design-tokens.md` - Color/typography tokens
- `/context/style-guide.md` - Component patterns
