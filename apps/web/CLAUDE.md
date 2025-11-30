# Frontend App Rules (apps/web)

**Parent:** Root CLAUDE.md
**Purpose:** Frontend-specific implementation guidance for Next.js web application
**Last Updated:** 2025-11-16 (Brand Pack Implementation)

---

## 1. Technology Stack

### Core Framework
- **Next.js:** 15.1.8 with App Router (`app/` directory)
- **React:** 19.0.0
- **TypeScript:** 5.6.3 (strict mode enabled)
- **Build Tool:** Turbopack (faster than Webpack)

### Styling & Design
- **CSS Framework:** Tailwind CSS 4.0.0
- **PostCSS:** 8.4.49 + Autoprefixer 10.4.20
- **Class Utilities:**
  - `clsx` 2.1.1 (conditional classes)
  - `tailwind-merge` 2.5.5 (class merging)
  - `class-variance-authority` 0.7.1 (component variants)
- **Design System:** The Intelligent Hive v2.0 (see `/context/style-guide.md`)

### State Management
- **Client State:** Zustand 5.0.2 (lightweight, simple)
- **Server State:** @tanstack/react-query 5.59.20 (caching, synchronization)
- **API Client:** tRPC 11.0.0 (type-safe end-to-end)

### Forms & Validation
- **Forms:** react-hook-form 7.53.2
- **Validation:** Zod 3.23.8 (shared with backend)

### Authentication
- **Auth Provider:** next-auth 5.0.0-beta.25 (NextAuth 5)

### AI Integration
- **AI SDK:** Vercel AI SDK 4.3.19 (streaming, citations)

### Testing
- **Unit:** Vitest 2.1.8 + @testing-library/react 16.0.1
- **E2E:** @playwright/test 1.48.2

---

## 2. Architecture

### Directory Structure

```
apps/web/
├── src/
│   ├── app/                      # Next.js App Router (pages & layouts)
│   │   ├── layout.tsx           # Root layout (fonts, global styles, providers)
│   │   ├── page.tsx             # Homepage / Dashboard
│   │   ├── (auth)/              # Auth group (login, signup)
│   │   ├── deals/               # Deals module pages
│   │   ├── discovery/           # Discovery module pages
│   │   ├── diligence/           # Diligence module pages
│   │   ├── generator/           # Generator module pages
│   │   └── api/                 # API routes (if needed, prefer apps/api)
│   ├── components/              # Page-specific components (NOT shared)
│   │   ├── deals/               # Deal-specific components
│   │   ├── layouts/             # Layout components (Sidebar, Nav)
│   │   └── shared/              # Shared within app only
│   ├── lib/                     # Frontend utilities
│   │   ├── api/                 # tRPC client setup
│   │   ├── auth/                # NextAuth client config
│   │   ├── stores/              # Zustand stores
│   │   └── utils/               # Helper functions
│   └── styles/                  # Global styles
│       └── globals.css          # Tailwind imports + global CSS
├── public/                      # Static assets (images, fonts, icons)
├── tests/                       # Test files
│   ├── unit/                    # Component unit tests
│   ├── integration/             # Integration tests
│   └── e2e/                     # Playwright E2E tests
├── tailwind.config.js           # Tailwind configuration (REQUIRED - see below)
├── postcss.config.js            # PostCSS configuration (REQUIRED)
├── next.config.js               # Next.js configuration
└── package.json                 # Dependencies
```

### App Router Conventions

**Layouts:**
- `layout.tsx` - Shared UI for a segment and its children
- Root layout (`app/layout.tsx`) loads fonts, applies global styles, wraps in providers

**Pages:**
- `page.tsx` - Unique UI for a route
- Use Server Components by default, Client Components only when needed (`'use client'`)

**Loading & Error States:**
- `loading.tsx` - Loading UI (Suspense boundary)
- `error.tsx` - Error UI (Error boundary)

**Route Groups:**
- `(auth)/` - Group routes without affecting URL structure

### Component Organization

**Shared Components:**
- Use `@trato-hive/ui` package for reusable components (Button, Input, Card, Citation, etc.)
- Import: `import { Button, Card } from '@trato-hive/ui'`

