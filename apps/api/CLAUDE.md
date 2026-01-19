# Trato Hive API (apps/api)

**Package:** `@trato-hive/api`
**Framework:** Fastify 5, tRPC v11, Prisma 6
**Last Updated:** January 19, 2026 (Phase 11 Complete)

## Quick Reference

```bash
# Development
pnpm --filter @trato-hive/api dev

# Testing
pnpm --filter @trato-hive/api test

# Type checking
pnpm --filter @trato-hive/api typecheck
```

## Directory Structure

```
apps/api/
├── src/
│   ├── routers/                # tRPC routers
│   │   ├── block.ts            # Block sync
│   │   ├── company.ts          # Company CRUD [Phase 11.4]
│   │   ├── deal.ts             # Deal operations
│   │   ├── database.ts         # Inline databases
│   │   ├── dashboard.ts        # Pipeline health metrics
│   │   ├── diligence.ts        # AI Q&A with citations
│   │   ├── vdr.ts              # Virtual Data Room
│   │   ├── generator.ts        # Document export
│   │   ├── sourcing.ts         # Company discovery
│   │   ├── page.ts             # Page management
│   │   ├── search.ts           # Global search [Phase 11.3]
│   │   ├── user.ts             # User preferences
│   │   ├── watch.ts            # Company watch list [Phase 11.5]
│   │   ├── document.ts         # Document pages [Phase 11.6]
│   │   ├── qa.ts               # Q&A review flow [Phase 11.7]
│   │   └── alerts.ts           # AI alerts [Phase 11.8]
│   ├── services/               # Business logic
│   │   ├── company.service.ts  # Company operations
│   │   ├── deals.service.ts    # Deal operations
│   │   ├── watch.service.ts    # Watch list operations
│   │   ├── document.service.ts # Document page creation
│   │   ├── qa.service.ts       # Q&A review operations
│   │   ├── alerts.service.ts   # Alert generation
│   │   └── dashboard.service.ts # Activity metrics
│   └── trpc/
│       ├── init.ts             # tRPC initialization
│       └── router.ts           # Root router composition
├── vitest.config.ts            # Test configuration
└── package.json
```

## tRPC Routers (Phase 11)

### Company Router (`routers/company.ts`)

**Purpose:** Company CRUD, search, and related companies

| Procedure | Type | Description |
|-----------|------|-------------|
| `company.list` | Query | List companies with pagination |
| `company.get` | Query | Get company by ID |
| `company.getWithPage` | Query | Get company with associated page |
| `company.getWithDeals` | Query | Get company with deal history |
| `company.create` | Mutation | Create company with auto-template |
| `company.update` | Mutation | Update company details |
| `company.delete` | Mutation | Delete company |
| `company.search` | Query | Search companies for Command Palette |
| `company.getRelated` | Query | Get related companies by similarity |

### Watch Router (`routers/watch.ts`)

**Purpose:** Company watch list management

| Procedure | Type | Description |
|-----------|------|-------------|
| `watch.add` | Mutation | Add company to watch list |
| `watch.remove` | Mutation | Remove from watch list |
| `watch.update` | Mutation | Update notes/tags/priority |
| `watch.list` | Query | Get user's watched companies |
| `watch.isWatched` | Query | Check if company is watched |

### Search Router (`routers/search.ts`)

**Purpose:** Global entity search for Command Palette

| Procedure | Type | Description |
|-----------|------|-------------|
| `search.global` | Query | Search deals, companies, documents |

**Input Schema:**
```typescript
{
  query: string           // 1-100 chars
  limit?: number         // default: 5, max: 20
  includeDeals?: boolean
  includeCompanies?: boolean
  includeDocuments?: boolean
}
```

### Document Router (`routers/document.ts`)

**Purpose:** Document page management

