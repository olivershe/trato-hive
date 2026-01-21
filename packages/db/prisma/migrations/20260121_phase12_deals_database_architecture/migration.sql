-- Phase 12: Deals Database Architecture Migration
-- Transforms deals system to Notion-style architecture where deals are entries in an org-level database

-- =============================================================================
-- 1. Database Model Updates
-- =============================================================================

-- Make dealId optional (was required)
ALTER TABLE "databases" ALTER COLUMN "dealId" DROP NOT NULL;

-- Add isOrgLevel flag for organization-wide databases
ALTER TABLE "databases" ADD COLUMN "isOrgLevel" BOOLEAN NOT NULL DEFAULT false;

-- Add composite index for org-level database lookup
CREATE INDEX "databases_organizationId_isOrgLevel_idx" ON "databases"("organizationId", "isOrgLevel");

-- =============================================================================
-- 2. Deal Model Updates
-- =============================================================================

-- Add databaseEntryId to link deals to their database entries
ALTER TABLE "deals" ADD COLUMN "databaseEntryId" TEXT;

-- Add unique constraint (one deal per entry)
ALTER TABLE "deals" ADD CONSTRAINT "deals_databaseEntryId_key" UNIQUE ("databaseEntryId");

-- Add foreign key to database_entries
ALTER TABLE "deals" ADD CONSTRAINT "deals_databaseEntryId_fkey"
  FOREIGN KEY ("databaseEntryId") REFERENCES "database_entries"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================================
-- 3. Page Model Updates
-- =============================================================================

-- Make dealId optional (was required)
ALTER TABLE "pages" ALTER COLUMN "dealId" DROP NOT NULL;

-- Add organizationId for org-level pages
ALTER TABLE "pages" ADD COLUMN "organizationId" TEXT;

-- Add foreign key to organizations
ALTER TABLE "pages" ADD CONSTRAINT "pages_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Add indexes for org-level page lookup
CREATE INDEX "pages_organizationId_idx" ON "pages"("organizationId");
CREATE INDEX "pages_organizationId_parentPageId_idx" ON "pages"("organizationId", "parentPageId");