**Page-Specific Components:**
- Store in `src/components/{module}/` (e.g., `src/components/deals/DealKanban.tsx`)
- NOT exported from `@trato-hive/ui`

---

## 3. Design System Integration

### The Intelligent Hive v2.0

**Reference Documents:**
- **Style Guide:** `/context/style-guide.md` (comprehensive token reference)
- **Design Principles:** `/context/design-principles.md` (UX guidelines)
- **Color Accessibility:** `/context/color-accessibility.md` (WCAG compliance)

### Required Configuration Files

#### 1. `tailwind.config.js`

**Status:** REQUIRED - Does not exist yet, must be created

**Template:**
```javascript
module.exports = {
  darkMode: 'class', // Enable dark mode via class
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}', // Include UI package
  ],
  theme: {
    extend: {
      colors: {
        // Light Mode Primary
        'bone': '#E2D9CB',
        'alabaster': '#F0EEE6',
        'dark-vanilla': '#CEC2AE',

        // Dark Mode Primary
        'deep-grey': '#313131',
        'panel-dark': '#3A3A3A',
        'panel-darker': '#424242',

        // Text
        'black': '#1A1A1A',
        'cultured-white': '#F7F7F7',
        'text-secondary-light': '#3A3A3A',
        'text-tertiary-light': '#5A5A5A',
        'text-secondary-dark': '#D4D4D4',
        'text-tertiary-dark': '#A4A4A4',

        // Brand Accents (Orange Family)
        'orange': '#EE8D1D',
        'deep-orange': '#CB552F',
        'faded-orange': '#FFB662',

        // Citations Only
        'teal-blue': '#2F7E8A',
        'teal-light': '#4A9DAB',
        'teal-dark': '#246270',

        // Semantic
        'success': '#4CAF50',
        'warning': '#FF9800',
        'error': '#F44336',
        'info': '#2196F3',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'h1': ['3rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        'h2': ['2.25rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '700' }],
        'h3': ['1.75rem', { lineHeight: '1.4', fontWeight: '600' }],
        'h4': ['1.25rem', { lineHeight: '1.5', fontWeight: '600' }],
      },
      spacing: {
        '0': '0px',
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
      },
      borderRadius: {
        'hive-sm': '4px',
        'hive': '8px',
        'hive-lg': '12px',
        'hive-xl': '16px',
      },
      boxShadow: {
        // Light mode shadows
        'hive-sm': '0 1px 2px rgba(0,0,0,0.05)',
        'hive-md': '0 4px 6px rgba(0,0,0,0.07)',
        'hive-lg': '0 10px 15px rgba(0,0,0,0.1)',
        'hive-xl': '0 20px 25px rgba(0,0,0,0.15)',
        // Dark mode shadows
        'hive-sm-dark': '0 1px 2px rgba(0,0,0,0.3)',
        'hive-md-dark': '0 4px 6px rgba(0,0,0,0.4)',
        'hive-lg-dark': '0 10px 15px rgba(0,0,0,0.5)',
        'hive-xl-dark': '0 20px 25px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
}
```

#### 2. `postcss.config.js`

**Status:** REQUIRED - Does not exist yet, must be created

**Template:**
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

#### 3. `src/styles/globals.css`

**Status:** REQUIRED - Does not exist yet, must be created

**Template:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Light mode is default */
    --background: #E2D9CB; /* Bone */
    --foreground: #1A1A1A; /* Black */
  }

  .dark {
    --background: #313131; /* Deep Grey */
    --foreground: #F7F7F7; /* Cultured White */
  }

  body {
    @apply font-sans text-black bg-bone;
    @apply dark:text-cultured-white dark:bg-deep-grey;
    @apply transition-colors duration-300;
  }
}

@layer components {
  /* Component-specific utilities can go here */
}
```

#### 4. `app/layout.tsx`

**Status:** REQUIRED - Does not exist yet, must be created

**Template:**
```typescript
import { Inter } from 'next/font/google'
import '../styles/globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata = {
  title: 'Trato Hive - AI-Native M&A CRM',
  description: 'The intelligent operating system for M&A deal flow',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
