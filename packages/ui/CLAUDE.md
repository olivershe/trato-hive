# UI Component Library (@trato-hive/ui)

**Parent:** Root CLAUDE.md
**Purpose:** Shared component library for Trato Hive frontend applications
**Last Updated:** 2025-11-16 (Brand Pack Implementation)

---

## Purpose

The `@trato-hive/ui` package provides a reusable component library implementing The Intelligent Hive v2.0 design system. All components follow strict design tokens, accessibility standards (WCAG 2.1 AA), and support both light and dark modes.

**Design System:** The Intelligent Hive v2.0
**Reference Documents:**
- `/context/style-guide.md` - Comprehensive design tokens
- `/context/design-principles.md` - UX guidelines
- `/context/color-accessibility.md` - WCAG compliance

---

## Ownership

**Owner:** Frontend Team
**Consumers:** `apps/web/` (Next.js frontend), future apps

**Shared Responsibility:**
- Component API design
- Accessibility compliance
- Visual consistency
- Dark mode support
- TypeScript type safety

---

## Technology Stack

**Build System:**
- **tsup** 8.3.5 - Dual output (CJS + ESM)
- **TypeScript** 5.6.3 (strict mode)

**Styling:**
- **Tailwind CSS** 4.0.0 (peer dependency)
- **class-variance-authority** 0.7.1 (component variants)
- **clsx** 2.1.1 (conditional classes)
- **tailwind-merge** 2.5.5 (class merging)

**React:**
- Peer dependency: React 19+ and React DOM 19+

---

## Exports

### Current Exports (v0.1.0)

**Utilities:**
- `cn()` - Tailwind class merging utility

**Location:** `src/lib/utils.ts`

```typescript
import { cn } from '@trato-hive/ui'

// Usage
const className = cn('bg-bone', 'text-black', isDark && 'dark:bg-deep-grey')
```

### Planned Exports (Phase 7.1 - Implementation Required)

**Core Components (9):**
1. `Button` - 4 variants (primary, secondary, tertiary, destructive)
2. `Input` - With validation states
3. `Card` - 3 variants (standard, deal, verifiable fact sheet)
4. `Modal` - With overlay and focus trap
5. `Tabs` - Tab navigation with active states
6. `Citation` - **CRITICAL** - Teal Blue links with Orange-bordered modal
7. `VerifiableNumber` - Number with citation link
8. `HexagonPattern` - Decorative honeycomb background
9. `Navigation` - Top nav bar with active states

**Import Pattern:**
```typescript
import { Button, Card, Citation, Modal } from '@trato-hive/ui'
```

---

## Component Development Guidelines

### File Structure

```
packages/ui/src/
├── components/           # Component implementations
│   ├── Button.tsx       # Button component + variants
│   ├── Card.tsx         # Card component + variants
│   ├── Citation.tsx     # Citation link + modal (CRITICAL)
│   ├── Input.tsx        # Input field + validation
│   ├── Modal.tsx        # Modal with overlay
│   ├── Tabs.tsx         # Tab navigation
│   ├── VerifiableNumber.tsx
│   ├── HexagonPattern.tsx
│   └── Navigation.tsx
├── lib/
│   └── utils.ts         # Utility functions (cn)
├── tokens/              # Design token exports (TO BE CREATED)
│   ├── colors.ts        # Color constants
│   ├── typography.ts    # Font sizes, weights
│   ├── spacing.ts       # Spacing scale
│   ├── borderRadius.ts  # Border radius tokens
│   └── shadows.ts       # Shadow tokens
└── index.ts             # Main export file
```

### Component Template

**Basic Component Structure:**

```typescript
// src/components/Button.tsx
import { type VariantProps, cva } from 'class-variance-authority'
import { cn } from '../lib/utils'

const buttonVariants = cva(
  // Base styles (always applied)
  'inline-flex items-center justify-center rounded-hive font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange focus:ring-opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-orange hover:bg-faded-orange active:bg-deep-orange text-white dark:text-black',
        secondary: 'border-2 border-black dark:border-cultured-white hover:bg-alabaster dark:hover:bg-panel-dark text-black dark:text-cultured-white',
        tertiary: 'text-orange dark:text-faded-orange hover:underline',
        destructive: 'bg-error hover:bg-red-600 active:bg-red-700 text-white',
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
}
```

### Design Token Usage

**Create Token Files (REQUIRED - Phase 7.1):**

**`src/tokens/colors.ts`:**
```typescript
export const colors = {
  // Light Mode
  bone: '#E2D9CB',
  alabaster: '#F0EEE6',
  darkVanilla: '#CEC2AE',

  // Dark Mode
  deepGrey: '#313131',
  panelDark: '#3A3A3A',
  panelDarker: '#424242',

  // Text
  black: '#1A1A1A',
  culturedWhite: '#F7F7F7',

  // Brand (Orange Family)
  orange: '#EE8D1D',
  deepOrange: '#CB552F',
  fadedOrange: '#FFB662',

  // Citations Only
  tealBlue: '#2F7E8A',
  tealLight: '#4A9DAB',
  tealDark: '#246270',

  // Semantic
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
} as const

export type ColorKey = keyof typeof colors
```

