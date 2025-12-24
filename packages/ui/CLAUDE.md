# UI Package (@trato-hive/ui)

## Purpose

Shared component library (Layer 5) implementing "The Intelligent Hive v2.0".

## Tech Stack

- **Styling:** Tailwind CSS 4, `cva`, `clsx`
- **Build:** tsup (React 19 compatible)

## Critical Components

- **Citation:** Teal Blue link opening verification modal.
- **Button:** Primary (Orange), Secondary, Tertiary.
- **Card:** Standard, Deal, Fact variants.
- **Block Editor:** Tiptap-based "Notion-like" editor.
- **Block Renderer:** Recursive component for rendering page trees.

## Common Patterns

### Component Definition

```tsx
// components/Button.tsx
const buttonVariants = cva('base-styles', { variants: { ... } });
export function Button({ variant, ...props }) {
  return <button className={cn(buttonVariants({ variant }), props.className)} {...props} />;
}
```

### Using Colors

Use Tailwind classes (`text-orange`, `bg-bone`), NOT hex codes.

## Non-Negotiables

- **Accessibility:** WCAG 2.1 AA (Contrast, Keyboard).
- **Dark Mode:** Support `dark:` variants for everything.
- **Citations:** Must use Teal Blue (`#2F7E8A`).
- **Tokens:** No magic values; use design tokens.
