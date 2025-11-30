# Database Package (@trato-hive/db)

**Parent:** Root CLAUDE.md
**Purpose:** Prisma client, schema, migrations, and seeding for PostgreSQL database
**Last Updated:** 2025-11-18
**Layer Mapping:** Layer 1 (Data Plane) + Layer 6 (Governance - multi-tenancy, audit logs)

---

## 1. Purpose

The `@trato-hive/db` package provides a **type-safe database client** for the entire Trato Hive application. It uses **Prisma ORM** to:

1. **Define Schema:** Single source of truth for all database models (User, Organization, Company, Deal, Document, Fact, Activity)
2. **Generate Types:** Auto-generated TypeScript types for all models, relations, and queries
3. **Handle Migrations:** Version-controlled schema changes with rollback support
4. **Seed Data:** Idempotent seeding for development and testing
5. **Multi-Tenancy:** Enforce `organizationId` filtering across all queries via middleware

**Key Characteristics:**
- **PostgreSQL** as primary database (required)
- **Prisma Client** singleton pattern (prevents connection exhaustion)
- **7 core models** aligned with 5 Product Modules
- **Audit logging** via Activity model
- **Type-safe queries** - no raw SQL

**Used By:** All apps and packages (`apps/api`, `apps/web`, `packages/auth`, `packages/data-plane`, `packages/semantic-layer`, `packages/agents`)

---

## 2. Ownership

**Backend Team** - All schema changes require:
1. Architecture review (multi-layer impact)
2. Migration plan (zero-downtime deployments)
3. Data migration script (for production data)

**Breaking Changes:** Require major version bump and deprecation period.

---

## 3. Technology Stack

**Database:** PostgreSQL 16+ (required)
**ORM:** Prisma 6.2.0 (@prisma/client)
**Build:** tsup 8.3.5 (CJS + ESM), TypeScript 5.6.3
**Testing:** Vitest 2.1.8, tsx 4.19.2 (for seed scripts)

---

## 4. Schema Overview

### 7 Core Models (403 lines)

**1. Authentication (NextAuth 5 integration):**
- `User` - Auth users (email, name, image)
- `Account` - OAuth providers (Google, Microsoft)
- `Session` - Database sessions
- `VerificationToken` - Email verification

**2. Multi-Tenancy:**
- `Organization` - Tenant root (name, slug)
- `OrganizationMember` - User-org mapping with roles (OWNER, ADMIN, MEMBER, VIEWER)

**3. Discovery (Module 2):**
- `Company` - Target companies (name, domain, industry, revenue, status)

**4. Deals (Module 3):**
- `Deal` - M&A pipeline (name, type, stage, value, probability)

**5. Documents (Module 4 - Layer 1):**
- `Document` - Uploaded files (fileUrl, type, status, Reducto metadata)
- `DocumentChunk` - Parsed chunks with embeddings (vectorId → Pinecone)

**6. Knowledge Graph (Layer 2):**
- `Fact` - Extracted facts (subject-predicate-object triples, citations)

**7. Audit (Layer 6):**
- `Activity` - Audit log (type, description, metadata, timestamps)

### Model Relationships

```
Organization (tenant)
  ├── OrganizationMember[] (users with roles)
  ├── Deal[] (pipeline)
  │   ├── Company (target)
  │   ├── Document[] (due diligence files)
  │   └── Activity[] (audit trail)
  ├── Company[] (all targets)
  │   ├── Document[] (company docs)
  │   └── Fact[] (extracted knowledge)
  └── Document[]
      ├── DocumentChunk[] (text chunks + embeddings)
      └── Fact[] (citations)
```

### Enums (All match @trato-hive/shared)

```prisma
enum OrganizationRole { OWNER ADMIN MEMBER VIEWER }
enum CompanyStatus { PROSPECT RESEARCHING ENGAGED PIPELINE ARCHIVED }
enum DealStage { SOURCING INITIAL_REVIEW PRELIMINARY_DUE_DILIGENCE DEEP_DUE_DILIGENCE NEGOTIATION CLOSING CLOSED_WON CLOSED_LOST }
enum DealType { ACQUISITION INVESTMENT PARTNERSHIP OTHER }
enum DocumentType { FINANCIAL_STATEMENT CONTRACT PRESENTATION MEMORANDUM LEGAL_DOCUMENT TECHNICAL_DOCUMENT OTHER }
enum DocumentStatus { UPLOADING PROCESSING PARSED INDEXED FAILED }
enum FactType { FINANCIAL_METRIC KEY_PERSON PRODUCT CUSTOMER RISK OPPORTUNITY OTHER }
enum ActivityType { DOCUMENT_UPLOADED DOCUMENT_PROCESSED DEAL_CREATED DEAL_STAGE_CHANGED COMPANY_ADDED AI_QUERY USER_ACTION }
```

