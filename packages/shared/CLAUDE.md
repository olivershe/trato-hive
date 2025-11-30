# Shared Package (@trato-hive/shared)

**Parent:** Root CLAUDE.md
**Purpose:** Foundation package providing types, validators, constants, and utilities for all apps and packages
**Last Updated:** 2025-11-18
**Layer Mapping:** Foundation (used by all 7 layers)

---

## 1. Purpose

The `@trato-hive/shared` package is the **foundation** of the Trato Hive codebase. It provides:

1. **Type Definitions:** TypeScript interfaces for core domain entities (User, Deal, Company, Document, Fact)
2. **Zod Validators:** Runtime validation schemas for API inputs and form submissions
3. **Constants:** Enums and constant values (PipelineStage, FactType, UserRole, API error codes)
4. **Utility Functions:** Pure functions for date/currency formatting, string manipulation, validation

**Key Characteristics:**
- **Zero runtime dependencies** beyond Zod
- **Framework-agnostic** - Pure TypeScript
- **Tree-shakeable** - Import only what you need
- **Type-safe** - All validators export both Zod schema AND inferred TypeScript type
- **Dual module support** - CommonJS and ESM

**Used By:** All apps and packages (`apps/api`, `apps/web`, `packages/auth`, `packages/data-plane`, `packages/semantic-layer`, `packages/ai-core`, `packages/agents`)

---

## 2. Ownership

**Shared Responsibility** - Changes require approval from Frontend, Backend, and Data teams.

**Why?** This package is imported by ALL other packages/apps. Breaking changes cascade across the entire codebase.

---

## 3. Technology Stack

**Build:** tsup 8.3.5 (CJS + ESM), TypeScript 5.6.3 (strict mode)
**Runtime:** Zod 3.23.8 (ONLY runtime dependency)
**Dev:** Vitest 2.1.8, eslint 8.57.0

---

## 4. Directory Structure

```
packages/shared/src/
├── validators/      # Zod schemas (user, company, deal, document, fact, common)
├── types/           # TypeScript interfaces (user, company, deal, document, fact, api)
├── constants/       # Enums (pipeline, fact, user, document, company, errors)
├── utils/           # Pure functions (date, currency, string, number, validation)
└── index.ts         # Main exports
```

---

## 5. Validators

### Core Pattern

**All validators MUST export both Zod schema AND inferred TypeScript type:**

```typescript
import { z } from 'zod';

export const createDealSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(['ACQUISITION', 'INVESTMENT', 'PARTNERSHIP', 'OTHER']),
  companyId: z.string().cuid(),
  organizationId: z.string().cuid(),
  value: z.number().positive().optional(),
  currency: z.string().length(3).default('USD'),
});

export type CreateDealInput = z.infer<typeof createDealSchema>;
```

**Why?** Single source of truth for runtime validation and compile-time types.

### Common Validators (Already Implemented ✅)

```typescript
// Pagination
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
});

// Sort, email, UUID, CUID
export const sortOrderSchema = z.enum(['asc', 'desc']);
export const emailSchema = z.string().email();
export const uuidSchema = z.string().uuid();
export const cuidSchema = z.string().cuid();
```

### Domain Validators (To Be Implemented)

**User Validators** (`src/validators/user.ts`):
- `createUserSchema`, `updateUserSchema`, `loginSchema`, `passwordResetSchema`, `organizationRoleSchema`

**Company Validators** (`src/validators/company.ts`):
- `createCompanySchema`, `updateCompanySchema`, `companyStatusSchema`, `companyFilterSchema`

**Deal Validators** (`src/validators/deal.ts`):
- `createDealSchema`, `updateDealSchema`, `dealStageSchema`, `dealTypeSchema`, `dealFilterSchema`

**Document Validators** (`src/validators/document.ts`):
- `uploadDocumentSchema`, `documentTypeSchema`, `documentStatusSchema`, `documentFilterSchema`