| Procedure | Type | Description |
|-----------|------|-------------|
| `document.getWithPage` | Query | Get document with associated page |
| `document.getFacts` | Query | Get extracted facts |
| `document.createPage` | Mutation | Create page for document |
| `document.ensurePage` | Mutation | Create page if not exists |

### Q&A Router (`routers/qa.ts`)

**Purpose:** Q&A answer review workflow

| Procedure | Type | Description |
|-----------|------|-------------|
| `qa.create` | Mutation | Create QAAnswer after AI generation |
| `qa.get` | Query | Get QAAnswer by ID |
| `qa.approve` | Mutation | Approve answer (status → APPROVED) |
| `qa.edit` | Mutation | Edit and approve (status → EDITED) |
| `qa.reject` | Mutation | Reject with optional reason |
| `qa.list` | Query | List QAAnswers with filters |

### Alerts Router (`routers/alerts.ts`)

**Purpose:** AI alerts for pipeline management

| Procedure | Type | Description |
|-----------|------|-------------|
| `alerts.list` | Query | Get stale deal alerts |
| `alerts.dismiss` | Mutation | Dismiss an alert |
| `alerts.snooze` | Mutation | Snooze alert for duration |

## Services (Phase 11)

### CompanyService (`services/company.service.ts`)

**Key Methods:**

```typescript
class CompanyService {
  // CRUD
  async list(options: ListOptions): Promise<Company[]>
  async get(id: string): Promise<Company>
  async create(input: CreateCompanyInput): Promise<Company>
  async update(id: string, input: UpdateCompanyInput): Promise<Company>
  async delete(id: string): Promise<void>

  // Page Management
  async getWithPage(id: string): Promise<Company & { page: Page }>
  async createCompanyPage(companyId: string): Promise<Page>

  // Relationships
  async getWithDeals(id: string): Promise<Company & { deals: Deal[] }>
  async getRelated(id: string, limit: number): Promise<RelatedCompany[]>
}
```

**Auto-Template Creation:**
When a company is created, the service automatically creates:
1. Root Company Page (type: COMPANY_PAGE)
2. CompanyHeaderBlock with company metadata
3. DealHistoryBlock to show associated deals
4. RelatedCompaniesBlock for similar companies
5. AI Insights placeholder (heading + paragraph)
6. Key Contacts sub-page with database

### WatchService (`services/watch.service.ts`)

**Key Methods:**

```typescript
class WatchService {
  async add(input: AddWatchInput, userId: string, orgId: string): Promise<CompanyWatch>
  async remove(companyId: string, userId: string, orgId: string): Promise<void>
  async update(companyId: string, input: UpdateWatchInput, userId: string): Promise<CompanyWatch>
  async list(userId: string, options: ListOptions): Promise<CompanyWatch[]>
  async isWatched(companyId: string, userId: string): Promise<boolean>
}
```

### QAService (`services/qa.service.ts`)

**Key Methods:**

```typescript
class QAService {
  async create(input: CreateQAInput): Promise<QAAnswer>
  async getById(id: string, orgId: string): Promise<QAAnswer>
  async approve(id: string, reviewerId: string): Promise<{ answer: QAAnswer; activityId: string }>
  async edit(id: string, editedAnswer: string, reviewerId: string): Promise<{ answer: QAAnswer; activityId: string }>
  async reject(id: string, reason: string | null, reviewerId: string): Promise<{ answer: QAAnswer; activityId: string }>
  async list(options: ListQAOptions): Promise<{ answers: QAAnswer[]; total: number; pages: number }>
}
```

**Activity Logging:**
All review actions (approve/edit/reject) automatically create Activity entries with:
- `ActivityType.QA_APPROVED` / `QA_EDITED` / `QA_REJECTED`
- Reviewer ID and timestamp
- Metadata with question, original/edited answer, rejection reason

### AlertsService (`services/alerts.service.ts`)

**Alert Generation:**
- Identifies stale deals (>14 days in same stage)
- Assigns priority: LOW (14-21 days), MEDIUM (21-30 days), HIGH (30-45 days), URGENT (>45 days)
- In-memory state for dismiss/snooze (stub for persistence)