---

## 5. Environment Variables

**Required:**

```bash
# PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/trato_hive?schema=public"

# Optional: Direct connection for migrations (bypasses connection pooling)
DIRECT_URL="postgresql://user:password@localhost:5432/trato_hive?schema=public"
```

**Development (.env.local):**
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/trato_hive_dev?schema=public"
```

**Production:**
- Use connection pooling (PgBouncer, Supabase Pooler)
- Enable SSL: `?sslmode=require`
- Set connection limits: `?connection_limit=10`

---

## 6. Prisma Client Usage

### Singleton Pattern (REQUIRED)

**File:** `packages/db/src/index.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export * from '@prisma/client';
```

**Why Singleton?** Prevents connection pool exhaustion in serverless environments (Next.js, Vercel).

### Basic Queries

```typescript
import { prisma } from '@trato-hive/db';

// Create
const deal = await prisma.deal.create({
  data: {
    name: 'Project Sky',
    type: 'ACQUISITION',
    stage: 'SOURCING',
    organizationId: 'cm1org123',
    companyId: 'cm1company456',
  },
});

// Read with relations
const dealWithCompany = await prisma.deal.findUnique({
  where: { id: 'cm1deal789' },
  include: { company: true, documents: true },
});

// Update
await prisma.deal.update({
  where: { id: 'cm1deal789' },
  data: { stage: 'DEEP_DUE_DILIGENCE', probability: 75 },
});

// Delete
await prisma.deal.delete({ where: { id: 'cm1deal789' } });

// List with pagination
const deals = await prisma.deal.findMany({
  where: { organizationId: 'cm1org123', stage: 'SOURCING' },
  include: { company: true },
  orderBy: { createdAt: 'desc' },
  skip: (page - 1) * pageSize,
  take: pageSize,
});

// Count
const total = await prisma.deal.count({
  where: { organizationId: 'cm1org123' },
});
```

### Transactions

```typescript
await prisma.$transaction(async (tx) => {
  const company = await tx.company.create({
    data: { name: 'Acme Inc', organizationId: 'cm1org123' },
  });

  const deal = await tx.deal.create({
    data: {
      name: 'Acquire Acme',
      type: 'ACQUISITION',
      stage: 'SOURCING',
      companyId: company.id,
      organizationId: 'cm1org123',
    },
  });

  await tx.activity.create({
    data: {
      type: 'DEAL_CREATED',
      description: `Created deal "${deal.name}"`,
      dealId: deal.id,
      userId: 'cm1user123',
    },
  });
});
```

---

## 7. Multi-Tenancy Enforcement

### Global Middleware (CRITICAL)

**Add to apps/api Prisma client initialization:**

```typescript
import { prisma } from '@trato-hive/db';

// Enforce organizationId filtering on all queries
prisma.$use(async (params, next) => {
  // Get organizationId from context (tRPC, Next.js)
  const organizationId = getOrganizationIdFromContext();

  if (!organizationId) {
    throw new Error('organizationId is required');
  }

  // Models that require organizationId filtering
  const tenantModels = ['organization', 'deal', 'company', 'document'];

  if (tenantModels.includes(params.model?.toLowerCase() ?? '')) {
    if (params.action === 'findUnique' || params.action === 'findFirst') {
      params.args.where = { ...params.args.where, organizationId };
    } else if (params.action === 'findMany') {
      params.args.where = { ...params.args.where, organizationId };
    } else if (params.action === 'create') {
      params.args.data = { ...params.args.data, organizationId };
    } else if (params.action === 'update' || params.action === 'delete') {
      params.args.where = { ...params.args.where, organizationId };
    }
  }

  return next(params);
});
```

**⚠️ WARNING:** This middleware is MANDATORY for production to prevent cross-tenant data leaks.

---

## 8. Migrations

### Development Workflow

```bash
# Create a new migration (auto-generates SQL)
pnpm --filter @trato-hive/db db:migrate

# You'll be prompted:
# Enter migration name: add_deal_probability_field

# This creates: prisma/migrations/20251118120000_add_deal_probability_field/migration.sql
```

### Migration Files

**Example:** `prisma/migrations/20251118120000_add_deal_probability_field/migration.sql`

```sql
-- AlterTable
ALTER TABLE "deals" ADD COLUMN "probability" INTEGER;

-- CreateIndex
CREATE INDEX "deals_probability_idx" ON "deals"("probability");
```

### Apply Migrations

```bash
# Development (creates migration + applies)
pnpm --filter @trato-hive/db db:migrate

# Production (applies existing migrations only)
pnpm --filter @trato-hive/db db:migrate:deploy