**Fact Validators** (`src/validators/fact.ts`):
- `createFactSchema`, `factTypeSchema`, `factFilterSchema`

**Reference:** See Prisma schema (`packages/db/prisma/schema.prisma`) for complete field lists and constraints.

---

## 6. Types

### Organization

- **Core Types:** Direct Prisma model mappings (User, Deal, Company, Document, Fact)
- **Derived Types:** Types with relations (DealWithCompany, CompanyWithFacts)
- **Input Types:** Inferred from Zod validators (CreateDealInput, UpdateDealInput)
- **API Types:** Response wrappers (ApiResponse, PaginatedResponse, ErrorCode)

### API Types (Already Implemented ✅)

```typescript
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: ErrorCode; message: string; details?: unknown };
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  CONFLICT = 'CONFLICT',
  BAD_REQUEST = 'BAD_REQUEST',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}
```

### Domain Types (To Be Implemented)

**User Types** (`src/types/user.ts`): User, Organization, OrganizationMember, UserWithOrganizations

**Company Types** (`src/types/company.ts`): Company, CompanyWithDeals, CompanyWithFacts

**Deal Types** (`src/types/deal.ts`): Deal, DealWithCompany, DealWithDocuments

**Document Types** (`src/types/document.ts`): Document, DocumentChunk, DocumentWithChunks, DocumentWithFacts

**Fact Types** (`src/types/fact.ts`): Fact, FactWithSources

**Reference:** See Prisma schema for complete type definitions.

---

## 7. Constants

### Pattern: Use `as const` for Type Inference

```typescript
export const PipelineStage = {
  SOURCING: 'SOURCING',
  INITIAL_REVIEW: 'INITIAL_REVIEW',
  PRELIMINARY_DUE_DILIGENCE: 'PRELIMINARY_DUE_DILIGENCE',
  DEEP_DUE_DILIGENCE: 'DEEP_DUE_DILIGENCE',
  NEGOTIATION: 'NEGOTIATION',
  CLOSING: 'CLOSING',
  CLOSED_WON: 'CLOSED_WON',
  CLOSED_LOST: 'CLOSED_LOST',
} as const;

export type PipelineStageValue = typeof PipelineStage[keyof typeof PipelineStage];

// Human-readable labels
export const PipelineStageLabels: Record<PipelineStageValue, string> = {
  [PipelineStage.SOURCING]: 'Sourcing',
  [PipelineStage.INITIAL_REVIEW]: 'Initial Review',
  // ... etc
};
```

### Available Constants

**Pipeline** (`src/constants/pipeline.ts`): PipelineStage enum + labels

**Fact** (`src/constants/fact.ts`): FactType enum + labels

**User** (`src/constants/user.ts`): OrganizationRole enum + permission helpers (canManageOrganization, canEditDeals, canDeleteDeals)

**Document** (`src/constants/document.ts`): DocumentType, DocumentStatus enums + labels

**Company** (`src/constants/company.ts`): CompanyStatus enum + labels

**Reference:** All constants match Prisma enums exactly.

---

## 8. Utility Functions

### Date Utilities (`src/utils/date.ts`)

```typescript
/**
 * Format a date to a human-readable string
 */
export function formatDate(date: Date | string, format?: string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

/**
 * Format a date as relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string;

/**
 * Format a date with time (e.g., "Nov 18, 2025 at 3:45 PM")
 */
export function formatDateTime(date: Date | string): string;
```

### Currency Utilities (`src/utils/currency.ts`) ✅

```typescript
/**
 * Format a number as currency with locale support
 */
export function formatCurrency(
  amount: number,
  currency = 'USD',
  locale = 'en-US'
): string;
```

### String Utilities (`src/utils/string.ts`)

```typescript
export function slugify(str: string): string;
export function capitalize(str: string): string;
export function titleCase(str: string): string;
export function truncate(str: string, maxLength = 50): string;
export function sanitizeFilename(str: string): string;
```

