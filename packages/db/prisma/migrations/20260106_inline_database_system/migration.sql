-- CreateEnum
CREATE TYPE "DatabaseColumnType" AS ENUM ('TEXT', 'NUMBER', 'SELECT', 'MULTI_SELECT', 'DATE', 'PERSON', 'CHECKBOX', 'URL');

-- CreateTable
CREATE TABLE "databases" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "schema" JSONB NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "databases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "database_entries" (
    "id" TEXT NOT NULL,
    "databaseId" TEXT NOT NULL,
    "properties" JSONB NOT NULL,
    "suggestedBy" TEXT,
    "factIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "database_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "databases_organizationId_idx" ON "databases"("organizationId");

-- CreateIndex
CREATE INDEX "databases_createdById_idx" ON "databases"("createdById");

-- CreateIndex
CREATE INDEX "database_entries_databaseId_idx" ON "database_entries"("databaseId");

-- CreateIndex
CREATE INDEX "database_entries_createdById_idx" ON "database_entries"("createdById");

-- AddForeignKey
ALTER TABLE "databases" ADD CONSTRAINT "databases_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "databases" ADD CONSTRAINT "databases_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "database_entries" ADD CONSTRAINT "database_entries_databaseId_fkey" FOREIGN KEY ("databaseId") REFERENCES "databases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "database_entries" ADD CONSTRAINT "database_entries_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
