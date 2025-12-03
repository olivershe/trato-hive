# Auth Package (@trato-hive/auth)

## Purpose

Centralized authentication (Layer 6) using NextAuth 5 and RBAC middleware.

## Tech Stack

- **Auth:** NextAuth.js v5, `@auth/prisma-adapter`
- **Database:** Prisma (User, Session tables)
- **Providers:** Credentials, Google, Azure AD, SAML

## Architecture

- **Session:** Database-backed sessions (secure, revocable).
- **RBAC:** Role-based access control (Admin, Manager, Analyst, Viewer).
- **Multi-Tenancy:** `firmId` on user session.

## Common Patterns

### tRPC Middleware

```typescript
// middleware.ts
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) throw new TRPCError({ code: 'UNAUTHORIZED' })
  return next({ ctx: { session: ctx.session } })
})

export const requireFirm = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.session.user.firmId) throw new TRPCError({ code: 'FORBIDDEN' })
  return next({ ctx: { firmId: ctx.session.user.firmId } })
})
```

### Role Check

```typescript
// utils.ts
if (!hasRole(session, 'Admin')) {
  throw new Error('Unauthorized')
}
```

## Non-Negotiables

- **Security:** Always use `protectedProcedure` for private routes.
- **Isolation:** Always enforce `firmId` check (Multi-tenancy).
- **Hashing:** Use bcrypt (≥10 rounds).
- **Secrets:** Use env vars (`NEXTAUTH_SECRET`).