### Number Utilities (`src/utils/number.ts`)

```typescript
export function formatNumber(num: number, locale = 'en-US'): string;
export function formatPercentage(value: number, decimals = 0, isDecimal = true): string;
export function abbreviateNumber(num: number): string; // "1.2M", "3.5K"
export function calculatePercentage(value: number, total: number): number;
```

### Validation Utilities (`src/utils/validation.ts`)

```typescript
export function isValidEmail(email: string): boolean;
export function isValidUrl(url: string): boolean;
export function isValidUUID(str: string): boolean;
export function isValidCUID(str: string): boolean;
```

---

## 9. Integration Examples

### From apps/api (tRPC Input Validation)

```typescript
import { createDealSchema, paginationSchema, dealFilterSchema } from '@trato-hive/shared';

export const dealRouter = router({
  list: requireFirm
    .input(z.object({
      pagination: paginationSchema,
      filter: dealFilterSchema.optional(),
    }))
    .query(async ({ input, ctx }) => {
      return await dealService.listDeals(input, ctx.firmId);
    }),

  create: requireFirm
    .input(createDealSchema)
    .mutation(async ({ input, ctx }) => {
      return await dealService.createDeal(input, ctx.session.user.id);
    }),
});
```

### From apps/web (Form Validation)

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createDealSchema, type CreateDealInput } from '@trato-hive/shared';

export default function CreateDealPage() {
  const form = useForm<CreateDealInput>({
    resolver: zodResolver(createDealSchema),
    defaultValues: { stage: 'SOURCING', currency: 'USD' },
  });

  const onSubmit = async (data: CreateDealInput) => {
    await trpc.deal.create.mutate(data);
  };

  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>;
}
```

**More Examples:** See `apps/api/CLAUDE.md` for tRPC patterns, `apps/web/CLAUDE.md` for React Hook Form patterns.

---

## 10. Testing Requirements

### Coverage Target
- **Validators:** ≥80%
- **Utilities:** ≥80%
- **Framework:** Vitest 2.1.8

### Validator Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { createDealSchema } from '../validators';

describe('createDealSchema', () => {
  it('should accept valid deal data', () => {
    const result = createDealSchema.safeParse({
      name: 'Project Sky',
      type: 'ACQUISITION',
      companyId: 'cm1abc123',
      organizationId: 'cm1org456',
      value: 10000000,
      currency: 'USD',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Project Sky');
      expect(result.data.currency).toBe('USD');
    }
  });

  it('should reject invalid data', () => {
    const result = createDealSchema.safeParse({ name: 'Project Sky' });
    expect(result.success).toBe(false);
  });

  it('should apply default values', () => {
    const result = createDealSchema.safeParse({
      name: 'Project Sky',
      type: 'ACQUISITION',
      companyId: 'cm1abc123',
      organizationId: 'cm1org456',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe('USD');
      expect(result.data.stage).toBe('SOURCING');
    }
  });
});
```

### Utility Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { formatCurrency, slugify, abbreviateNumber } from '../utils';

describe('formatCurrency', () => {
  it('should format USD correctly', () => {
    expect(formatCurrency(1000000, 'USD', 'en-US')).toBe('$1,000,000.00');
  });
});

describe('slugify', () => {
  it('should convert string to slug', () => {
    expect(slugify('Hello World')).toBe('hello-world');
    expect(slugify('Project Sky: M&A Deal')).toBe('project-sky-ma-deal');
  });
});

describe('abbreviateNumber', () => {
  it('should abbreviate thousands, millions, billions', () => {
    expect(abbreviateNumber(1500)).toBe('1.5K');
    expect(abbreviateNumber(2500000)).toBe('2.5M');
    expect(abbreviateNumber(3200000000)).toBe('3.2B');
  });
});
```

---

## 11. Common Patterns

### Pattern 1: Validator with Type Inference

```typescript
export const mySchema = z.object({ ... });
export type MyInput = z.infer<typeof mySchema>;
```

### Pattern 2: Enum Constants with `as const`

```typescript
export const MyEnum = {
  VALUE_ONE: 'VALUE_ONE',
  VALUE_TWO: 'VALUE_TWO',
} as const;

