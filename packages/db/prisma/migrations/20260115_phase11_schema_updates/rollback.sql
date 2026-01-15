-- Phase 11: UI/UX Architecture Schema Updates - ROLLBACK
-- This script reverses all changes made by the migration
-- WARNING: This will delete all data in the new tables!

-- =============================================================================
-- 1. REMOVE FOREIGN KEY CONSTRAINTS
-- =============================================================================

-- Page foreign keys
ALTER TABLE "pages" DROP CONSTRAINT IF EXISTS "pages_documentId_fkey";
ALTER TABLE "pages" DROP CONSTRAINT IF EXISTS "pages_companyId_fkey";

-- CompanyWatch foreign keys
ALTER TABLE "company_watches" DROP CONSTRAINT IF EXISTS "company_watches_userId_fkey";
ALTER TABLE "company_watches" DROP CONSTRAINT IF EXISTS "company_watches_companyId_fkey";

-- DealCompany foreign keys
ALTER TABLE "deal_companies" DROP CONSTRAINT IF EXISTS "deal_companies_companyId_fkey";
ALTER TABLE "deal_companies" DROP CONSTRAINT IF EXISTS "deal_companies_dealId_fkey";

-- =============================================================================
-- 2. DROP INDEXES
-- =============================================================================

-- Page indexes
DROP INDEX IF EXISTS "pages_documentId_idx";
DROP INDEX IF EXISTS "pages_companyId_idx";

-- CompanyWatch indexes
DROP INDEX IF EXISTS "company_watches_userId_idx";
DROP INDEX IF EXISTS "company_watches_companyId_idx";
DROP INDEX IF EXISTS "company_watches_companyId_userId_key";

-- DealCompany indexes
DROP INDEX IF EXISTS "deal_companies_companyId_idx";
DROP INDEX IF EXISTS "deal_companies_dealId_idx";
DROP INDEX IF EXISTS "deal_companies_dealId_companyId_key";

-- =============================================================================
-- 3. ALTER PAGES TABLE (Remove new columns)
-- =============================================================================

ALTER TABLE "pages" DROP COLUMN IF EXISTS "documentId";
ALTER TABLE "pages" DROP COLUMN IF EXISTS "companyId";
ALTER TABLE "pages" DROP COLUMN IF EXISTS "type";

-- =============================================================================
-- 4. DROP TABLES
-- =============================================================================

DROP TABLE IF EXISTS "company_watches";
DROP TABLE IF EXISTS "deal_companies";

-- =============================================================================
-- 5. DROP ENUMS
-- =============================================================================

DROP TYPE IF EXISTS "PageType";
DROP TYPE IF EXISTS "DealCompanyRole";

-- Note: The original Deal.companyId relationship data is preserved
-- as it was never removed from the deals table
