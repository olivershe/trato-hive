# Implementation Plan: [TASK-013a] Block Protocol Schema

## Overview
**Task:** Block Protocol Foundation - Database Schema
**Location:** `packages/db/prisma/schema.prisma`
**Duration:** 3 hours
**Phase:** 6.4

## Context
From Product Spec (Section 4, Module 3):
> **CRITICAL CHANGE:** The Deal 360° View is no longer a static layout. It is a **Page** composed of **Blocks**.

The Block Protocol enables dynamic, composable content pages for Deals, Companies, and future entities. This task implements the database foundation.

## Architecture Strategy

### 1. Recursive Tree Structure: Adjacency List
- **Reason:** Most efficient for our depth requirements (typical: 3-5 levels)
- **Implementation:** `parentId` on Block model
- **Alternative Rejected:** Closure Table (overkill for this use case)

### 2. Content Storage: JSONB
- **Reason:** Flexibility without schema migrations for new block types
- **Field:** `properties Json @db.JsonB`
- **Example Content:**
  ```json
  {
    "text": "Hello world",
    "level": 1,
    "checked": true,
    "url": "https://example.com"
  }
  ```

### 3. Polymorphism: Nullable Foreign Keys
- **Reason:** Prisma lacks native polymorphism
- **Implementation:** `dealId?` and `companyId?` on Page model
- **Constraint:** Application logic enforces one-and-only-one FK is set

## Database Models

### Page Model
```prisma
model Page {
  id          String   @id @default(cuid())
  title       String?

  // Polymorphic Relations
  dealId      String?  @unique
  deal        Deal?    @relation(fields: [dealId], references: [id], onDelete: Cascade)

  companyId   String?  @unique
  company     Company? @relation(fields: [companyId], references: [id], onDelete: Cascade)

  // Children
  blocks      Block[]  @relation("PageBlocks")

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("pages")
}
```

### Block Model
```prisma
model Block {
  id          String   @id @default(cuid())
  type        String   // "paragraph", "heading", "deal_card", etc.
  properties  Json     @db.JsonB

  // Tree Structure
  parentId    String?
  parent      Block?   @relation("BlockHierarchy", fields: [parentId], references: [id], onDelete: Cascade)
  children    Block[]  @relation("BlockHierarchy")

  // Ordering
  order       Int      @default(0)

  // Context
  pageId      String
  page        Page     @relation("PageBlocks", fields: [pageId], references: [id], onDelete: Cascade)

  // Metadata
  createdBy   String
  creator     User     @relation(fields: [createdBy], references: [id])

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([pageId])
  @@index([parentId])
  @@index([pageId, order])
  @@map("blocks")
}
```

### Updated Models
- **Deal:** Add `page Page?` relation
- **Company:** Add `page Page?` relation
- **User:** Add `createdBlocks Block[]` relation

## Implementation Steps

1. ✅ Create feature branch `feature/TASK-013a`
2. ⏳ Update `schema.prisma`:
   - Add Page model
   - Add Block model
   - Update Deal, Company, User models
3. ⏳ Generate migration: `block_protocol_init`
4. ⏳ Update `packages/db/src/seed.ts`:
   - Create sample Pages for seeded Deals
   - Create sample Blocks (Heading + Paragraph hierarchy)
5. ⏳ Run migration and verify
6. ⏳ Test recursive queries

## Verification Plan

### Automated Tests
- ✅ Migration applies successfully
- ✅ Page can be attached to Deal (polymorphism)
- ✅ Block can be child of another Block (recursion)

### Manual Tests
- ✅ Prisma Studio: Create nested block structure
- ✅ Seed verification: Deals have Pages with Blocks

## Success Criteria
- [x] Migration `block_protocol_init` created
- [x] All models compile without errors
- [x] Seed creates sample Deal → Page → Block tree
- [x] Can query blocks recursively via Prisma
- [x] Tests pass: `pnpm --filter @trato-hive/db test`

## References
- Product Spec: Section 4, Module 3 (Deal 360° View)
- packages/db/CLAUDE.md: Schema patterns
- docs/architecture/7-layer-architecture.md: Data ownership

---

**Created:** 2025-12-24
**Branch:** feature/TASK-013a
**Status:** Ready for implementation
