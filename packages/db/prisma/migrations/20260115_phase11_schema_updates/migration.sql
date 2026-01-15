-- Phase 11: UI/UX Architecture Schema Updates
-- This migration adds:
-- 1. DealCompany junction table (many-to-many Deal-Company with roles)
-- 2. CompanyWatch table (user watch list for companies)
-- 3. PageType enum and Page type fields

-- =============================================================================
-- 1. CREATE ENUMS
-- =============================================================================

-- DealCompanyRole enum for Deal-Company relationship types
CREATE TYPE "DealCompanyRole" AS ENUM ('PLATFORM', 'ADD_ON', 'SELLER', 'BUYER', 'ADVISOR');

-- PageType enum for different page types
CREATE TYPE "PageType" AS ENUM ('DEAL_PAGE', 'COMPANY_PAGE', 'DOCUMENT_PAGE', 'FREEFORM');

-- =============================================================================
-- 2. CREATE TABLES
-- =============================================================================

-- DealCompany junction table
CREATE TABLE "deal_companies" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "role" "DealCompanyRole" NOT NULL DEFAULT 'PLATFORM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_companies_pkey" PRIMARY KEY ("id")
);

-- CompanyWatch table
CREATE TABLE "company_watches" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notes" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_watches_pkey" PRIMARY KEY ("id")
);

-- =============================================================================
-- 3. ALTER PAGES TABLE
-- =============================================================================

-- Add new columns to pages table
ALTER TABLE "pages" ADD COLUMN "type" "PageType" NOT NULL DEFAULT 'FREEFORM';
ALTER TABLE "pages" ADD COLUMN "companyId" TEXT;
ALTER TABLE "pages" ADD COLUMN "documentId" TEXT;

-- =============================================================================
-- 4. CREATE INDEXES
-- =============================================================================

-- DealCompany indexes
CREATE UNIQUE INDEX "deal_companies_dealId_companyId_key" ON "deal_companies"("dealId", "companyId");
CREATE INDEX "deal_companies_dealId_idx" ON "deal_companies"("dealId");
CREATE INDEX "deal_companies_companyId_idx" ON "deal_companies"("companyId");

-- CompanyWatch indexes
CREATE UNIQUE INDEX "company_watches_companyId_userId_key" ON "company_watches"("companyId", "userId");
CREATE INDEX "company_watches_companyId_idx" ON "company_watches"("companyId");
CREATE INDEX "company_watches_userId_idx" ON "company_watches"("userId");

-- Page indexes for new columns
CREATE INDEX "pages_companyId_idx" ON "pages"("companyId");
CREATE INDEX "pages_documentId_idx" ON "pages"("documentId");

-- =============================================================================
-- 5. ADD FOREIGN KEY CONSTRAINTS
-- =============================================================================

-- DealCompany foreign keys
ALTER TABLE "deal_companies" ADD CONSTRAINT "deal_companies_dealId_fkey"
    FOREIGN KEY ("dealId") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deal_companies" ADD CONSTRAINT "deal_companies_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CompanyWatch foreign keys
ALTER TABLE "company_watches" ADD CONSTRAINT "company_watches_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "company_watches" ADD CONSTRAINT "company_watches_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Page foreign keys for new columns
ALTER TABLE "pages" ADD CONSTRAINT "pages_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pages" ADD CONSTRAINT "pages_documentId_fkey"
    FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================================
-- 6. DATA MIGRATION: Migrate existing Deal.companyId to DealCompany
-- =============================================================================

-- Migrate existing deal-company relationships to the junction table
-- All existing relationships get the PLATFORM role (primary target)
INSERT INTO "deal_companies" ("id", "dealId", "companyId", "role", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    d."id",
    d."companyId",
    'PLATFORM'::"DealCompanyRole",
    d."createdAt",
    NOW()
FROM "deals" d
WHERE d."companyId" IS NOT NULL
ON CONFLICT ("dealId", "companyId") DO NOTHING;

-- Note: We keep the original companyId on Deal for backwards compatibility
-- It can be removed in a future migration after all code is updated