## Database Models (Phase 11)

### QAAnswer (`packages/db/prisma/schema.prisma`)

```prisma
model QAAnswer {
  id              String         @id @default(cuid())
  organizationId  String
  question        String         @db.Text
  answer          String         @db.Text
  citations       Json           @db.JsonB
  confidence      Float?
  status          QAAnswerStatus @default(PENDING)
  editedAnswer    String?        @db.Text
  rejectionReason String?        @db.Text
  reviewerId      String?
  reviewedAt      DateTime?

  // Relations
  dealId     String?
  documentId String?
  companyId  String?
  deal       Deal?     @relation(fields: [dealId], references: [id])
  document   Document? @relation(fields: [documentId], references: [id])
  company    Company?  @relation(fields: [companyId], references: [id])
  reviewer   User?     @relation(fields: [reviewerId], references: [id])
}

enum QAAnswerStatus {
  PENDING
  APPROVED
  EDITED
  REJECTED
}
```

### CompanyWatch (`packages/db/prisma/schema.prisma`)

```prisma
model CompanyWatch {
  companyId String
  userId    String
  notes     String?
  tags      String[]
  priority  Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  company Company @relation(fields: [companyId], references: [id])
  user    User    @relation(fields: [userId], references: [id])

  @@id([companyId, userId])
}
```

### DealCompany (`packages/db/prisma/schema.prisma`)

```prisma
model DealCompany {
  id        String          @id @default(cuid())
  dealId    String
  companyId String
  role      DealCompanyRole
  createdAt DateTime        @default(now())

  deal    Deal    @relation(fields: [dealId], references: [id])
  company Company @relation(fields: [companyId], references: [id])

  @@unique([dealId, companyId])
  @@index([dealId])
  @@index([companyId])
}

enum DealCompanyRole {
  PLATFORM
  ADD_ON
  SELLER
  BUYER
  ADVISOR
}
```

## Multi-Tenancy Pattern

**All routers use `organizationProtectedProcedure`:**

```typescript
export const organizationProtectedProcedure = protectedProcedure.use(
  async ({ ctx, next }) => {
    const organizationId = ctx.session.user.organizationId;
    if (!organizationId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    return next({
      ctx: { ...ctx, organizationId },
    });
  }
);
```

**Service Pattern:**
- All queries include `where: { organizationId }`
- All creates set `organizationId` from context
- Services validate organizationId before operations

## Error Handling

```typescript
import { TRPCError } from '@trpc/server';

// Not found
throw new TRPCError({
  code: 'NOT_FOUND',
  message: 'Company not found',
});

// Already exists
throw new TRPCError({
  code: 'CONFLICT',
  message: 'Company already watched',
});

// Validation failed
throw new TRPCError({
  code: 'BAD_REQUEST',
  message: 'Invalid input',
});
```

## Validation Schemas

All input validation uses Zod schemas from `@trato-hive/shared/validators`:

```typescript
// Example: Q&A validators
import { createQAAnswerSchema, approveQAAnswerSchema } from '@trato-hive/shared/validators';

export const qaRouter = router({
  create: organizationProtectedProcedure
    .input(createQAAnswerSchema)
    .mutation(async ({ ctx, input }) => { ... }),

  approve: organizationProtectedProcedure
    .input(approveQAAnswerSchema)
    .mutation(async ({ ctx, input }) => { ... }),
});
```

## Related Documentation

- **Root CLAUDE.md:** `/CLAUDE.md` - Project-wide architecture
- **Web App:** `/apps/web/CLAUDE.md` - Frontend components
- **Shared Types:** `/packages/shared/src/types/` - Type definitions
- **Validators:** `/packages/shared/src/validators/` - Zod schemas
- **Architecture:** `/docs/architecture/` - 7-Layer Architecture