export type MyEnumValue = typeof MyEnum[keyof typeof MyEnum];
```

### Pattern 3: Utility Function with Locale Support

```typescript
export function formatSomething(value: any, locale = 'en-US'): string {
  return new Intl.SomeFormatter(locale).format(value);
}
```

---

## 12. Anti-Patterns

### ❌ DON'T use `any` types

```typescript
// Bad
export function processData(data: any): any { return data; }

// Good
export function processData<T>(data: T): T { return data; }
```

### ❌ DON'T create circular dependencies

```typescript
// Bad - packages/shared imports from packages/auth
import { auth } from '@trato-hive/auth';

// Good - packages/shared is imported BY packages/auth
```

### ❌ DON'T add framework-specific code

```typescript
// Bad - React-specific
import { useState } from 'react';

// Good - Pure TypeScript
export function pureFunction(input: string): string {
  return input.toUpperCase();
}
```

### ❌ DON'T add runtime dependencies beyond Zod

```typescript
// Bad - adding moment.js
import moment from 'moment';

// Good - use native Date and Intl APIs
new Intl.DateTimeFormat('en-US').format(date);
```

---

## 13. Troubleshooting

### Problem: Zod validation fails with unclear error

**Solution:** Use `.safeParse()` to get detailed error information:

```typescript
const result = createDealSchema.safeParse(data);

if (!result.success) {
  result.error.issues.forEach((issue) => {
    console.log(`Field: ${issue.path.join('.')}, Error: ${issue.message}`);
  });
}
```

### Problem: Build fails with "Cannot find module"

**Solution:** Rebuild the package:

```bash
pnpm --filter @trato-hive/shared build
```

Ensure `package.json` exports are correct:
```json
{
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts"
}
```

### Problem: Enum values don't match Prisma schema

**Solution:** Ensure Zod enum exactly matches Prisma enum:

```typescript
// Prisma schema
enum DealStage { SOURCING INITIAL_REVIEW }

// Zod validator (must match exactly)
export const dealStageSchema = z.enum(['SOURCING', 'INITIAL_REVIEW']);
```

---

## 14. Exports

```typescript
// src/index.ts
export * from './validators';
export * from './types';
export * from './constants';
export * from './utils';
```

**Usage:**

```typescript
import { createDealSchema, type CreateDealInput } from '@trato-hive/shared';
import type { Deal, DealWithCompany } from '@trato-hive/shared';
import { PipelineStage, FactType } from '@trato-hive/shared';
import { formatCurrency, slugify, formatRelativeTime } from '@trato-hive/shared';
```

---

## 15. Environment Variables

**None required.** This package is purely TypeScript types, validators, and utilities.

---

## 16. Non-Negotiables

1. **No runtime dependencies beyond Zod**
2. **All validators MUST export both schema and inferred type**
3. **Strict TypeScript mode** - No `any` types
4. **≥80% test coverage**
5. **No circular dependencies**
6. **Dual CJS/ESM build**
7. **No framework-specific code**
8. **Match Prisma enums exactly**
9. **Follow Zod best practices** (`.refine()`, `.transform()`, `.superRefine()`)
10. **Tree-shakeable exports**

---

## Resources

**Documentation:**
- Root CLAUDE.md Section 4 (Coding Standards)
- PROJECT_STATUS.md lines 366-393
- packages/db/prisma/schema.prisma (Type/enum alignment)
- apps/api/CLAUDE.md (Integration examples)

**External:**
- [Zod Documentation](https://zod.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Intl API (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)
- [Vitest Documentation](https://vitest.dev/)
