# Backend API Application (apps/api)

## Purpose

Backend API service (Layer 3) handling tRPC requests, authentication, and business logic orchestration.

## Commands

- **Dev:** `pnpm dev` (starts Fastify server on port 4000)
- **Build:** `pnpm build` (uses tsup)
- **Test:** `pnpm test` (Vitest)
- **Lint:** `pnpm lint`

## Tech Stack

- **Framework:** Fastify v5 (Server), tRPC v11 (API Layer)
- **Runtime:** Node.js 20+
- **Validation:** Zod
- **Auth:** NextAuth.js v5 (via `@trato-hive/auth`)
- **Queue:** BullMQ (via `@trato-hive/data-plane`)

## Architecture

```
apps/api/src/
├── index.ts              # Entry point (Fastify + tRPC adapter)
├── routers/              # tRPC routers (procedures)
│   ├── index.ts          # Root router
│   └── deal.ts           # Feature routers
├── services/             # Business logic (DB access)
├── middleware/           # Auth & logging
└── utils/                # tRPC context & error helpers
```

## Common Patterns

### tRPC Router

```typescript
import { router, protectedProcedure } from '../trpc'
import { z } from 'zod'

export const exampleRouter = router({
  hello: protectedProcedure.input(z.object({ text: z.string() })).query(({ input, ctx }) => {
    return { greeting: `Hello ${input.text}`, user: ctx.session.user }
  }),
})
```

### Service Layer

```typescript
// services/deal-service.ts
export class DealService {
  async listDeals(input: ListInput, session: Session) {
    return db.deal.findMany({ where: { firmId: session.user.firmId } })
  }
}
```

### Context Usage

- `ctx.session`: Current user session (User, Firm ID, Role)
- `ctx.db`: Prisma client instance

## Non-Negotiables

- **Type Safety:** All procedures must define Zod input/output schemas.
- **Auth:** Use `protectedProcedure` by default.
- **Error Handling:** Throw `TRPCError` with appropriate code (e.g., `UNAUTHORIZED`, `NOT_FOUND`).
- **Stateless:** No local state; use Redis/DB.
- **Env Vars:** Never commit `.env`; use validated config.