**Usage in Components:**
```typescript
import { colors } from '../tokens/colors'

// Use in inline styles (rare - prefer Tailwind classes)
<div style={{ backgroundColor: colors.bone }}>
```

### Accessibility Requirements

**WCAG 2.1 AA Compliance (Mandatory):**

1. **Color Contrast:**
   - Refer to `/context/color-accessibility.md` for approved combinations
   - All text must meet 4.5:1 ratio (normal) or 3:1 (large)
   - All UI components must meet 3:1 ratio

2. **Keyboard Navigation:**
   - All interactive elements must be keyboard accessible
   - Focus states must be visible (2px Orange ring)
   - Tab order must be logical

3. **ARIA Labels:**
   - Use semantic HTML first
   - Add ARIA labels when semantic HTML insufficient
   - All interactive elements must have accessible names

**Example:**
```typescript
export function Modal({ title, children, onClose }: ModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="..."
    >
      <button
        onClick={onClose}
        aria-label="Close modal"
        className="focus:ring-2 focus:ring-orange focus:ring-opacity-50"
      >
        ×
      </button>
      <h2 id="modal-title">{title}</h2>
      {children}
    </div>
  )
}
```

### Dark Mode Support

**All components MUST support dark mode using Tailwind's `dark:` prefix:**

```typescript
// Good - Both modes supported
<div className="bg-alabaster dark:bg-panel-dark text-black dark:text-cultured-white">

// Bad - Light mode only
<div className="bg-white text-black">
```

**Testing Dark Mode:**
- Test component in both light and dark modes
- Verify all text meets contrast requirements in both modes
- Ensure interactive states visible in both modes

---

## Critical Components

### 1. Citation Component (THE Killer Feature)

**Priority:** CRITICAL
**Complexity:** High
**Time Estimate:** 2 hours

