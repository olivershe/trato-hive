---
description: Conduct a UI/UX design review ensuring "The Intelligent Hive" standards
---

# Design Review Workflow

Use this workflow to review UI changes for compliance with "The Intelligent Hive" design system.

## 1. Preparation

1.  Read `context/design-principles.md` and `context/style-guide.md`.
2.  Read `apps/web/CLAUDE.md`.

## 2. Visual Compliance

- **Colors:** Soft Sand (#F5EFE7), Gold (#E2A74A), Charcoal (#1A1A1A), Teal Blue (#2F7E8A - Citations ONLY).
- **Typography:** Headings (Lora/Playfair), Body (Inter/Public Sans).
- **Spacing:** 4px grid.
- **Radius:** ≥8px.

## 3. Citation-First Principle (CRITICAL)

- Verify every AI-generated fact has a visible, clickable link.
- Verify link color is Teal Blue (#2F7E8A).
- Verify citation modal opens with source metadata.

## 4. Accessibility & Responsiveness

- **WCAG 2.1 AA:** Check contrast ratios.
- **Keyboard:** Verify navigation and focus states.
- **Responsiveness:** Check 1440px, 768px, and 375px viewports.

## 5. Component Quality

- Verify usage of `@trato-hive/ui` components.
- Check for hardcoded values (should use tokens).
- Check for console errors.

## 6. Report Generation

Generate a report in the following format:

```markdown
## Design Review

**Decision:** [GREEN/YELLOW/RED]

### Findings

- [Blocker/High/Medium/Nit]: [Issue Description]

### Screenshots

[Attach screenshots if applicable]
```
