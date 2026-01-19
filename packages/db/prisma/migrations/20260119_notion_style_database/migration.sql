-- Notion-Style Database: Add custom fields support
-- This migration adds:
-- 1. New enums: DealPriority, DealSource, FieldType
-- 2. New fields on Deal: leadPartnerId, priority, source, customFields
-- 3. New tables: DealFieldSchema, DealViewConfig

-- =============================================================================
-- 1. CREATE ENUMS
-- =============================================================================

-- DealPriority enum
CREATE TYPE "DealPriority" AS ENUM ('NONE', 'LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- DealSource enum
CREATE TYPE "DealSource" AS ENUM ('REFERRAL', 'OUTBOUND', 'INBOUND', 'AUCTION', 'NETWORK', 'OTHER');

-- FieldType enum for custom fields
CREATE TYPE "FieldType" AS ENUM ('TEXT', 'NUMBER', 'SELECT', 'MULTI_SELECT', 'DATE', 'PERSON', 'CHECKBOX', 'URL');

-- =============================================================================
-- 2. ADD COLUMNS TO DEALS TABLE
-- =============================================================================

-- Add leadPartnerId column
ALTER TABLE "deals" ADD COLUMN "leadPartnerId" TEXT;

-- Add priority column with default
ALTER TABLE "deals" ADD COLUMN "priority" "DealPriority" NOT NULL DEFAULT 'NONE';

-- Add source column (nullable)
ALTER TABLE "deals" ADD COLUMN "source" "DealSource";

-- Add customFields JSON column for storing custom field values
ALTER TABLE "deals" ADD COLUMN "customFields" JSONB;

-- =============================================================================
-- 3. CREATE DEAL FIELD SCHEMA TABLE
-- =============================================================================

CREATE TABLE "deal_field_schemas" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "FieldType" NOT NULL,
    "options" JSONB,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_field_schemas_pkey" PRIMARY KEY ("id")
);

-- =============================================================================
-- 4. CREATE DEAL VIEW CONFIG TABLE
-- =============================================================================

CREATE TABLE "deal_view_configs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "columnOrder" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hiddenColumns" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "columnWidths" JSONB NOT NULL DEFAULT '{}',
    "defaultView" TEXT NOT NULL DEFAULT 'table',
    "sortBy" TEXT,
    "sortDirection" TEXT,
    "filters" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_view_configs_pkey" PRIMARY KEY ("id")
);

-- =============================================================================
-- 5. CREATE INDEXES
-- =============================================================================

-- Deal indexes
CREATE INDEX "deals_leadPartnerId_idx" ON "deals"("leadPartnerId");
CREATE INDEX "deals_priority_idx" ON "deals"("priority");
CREATE INDEX "deals_source_idx" ON "deals"("source");

-- DealFieldSchema indexes
CREATE UNIQUE INDEX "deal_field_schemas_organizationId_name_key" ON "deal_field_schemas"("organizationId", "name");
CREATE INDEX "deal_field_schemas_organizationId_idx" ON "deal_field_schemas"("organizationId");

-- DealViewConfig indexes
CREATE UNIQUE INDEX "deal_view_configs_userId_organizationId_key" ON "deal_view_configs"("userId", "organizationId");
CREATE INDEX "deal_view_configs_userId_idx" ON "deal_view_configs"("userId");
CREATE INDEX "deal_view_configs_organizationId_idx" ON "deal_view_configs"("organizationId");

-- =============================================================================
-- 6. ADD FOREIGN KEY CONSTRAINTS
-- =============================================================================

-- Deal leadPartner foreign key
ALTER TABLE "deals" ADD CONSTRAINT "deals_leadPartnerId_fkey"
    FOREIGN KEY ("leadPartnerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- DealFieldSchema foreign key
ALTER TABLE "deal_field_schemas" ADD CONSTRAINT "deal_field_schemas_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DealViewConfig foreign keys
ALTER TABLE "deal_view_configs" ADD CONSTRAINT "deal_view_configs_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deal_view_configs" ADD CONSTRAINT "deal_view_configs_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