**Requirements:**
- Teal Blue (#2F7E8A) link with underline
- Hover: Teal Light (#4A9DAB)
- Click: Opens modal with Orange (#EE8D1D) border
- Modal loads in <200ms (performance requirement)
- Modal shows: source document name, excerpt with highlighted text, link to full document

**Example API:**
```typescript
<Citation sourceId="doc-123" excerpt="EBITDA: $12.5M">
  $12.5M
</Citation>
```

**Implementation Notes:**
- Use `<dialog>` element for modal (native focus trap)
- Implement lazy loading for modal content
- Preload source excerpt on hover (prefetch)
- Use Suspense for async loading

### 2. Button Component

**Priority:** HIGH
**Complexity:** Low
**Time Estimate:** 1.5 hours

**Variants:**
1. Primary (Orange, white text)
2. Secondary (Outline, Black/White border)
3. Tertiary (Text only, Orange)
4. Destructive (Red, white text)

**States:**
- Default, Hover, Active, Focus, Disabled

### 3. Card Component

**Priority:** HIGH
**Complexity:** Medium
**Time Estimate:** 1 hour

**Variants:**
1. Standard (Alabaster bg, Dark Vanilla border)
2. Deal Card (Orange 4px top border, hover lift)
3. Verifiable Fact Sheet (White bg, Orange 2px border, prominent)

---

## Testing

### Unit Testing (Required)

**Framework:** Vitest + @testing-library/react

**Test Files:** Co-located with components or in `tests/` directory

**Example:**
```typescript
// src/components/Button.test.tsx
import { render, screen } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })

  it('applies primary variant by default', () => {
    render(<Button>Primary</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-orange')
  })

  it('applies secondary variant when specified', () => {
    render(<Button variant="secondary">Secondary</Button>)
    expect(screen.getByRole('button')).toHaveClass('border-2')
  })

  it('is keyboard accessible', () => {
    render(<Button>Click</Button>)
    const button = screen.getByRole('button')
    button.focus()
    expect(button).toHaveFocus()
  })
})
```

### Accessibility Testing

**Automated:**
```bash
# Run axe accessibility tests
pnpm test:a11y
```

**Manual:**
- Keyboard navigation (Tab, Enter, Esc)
- Screen reader testing (VoiceOver, NVDA)
- Color contrast verification (WebAIM Contrast Checker)
- Focus state visibility

### Visual Regression Testing

**Storybook (To Be Set Up):**
```bash
# Initialize Storybook
npx storybook@latest init

# Run Storybook
pnpm storybook

# Run visual regression tests
pnpm test:visual
```

**Example Story:**
```typescript
// src/components/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Button>

export const Primary: Story = {
  args: {
    children: 'Primary Button',
    variant: 'primary',
  },
}

export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary',
  },
}

export const DarkMode: Story = {
  args: {
    children: 'Dark Mode Button',
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [(Story) => <div className="dark"><Story /></div>],
}
```

---

## Build & Distribution

### Build Configuration

**File:** `tsconfig.json`

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "**/*.test.tsx"]
}
```

**File:** `package.json`

```json
{
  "name": "@trato-hive/ui",
  "version": "0.1.0",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "require": "./dist/index.js",
      "import": "./dist/index.mjs",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "dev": "tsup src/index.ts --format cjs,esm --dts --watch",
    "test": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```

### Publishing (Future)

**When ready to publish to npm:**
1. Update version in `package.json` (semantic versioning)
2. Build: `pnpm build`
3. Test: `pnpm test`
4. Typecheck: `pnpm typecheck`
5. Publish: `npm publish --access public`

---

## Component Development Checklist

Before marking a component as "complete":

**Design Compliance:**
- [ ] Uses design tokens from Tailwind config (no custom hex values)
- [ ] Bone background (light mode) or Deep Grey (dark mode)
- [ ] Orange family for CTAs and accents
- [ ] Teal Blue ONLY for citations
- [ ] Inter font for all text
- [ ] 8px minimum border-radius on interactive components
- [ ] Proper shadows (light/dark variants)

**Accessibility:**
- [ ] WCAG 2.1 AA contrast ratios verified (4.5:1 normal text, 3:1 UI)
- [ ] Keyboard navigation works (Tab, Enter, Esc, Arrow keys)
- [ ] Focus states visible (2px Orange ring, 50% opacity)
- [ ] ARIA labels where needed
- [ ] Semantic HTML used
- [ ] Screen reader tested

**Dark Mode:**
- [ ] Dark mode variant implemented
- [ ] Tested in both light and dark modes
- [ ] Contrast ratios verified for dark mode
- [ ] Interactive states visible in dark mode

**Testing:**
- [ ] Unit tests written (≥80% coverage)
- [ ] Accessibility tests pass
- [ ] Storybook story created
- [ ] Visual regression tests pass

**TypeScript:**
- [ ] Strict type checking enabled
- [ ] Props interface exported
- [ ] No `any` types used
- [ ] Type checking passes

**Documentation:**
- [ ] Storybook story includes all variants
- [ ] Props documented with JSDoc comments
- [ ] Usage examples provided
- [ ] Accessibility notes included

---

## Common Patterns

### Using `cn()` Utility

**Always use `cn()` for merging Tailwind classes:**

```typescript
import { cn } from '../lib/utils'

// Good
<div className={cn('bg-bone', 'text-black', className)} />

// Bad - manual string concatenation
<div className={'bg-bone text-black ' + className} />
```

### Component Variants with CVA

**Use `class-variance-authority` for variant management:**

```typescript
import { cva, type VariantProps } from 'class-variance-authority'

const cardVariants = cva(
  'rounded-hive shadow-hive-md',
  {
    variants: {
      variant: {
        standard: 'bg-alabaster dark:bg-panel-dark border border-dark-vanilla',
        deal: 'bg-alabaster dark:bg-panel-dark border-t-4 border-t-orange',
        fact: 'bg-white dark:bg-panel-dark border-2 border-orange',
      },
    },
    defaultVariants: {
      variant: 'standard',
    },
  }
)

export interface CardProps extends VariantProps<typeof cardVariants> {
  children: React.ReactNode
}
```

### Forwarding Refs

**Use `forwardRef` for components that need ref access:**

```typescript
import { forwardRef } from 'react'

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn('rounded-hive border border-dark-vanilla', className)}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'
```

---

## Anti-Patterns

### ❌ DON'T

**Don't use inline hex values:**
```typescript
// Bad
<div style={{ color: '#EE8D1D' }}>

// Good
<div className="text-orange">
```

**Don't skip dark mode:**
```typescript
// Bad
<div className="bg-white text-black">

// Good
<div className="bg-alabaster dark:bg-panel-dark text-black dark:text-cultured-white">
```

**Don't use Teal Blue for non-citations:**
```typescript
// Bad - Teal Blue is ONLY for citations
<button className="text-teal-blue">Click</button>

// Good
<button className="text-orange">Click</button>
```

**Don't skip accessibility:**
```typescript
// Bad - no focus state, no ARIA
<div onClick={handleClick}>Click me</div>

// Good - button, keyboard accessible, ARIA
<button onClick={handleClick} aria-label="Close">×</button>
```

---

## Resources

**Documentation:**
- Style Guide: `/context/style-guide.md`
- Design Principles: `/context/design-principles.md`
- Color Accessibility: `/context/color-accessibility.md`
- Apps/Web CLAUDE.md: Frontend integration guide

**External:**
- [Radix UI](https://www.radix-ui.com/) - Unstyled accessible components
- [class-variance-authority](https://cva.style/docs) - CVA docs
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Storybook](https://storybook.js.org/docs/react/get-started/introduction)

**Tools:**
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [React DevTools](https://react.dev/learn/react-developer-tools)
