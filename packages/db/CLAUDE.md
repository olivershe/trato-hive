# Database Package (@trato-hive/db)

## Purpose

Type-safe database client (Prisma/PostgreSQL) with multi-tenancy enforcement.

## Tech Stack

- **DB:** PostgreSQL 16+
- **ORM:** Prisma 6
- **Migration:** Prisma Migrate

## Schema Overview

- **Core:** `User`, `Organization`, `OrganizationMember`
- **Modules:** `Deal`, `Company`, `Document`, `Fact`, `Activity`
- **Block Protocol:** `Block`, `Page` (recursive structure)
- **Enums:** Match `@trato-hive/shared` exactly.

## Common Patterns

### Singleton Client

```typescript
// index.ts
export const prisma = globalForPrisma.prisma ?? new PrismaClient()
```

### Multi-Tenancy Middleware

```typescript
// Enforce organizationId on all queries
prisma.$use(async (params, next) => {
  if (['Deal', 'Company'].includes(params.model)) {
    params.args.where = { ...params.args.where, organizationId: ctx.orgId }
  }
  return next(params)
})
```

## Non-Negotiables

- **Singleton:** Always use the exported `prisma` instance.
- **Multi-Tenancy:** Middleware MUST enforce `organizationId`.
- **Migrations:** Review SQL before applying.
- **Safety:** No raw SQL without parameterization.