```

### Using Design Tokens in Code

**Example: Primary Button Component**

```tsx
// Using Tailwind classes with design tokens
<button className="
  bg-orange hover:bg-faded-orange active:bg-deep-orange
  text-white
  px-4 py-2
  rounded-hive
  font-medium
  transition-colors duration-150
  dark:text-black
">
  Create Deal
</button>
```

**Example: Card Component**

```tsx
<div className="
  bg-alabaster dark:bg-panel-dark
  border border-dark-vanilla dark:border-panel-darker
  rounded-hive
  p-4
  shadow-hive-md dark:shadow-hive-md-dark
  hover:shadow-hive-lg dark:hover:shadow-hive-lg-dark
  transition-shadow duration-250
">
  Card content
</div>
```

**Example: Citation Link**

```tsx
<a href="/source/123" className="
  text-teal-blue
  underline
  hover:text-teal-light
  cursor-pointer
">
  $12.5M EBITDA
</a>
```

### Dark Mode Implementation

**Theme Toggle Component:**

```tsx
'use client'

import { useState, useEffect } from 'react'

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    // Check localStorage and system preference
    const stored = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialTheme = stored ?? (prefersDark ? 'dark' : 'light')
    setTheme(initialTheme)
    document.documentElement.classList.toggle('dark', initialTheme === 'dark')
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
    localStorage.setItem('theme', newTheme)
  }

  return (
    <button onClick={toggleTheme} className="p-2 rounded-hive hover:bg-alabaster dark:hover:bg-panel-dark">
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  )
}
```

---

## 4. Testing Requirements

### Unit Testing (Vitest + React Testing Library)

**File Naming:** `{ComponentName}.test.tsx`
**Location:** `tests/unit/` or co-located with component

**Example:**
```tsx
// tests/unit/Button.test.tsx
import { render, screen } from '@testing-library/react'
import { Button } from '@trato-hive/ui'

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('applies primary variant classes', () => {
    render(<Button variant="primary">Primary</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-orange')
  })
})
```

### E2E Testing (Playwright)

**File Naming:** `{feature}.spec.ts`
**Location:** `tests/e2e/`

**Example:**
```typescript
// tests/e2e/deals.spec.ts
import { test, expect } from '@playwright/test'

test('creates a new deal', async ({ page }) => {
  await page.goto('/deals')
  await page.click('button:has-text("Create Deal")')
  await page.fill('input[name="dealName"]', 'Acme Corp Acquisition')
  await page.click('button:has-text("Save")')
  await expect(page.locator('text=Acme Corp Acquisition')).toBeVisible()
})

test('dark mode toggle works', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('html')).not.toHaveClass(/dark/)
  await page.click('button[aria-label="Toggle theme"]')
  await expect(page.locator('html')).toHaveClass(/dark/)
})
```

### Visual Regression Testing (Playwright)

**Example:**
```typescript
test('homepage renders correctly in light mode', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveScreenshot('homepage-light.png')
})

test('homepage renders correctly in dark mode', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => document.documentElement.classList.add('dark'))
  await expect(page).toHaveScreenshot('homepage-dark.png')
})
```

---

## 5. Visual Development Protocol

### Quick Visual Check (Required After UI Changes)

**Steps:**
1. **Identify changed components/pages**
2. **Start dev server:** `pnpm --filter @trato-hive/web dev`
3. **Navigate to affected pages** in browser
4. **Toggle theme:** Test both light and dark modes
5. **Verify design compliance:**
   - [ ] Background color: Bone (light) or Deep Grey (dark)
   - [ ] Text color: Black (light) or Cultured White (dark)
   - [ ] Orange family for CTAs and accents
   - [ ] Teal Blue ONLY for citations
   - [ ] Inter font for all text
   - [ ] 8px minimum border-radius on interactive components
   - [ ] Proper shadows (light/dark variants)
6. **Check console:** No errors or warnings
7. **Test interactions:** Hover states, click states, focus states
8. **Verify accessibility:**
   - [ ] Keyboard navigation works (Tab, Enter, Esc)
   - [ ] Focus rings visible on interactive elements
   - [ ] Color contrast meets WCAG 2.1 AA (check `/context/color-accessibility.md`)
9. **Capture screenshots:** Full-page at 1440px viewport (both light & dark if applicable)
10. **Update CHANGELOG.md** if user-visible change

### Automated Design Compliance

**Run before committing:**
```bash
# Type check
pnpm typecheck