# Reset database (WARNING: deletes all data)
pnpm --filter @trato-hive/db db:push --force-reset
```

### Migration Best Practices

1. **One migration per logical change** (e.g., "add deal probability", not "misc changes")
2. **Review generated SQL** before committing
3. **Test rollback** in staging environment
4. **Zero-downtime migrations:**
   - Add nullable columns first
   - Backfill data in background job
   - Make non-nullable in separate migration
5. **Never edit existing migrations** (create new ones)

---

## 9. Seeding

### Seed Script Pattern

**File:** `packages/db/prisma/seed.ts` (to be created)

```typescript
import { prisma } from '../src/index';
import { hash } from 'bcrypt';

async function main() {
  console.log('🌱 Seeding database...');

  // Idempotent: Check if data exists
  const existingOrg = await prisma.organization.findUnique({
    where: { slug: 'demo-org' },
  });

  if (existingOrg) {
    console.log('✅ Seed data already exists');
    return;
  }

  // Create organization
  const org = await prisma.organization.create({
    data: {
      name: 'Demo Organization',
      slug: 'demo-org',
      description: 'Seed organization for development',
    },
  });

  // Create admin user
  const passwordHash = await hash('demo123', 12);
  const user = await prisma.user.create({
    data: {
      email: 'admin@demo.com',
      name: 'Demo Admin',
      emailVerified: new Date(),
    },
  });

  // Link user to org
  await prisma.organizationMember.create({
    data: {
      organizationId: org.id,
      userId: user.id,
      role: 'OWNER',
    },
  });

  // Create sample companies
  const company = await prisma.company.create({
    data: {
      name: 'Acme Corporation',
      domain: 'acme.com',
      industry: 'Technology',
      sector: 'Software',
      employees: 250,
      revenue: 50000000,
      status: 'PIPELINE',
      organizationId: org.id,
    },
  });

  // Create sample deal
  await prisma.deal.create({
    data: {
      name: 'Acquire Acme',
      type: 'ACQUISITION',
      stage: 'PRELIMINARY_DUE_DILIGENCE',
      value: 100000000,
      currency: 'USD',
      probability: 60,
      companyId: company.id,
      organizationId: org.id,
    },
  });

  console.log('✅ Seed complete!');
  console.log(`Organization: ${org.name} (${org.slug})`);
  console.log(`User: ${user.email} / demo123`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Run Seed Script

```bash
pnpm --filter @trato-hive/db db:seed
```

---

## 10. Prisma Studio (Database GUI)

```bash
# Launch Prisma Studio on http://localhost:5555
pnpm --filter @trato-hive/db db:studio
```

**Use Cases:**
- Visual database browsing
- Manual data editing (development only)
- Debugging relations
- Quick data inspection

**⚠️ WARNING:** Never use Prisma Studio in production.

---

## 11. Testing

### Unit Tests (Repository Pattern)

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '../src/index';

describe('Deal Repository', () => {
  let orgId: string;

  beforeEach(async () => {
    // Create test organization
    const org = await prisma.organization.create({
      data: { name: 'Test Org', slug: 'test-org' },
    });
    orgId = org.id;
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.deal.deleteMany({ where: { organizationId: orgId } });
    await prisma.organization.delete({ where: { id: orgId } });
  });

  it('should create a deal', async () => {
    const deal = await prisma.deal.create({
      data: {
        name: 'Test Deal',
        type: 'ACQUISITION',
        stage: 'SOURCING',
        organizationId: orgId,
      },
    });

    expect(deal.id).toBeDefined();
    expect(deal.name).toBe('Test Deal');
    expect(deal.stage).toBe('SOURCING');
  });

  it('should enforce multi-tenancy', async () => {
    const deal = await prisma.deal.create({
      data: {
        name: 'Org 1 Deal',
        type: 'ACQUISITION',
        stage: 'SOURCING',
        organizationId: orgId,
      },
    });

    // Create second org
    const org2 = await prisma.organization.create({
      data: { name: 'Org 2', slug: 'org-2' },
    });

    // Should NOT find deal from org1 when filtering by org2
    const result = await prisma.deal.findFirst({
      where: { id: deal.id, organizationId: org2.id },
    });

    expect(result).toBeNull();
  });
});
```

### Integration Tests (with apps/api)

See `apps/api/CLAUDE.md` for tRPC integration testing patterns.

---

## 12. Common Patterns

### Pattern 1: Type-Safe Includes

```typescript
import { Prisma } from '@trato-hive/db';

const dealWithRelations = Prisma.validator<Prisma.DealDefaultArgs>()({
  include: { company: true, documents: true },
});

type DealWithRelations = Prisma.DealGetPayload<typeof dealWithRelations>;
```

### Pattern 2: Pagination Helper

```typescript
export async function paginateDeals(
  where: Prisma.DealWhereInput,
  page: number,
  pageSize: number
) {
  const [items, total] = await prisma.$transaction([
    prisma.deal.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: { company: true },
    }),
    prisma.deal.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
```

### Pattern 3: Soft Deletes (Future)

```prisma
model Deal {
  // ... existing fields
  deletedAt DateTime?
}

// Query only non-deleted
const activeDeals = await prisma.deal.findMany({
  where: { deletedAt: null },
});
```

---

## 13. Anti-Patterns

### ❌ DON'T create multiple Prisma instances

```typescript
// Bad - creates connection pool leak
const prisma1 = new PrismaClient();
const prisma2 = new PrismaClient();

// Good - use singleton
import { prisma } from '@trato-hive/db';
```

### ❌ DON'T skip organizationId filtering

```typescript
// Bad - allows cross-tenant data access
await prisma.deal.findMany();

// Good - always filter by organizationId
await prisma.deal.findMany({
  where: { organizationId: ctx.organizationId },
});
```

### ❌ DON'T use raw SQL without parameterization

```typescript
// Bad - SQL injection risk
await prisma.$queryRaw`SELECT * FROM deals WHERE name = '${userInput}'`;

// Good - parameterized query
await prisma.$queryRaw`SELECT * FROM deals WHERE name = ${userInput}`;
```

### ❌ DON'T forget to disconnect in scripts

```typescript
// Bad - hangs process
await prisma.organization.create({ data: { ... } });

// Good - disconnect after operations
await prisma.organization.create({ data: { ... } });
await prisma.$disconnect();
```

---

## 14. Troubleshooting

### Problem: "Can't reach database server"

**Solution:** Check DATABASE_URL and PostgreSQL status:

```bash
# Test connection
psql $DATABASE_URL

# Check Docker
docker ps | grep postgres
```

### Problem: "Type error: Property 'X' does not exist"

**Solution:** Regenerate Prisma Client:

```bash
pnpm --filter @trato-hive/db db:generate
```

### Problem: Migration fails with "column already exists"

**Solution:** Reset database (development only):

```bash
pnpm --filter @trato-hive/db db:push --force-reset
pnpm --filter @trato-hive/db db:seed
```

### Problem: Slow queries

**Solution:** Add indexes to Prisma schema:

```prisma
model Deal {
  // ...
  @@index([organizationId, stage])
  @@index([companyId])
}
```

Then migrate:
```bash
pnpm --filter @trato-hive/db db:migrate
```

---

## 15. Exports

```typescript
// packages/db/src/index.ts
export { prisma } from './index';
export * from '@prisma/client'; // All types, enums, etc.
```

**Usage:**

```typescript
import { prisma, Prisma, DealStage, OrganizationRole } from '@trato-hive/db';

// Use Prisma client
const deals = await prisma.deal.findMany();

// Use types
type Deal = Prisma.DealGetPayload<{ include: { company: true } }>;

// Use enums
const stage: DealStage = 'SOURCING';
const role: OrganizationRole = 'ADMIN';
```

---

## 16. Scripts Reference

```bash
# Build package
pnpm --filter @trato-hive/db build

# Generate Prisma Client
pnpm --filter @trato-hive/db db:generate

# Create migration
pnpm --filter @trato-hive/db db:migrate

# Apply migrations (production)
pnpm --filter @trato-hive/db db:migrate:deploy

# Push schema changes (development)
pnpm --filter @trato-hive/db db:push

# Launch Prisma Studio
pnpm --filter @trato-hive/db db:studio

# Run seed script
pnpm --filter @trato-hive/db db:seed

# Run tests
pnpm --filter @trato-hive/db test

# Typecheck
pnpm --filter @trato-hive/db typecheck
```

---

## 17. Non-Negotiables

1. **PostgreSQL 16+ required** (no MySQL, SQLite, MongoDB)
2. **Singleton pattern MANDATORY** for Prisma Client
3. **Multi-tenancy middleware REQUIRED** in production
4. **All enums MUST match @trato-hive/shared** exactly
5. **Migrations MUST be reviewed** before merging
6. **Seed scripts MUST be idempotent** (safe to run multiple times)
7. **Never edit existing migrations** (create new ones)
8. **Always disconnect in scripts** (`await prisma.$disconnect()`)
9. **≥80% test coverage** for repository patterns
10. **No raw SQL** without parameterization (SQL injection prevention)

---

## Resources

**Documentation:**
- Root CLAUDE.md Section 3 (Architecture - Data Ownership)
- PROJECT_STATUS.md lines 430-460
- packages/shared/CLAUDE.md (Type/enum alignment)
- apps/api/CLAUDE.md (Integration examples)

**Prisma Docs:**
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)

**PostgreSQL:**
- [PostgreSQL 16 Documentation](https://www.postgresql.org/docs/16/index.html)
- [Indexing Strategies](https://www.postgresql.org/docs/16/indexes.html)
