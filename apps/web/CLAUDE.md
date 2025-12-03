# Frontend Application (apps/web)

## Purpose

Next.js 15+ frontend application (Layer 7) implementing "The Intelligent Hive v2.0" design system.

## Commands

- **Dev:** `pnpm dev` (starts Next.js on port 3000)
- **Build:** `pnpm build` (Turbopack)
- **Test:** `pnpm test` (Vitest), `pnpm test:e2e` (Playwright)
- **Lint:** `pnpm lint`

## Tech Stack

- **Framework:** Next.js 15 (App Router), React 19
- **Styling:** Tailwind CSS 4, `@trato-hive/ui` (Shared Components)
- **State:** Zustand (Client), TanStack Query (Server), tRPC (API)
- **Auth:** NextAuth.js v5 (Client)
- **AI:** Vercel AI SDK

## Architecture

```
apps/web/src/
├── app/                  # App Router (pages/layouts)
│   ├── (auth)/           # Auth routes
│   ├── deals/            # Feature routes
│   └── layout.tsx        # Root layout
├── components/           # Local components
│   ├── deals/            # Feature-specific
│   └── layouts/          # App shells
├── lib/                  # Utilities (api, auth, stores)
└── styles/               # Global CSS
```

## Design System (The Intelligent Hive v2.0)

- **Colors:** `bg-bone` (Light), `bg-deep-grey` (Dark), `text-orange` (Brand).
- **Typography:** Inter (sans-serif).
- **Components:** Import from `@trato-hive/ui`.
  ```tsx
  import { Button, Card } from '@trato-hive/ui'
  ```
- **Dark Mode:** Use `dark:` prefix. `bg-alabaster dark:bg-panel-dark`.

## Common Patterns

### Server Component (Data Fetching)

```tsx
// app/deals/page.tsx
export default async function DealsPage() {
  const deals = await trpc.deal.list.query()
  return <DealList deals={deals} />
}
```

### Client Component (Interactivity)

```tsx
'use client'
import { trpc } from '@/lib/api'

export function CreateDealBtn() {
  const utils = trpc.useUtils()
  const mutation = trpc.deal.create.useMutation({
    onSuccess: () => utils.deal.list.invalidate(),
  })
  return <Button onClick={() => mutation.mutate({ name: 'New Deal' })}>Create</Button>
}
```

## Non-Negotiables

- **Design Tokens:** NO magic hex codes. Use Tailwind classes.
- **Components:** Prefer `@trato-hive/ui` over custom implementations.
- **Accessibility:** WCAG 2.1 AA (contrast, keyboard nav).
- **Type Safety:** Strict TypeScript.