# Lint (includes style linting)
pnpm lint

# Run tests
pnpm test

# Build (catches build-time errors)
pnpm build
```

---

## 6. Component Development Guidelines

### Using Shared Components from `@trato-hive/ui`

**Available Components (Phase 7.1 - To Be Implemented):**
- `Button` (4 variants: primary, secondary, tertiary, destructive)
- `Input` (with validation states)
- `Card` (3 variants: standard, deal, verifiable fact sheet)
- `Modal`
- `Tabs`
- `Citation` (**CRITICAL** - Teal Blue links with Orange-bordered modal)
- `VerifiableNumber` (number with citation link)
- `HexagonPattern` (decorative honeycomb background)
- `Navigation`

**Import:**
```tsx
import { Button, Card, Citation } from '@trato-hive/ui'
```

### Creating Page-Specific Components

**Location:** `src/components/{module}/`

**Example: DealCard Component**
```tsx
// src/components/deals/DealCard.tsx
import { Card } from '@trato-hive/ui'

interface DealCardProps {
  dealName: string
  stage: string
  value: number
}

export function DealCard({ dealName, stage, value }: DealCardProps) {
  return (
    <Card variant="deal" className="border-t-4 border-t-orange">
      <h3 className="text-h4 font-semibold text-black dark:text-cultured-white">
        {dealName}
      </h3>
      <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
        {stage}
      </p>
      <p className="text-lg font-bold text-deep-orange">${value.toLocaleString()}</p>
    </Card>
  )
}
```

### Hexagonal Decorative Elements

**When to Use:**
- Background patterns (subtle honeycomb grids)
- Data visualization (relationship maps, org charts)
- Hero sections
- Loading states

**When NOT to Use:**
- Buttons (use rounded rectangles)
- Input fields (use rounded rectangles)
- Cards (use rounded rectangles)

**Example: Hexagon Background Pattern**
```tsx
<div className="relative">
  <div
    className="absolute inset-0 opacity-10 dark:opacity-5"
    style={{
      backgroundImage: `
        repeating-linear-gradient(60deg, transparent, transparent 48px, rgba(238, 141, 29, 0.1) 48px, rgba(238, 141, 29, 0.1) 50px),
        repeating-linear-gradient(-60deg, transparent, transparent 48px, rgba(238, 141, 29, 0.1) 48px, rgba(238, 141, 29, 0.1) 50px)
      `
    }}
  />
  <div className="relative z-10">
    {/* Content */}
  </div>
</div>
```

---

## 7. Performance Optimization

### Code Splitting

**Lazy load heavy components:**
```tsx
import dynamic from 'next/dynamic'

const DealKanban = dynamic(() => import('@/components/deals/DealKanban'), {
  loading: () => <SkeletonLoader />,
  ssr: false, // Disable SSR for client-only components
})
```

### Image Optimization

**Use Next.js Image component:**
```tsx
import Image from 'next/image'

<Image
  src="/logo.png"
  alt="Trato Hive"
  width={200}
  height={50}
  priority // For above-the-fold images
/>
```

### Font Loading

**Use next/font for optimized loading:**
```tsx
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Prevents FOUT (Flash of Unstyled Text)
})
```

---

## 8. Accessibility Requirements

**WCAG 2.1 Level AA Compliance (Mandatory)**

### Color Contrast

**Refer to:** `/context/color-accessibility.md` for all approved combinations

**Key Rules:**
- Normal text (<18pt): 4.5:1 minimum
- Large text (≥18pt): 3:1 minimum
- UI components: 3:1 minimum

### Keyboard Navigation

**All interactive elements must be keyboard accessible:**
- Tab: Navigate between elements
- Enter/Space: Activate buttons/links
- Esc: Close modals/dropdowns
- Arrow keys: Navigate lists/tabs

### ARIA Labels

**Use semantic HTML first, ARIA when needed:**
```tsx
// Semantic HTML (preferred)
<button>Create Deal</button>

// ARIA when semantic HTML insufficient
<button aria-label="Close modal">×</button>

// ARIA for complex widgets
<div role="tablist">
  <button role="tab" aria-selected="true">Overview</button>
  <button role="tab" aria-selected="false">Diligence</button>
</div>
```

### Focus States

**Always show visible focus rings:**
```tsx
<button className="
  focus:outline-none
  focus:ring-2
  focus:ring-orange
  focus:ring-opacity-50
">
  Click me
</button>
```

---

## 9. Common Patterns & Anti-Patterns

### ✅ DO

**Use Server Components by default:**
```tsx
// app/deals/page.tsx (Server Component)
export default async function DealsPage() {
  const deals = await fetchDeals() // Fetch on server
  return <DealList deals={deals} />
}
```

**Use Client Components for interactivity:**
```tsx
// components/deals/DealKanban.tsx (Client Component)
'use client'

import { useState } from 'react'

export function DealKanban() {
  const [deals, setDeals] = useState([])
  // Interactive logic here
}
```

**Use design tokens consistently:**
```tsx
// Good
<div className="bg-bone dark:bg-deep-grey">

// Bad - custom hex value
<div className="bg-[#E2D9CB]">
```

**Use semantic color names:**
```tsx
// Good
<button className="bg-orange text-white">

// Bad - ambiguous name
<button className="bg-primary text-white">
```

### ❌ DON'T

**Don't use Teal Blue for general links:**
```tsx
// Bad - Teal Blue is ONLY for citations
<a className="text-teal-blue">General link</a>

// Good - Use Orange for general links
<a className="text-orange hover:text-faded-orange">General link</a>
```

**Don't use serif fonts:**
```tsx
// Bad - Lora was removed in v2.0
<h1 className="font-serif">Heading</h1>

// Good - Inter for all text
<h1 className="font-sans text-h1">Heading</h1>
```

**Don't use hexagons for buttons:**
```tsx
// Bad - Hexagons are decorative only
<button className="hexagon-shape">Click</button>

// Good - Rounded rectangles for interactive UI
<button className="rounded-hive">Click</button>
```

**Don't skip dark mode:**
```tsx
// Bad - Light mode only
<div className="bg-white text-black">

// Good - Both modes
<div className="bg-alabaster dark:bg-panel-dark text-black dark:text-cultured-white">
```

---

## 10. Troubleshooting

### Common Issues

**1. Tailwind classes not applying**
- Check `tailwind.config.js` `content` array includes your file paths
- Run `pnpm build` to regenerate Tailwind styles
- Verify `globals.css` imports Tailwind directives

**2. Dark mode not working**
- Ensure `darkMode: 'class'` in `tailwind.config.js`
- Verify `<html>` tag has `dark` class when toggled
- Check component uses `dark:` prefix for dark mode classes

**3. Fonts not loading**
- Verify `next/font/google` import in `app/layout.tsx`
- Check font variable applied to `<html>` tag
- Ensure `font-sans` class applied to body in `globals.css`

**4. Build errors**
- Run `pnpm typecheck` to identify TypeScript errors
- Run `pnpm lint` to identify linting errors
- Check all imports use correct paths (`@/` for src/, `@trato-hive/ui` for components)

---

## 11. Deployment Checklist

Before deploying to production:

- [ ] All tests pass (`pnpm test`)
- [ ] Type checking passes (`pnpm typecheck`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Visual regression tests pass (Playwright screenshots)
- [ ] Dark mode tested on all pages
- [ ] Accessibility tested (keyboard nav, screen reader)
- [ ] Color contrast verified (WCAG 2.1 AA)
- [ ] Performance tested (Lighthouse score ≥90)
- [ ] CHANGELOG.md updated
- [ ] PROJECT_STATUS.md updated

---

## 12. Resources

**Documentation:**
- Style Guide: `/context/style-guide.md`
- Design Principles: `/context/design-principles.md`
- Color Accessibility: `/context/color-accessibility.md`
- Root CLAUDE.md: Section 8 (Design Governance)

**External:**
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Inter Font (Google Fonts)](https://fonts.google.com/specimen/Inter)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Heroicons](https://heroicons.com/)

**Tools:**
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Tailwind Play (Playground)](https://play.tailwindcss.com/)
- [Chrome DevTools Accessibility Panel](https://developer.chrome.com/docs/devtools/accessibility/reference/)
