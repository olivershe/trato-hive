/**
 * Data Migration Script: Migrate Deals to Database Entries
 *
 * This script migrates existing deals to have DatabaseEntry records in the
 * org-level Deals Database. It's safe to run multiple times (idempotent).
 *
 * Phase 12: Deals Database Architecture Migration
 *
 * Usage:
 *   pnpm --filter @trato-hive/db migrate:deals           # Run migration
 *   pnpm --filter @trato-hive/db migrate:deals --dry-run # Preview changes
 *
 * What it does:
 * 1. For each organization: get or create the Deals Database
 * 2. For each deal without databaseEntryId: create DatabaseEntry
 * 3. Link the entry to the existing deal root page
 * 4. Update the deal with databaseEntryId
 */
import { PrismaClient, type Prisma } from "@prisma/client";

// Schema definition for the Deals Database
const DEALS_DATABASE_SCHEMA = {
  columns: [
    { id: "name", name: "Name", type: "TEXT", width: 200 },
    {
      id: "stage",
      name: "Stage",
      type: "STATUS",
      statusOptions: [
        { id: "SOURCING", name: "Sourcing", color: "gray" },
        { id: "INITIAL_REVIEW", name: "Initial Review", color: "blue" },
        { id: "PRELIMINARY_DUE_DILIGENCE", name: "Prelim DD", color: "blue" },
        { id: "DEEP_DUE_DILIGENCE", name: "Deep DD", color: "purple" },
        { id: "NEGOTIATION", name: "Negotiation", color: "yellow" },
        { id: "CLOSING", name: "Closing", color: "yellow" },
        { id: "CLOSED_WON", name: "Closed Won", color: "green" },
        { id: "CLOSED_LOST", name: "Closed Lost", color: "red" },
      ],
      width: 140,
    },
    {
      id: "type",
      name: "Type",
      type: "SELECT",
      options: ["Acquisition", "Investment", "Partnership", "Other"],
      width: 120,
    },
    {
      id: "priority",
      name: "Priority",
      type: "STATUS",
      statusOptions: [
        { id: "NONE", name: "None", color: "gray" },
        { id: "LOW", name: "Low", color: "gray" },
        { id: "MEDIUM", name: "Medium", color: "blue" },
        { id: "HIGH", name: "High", color: "yellow" },
        { id: "URGENT", name: "Urgent", color: "red" },
      ],
      width: 100,
    },
    { id: "value", name: "Value", type: "NUMBER", width: 120 },
    { id: "probability", name: "Probability", type: "NUMBER", width: 100 },
    {
      id: "source",
      name: "Source",
      type: "SELECT",
      options: ["Referral", "Outbound", "Inbound", "Auction", "Network", "Other"],
      width: 120,
    },
    { id: "expectedCloseDate", name: "Expected Close", type: "DATE", width: 140 },
    { id: "leadPartner", name: "Lead Partner", type: "PERSON", width: 140 },
  ],
};

const DEALS_DATABASE_NAME = "Deals";
const DEALS_DATABASE_DESCRIPTION = "Organization deals pipeline powered by Notion-style database";

interface MigrationStats {
  organizationsProcessed: number;
  databasesCreated: number;
  entriesCreated: number;
  dealsUpdated: number;
  errors: string[];
}

async function getOrCreateDealsDatabase(
  prisma: PrismaClient,
  organizationId: string,
  systemUserId: string
) {
  // Try to find existing Deals Database
  const existing = await prisma.database.findFirst({
    where: {
      organizationId,
      isOrgLevel: true,
      name: DEALS_DATABASE_NAME,
    },
  });

  if (existing) {
    return { database: existing, created: false };
  }

  // Create org-level page for the database
  const databasePage = await prisma.page.create({
    data: {
      organizationId,
      title: DEALS_DATABASE_NAME,
      icon: "📊",
      isDatabase: true,
    },
  });

  // Create the Deals Database
  const database = await prisma.database.create({
    data: {
      name: DEALS_DATABASE_NAME,
      description: DEALS_DATABASE_DESCRIPTION,
      schema: DEALS_DATABASE_SCHEMA as unknown as Prisma.InputJsonValue,
      organizationId,
      isOrgLevel: true,
      pageId: databasePage.id,
      createdById: systemUserId,
    },
  });

  return { database, created: true };
}

async function migrateDealToEntry(
  prisma: PrismaClient,
  deal: {
    id: string;
    name: string;
    stage: string;
    type: string;
    priority: string;
    value: { toNumber: () => number } | null;
    probability: number | null;
    source: string | null;
    expectedCloseDate: Date | null;
    leadPartnerId: string | null;
    organizationId: string;
  },
  databaseId: string,
  databasePageId: string,
  systemUserId: string
) {
  // Get the deal's root page (to link the entry)
  const dealRootPage = await prisma.page.findFirst({
    where: {
      dealId: deal.id,
      parentPageId: null,
    },
  });

  // Create entry properties from deal fields
  const properties = {
    name: deal.name,
    stage: deal.stage,
    type: deal.type,
    priority: deal.priority || "NONE",
    value: deal.value ? deal.value.toNumber() : null,
    probability: deal.probability,
    source: deal.source,
    expectedCloseDate: deal.expectedCloseDate?.toISOString() || null,
    leadPartner: deal.leadPartnerId,
  };

  // Create entry page (child of deals database page)
  const entryPage = await prisma.page.create({
    data: {
      organizationId: deal.organizationId,
      parentPageId: databasePageId,
      title: deal.name,
      icon: "📋",
    },
  });

  // Create the database entry
  const entry = await prisma.databaseEntry.create({
    data: {
      databaseId,
      properties: properties as Prisma.InputJsonValue,
      pageId: dealRootPage?.id || entryPage.id, // Use existing root page if available
      createdById: systemUserId,
    },
  });

  // Update the deal with the entry link
  await prisma.deal.update({
    where: { id: deal.id },
    data: { databaseEntryId: entry.id },
  });

  return entry;
}

async function runMigration(dryRun: boolean = false): Promise<MigrationStats> {
  const prisma = new PrismaClient();
  const stats: MigrationStats = {
    organizationsProcessed: 0,
    databasesCreated: 0,
    entriesCreated: 0,
    dealsUpdated: 0,
    errors: [],
  };

  try {
    console.log(`\n🚀 Starting Deals Database Migration${dryRun ? " (DRY RUN)" : ""}\n`);

    // Get all organizations
    const organizations = await prisma.organization.findMany({
      select: { id: true, name: true },
    });

    console.log(`Found ${organizations.length} organizations to process\n`);

    // Get a system user for creating entries (use first admin)
    const systemUser = await prisma.user.findFirst({
      where: {
        organizations: {
          some: {
            role: "ADMIN",
          },
        },
      },
    });

    if (!systemUser) {
      throw new Error("No admin user found to use as system user for migration");
    }

    for (const org of organizations) {
      console.log(`Processing organization: ${org.name} (${org.id})`);

      try {
        // Get or create Deals Database
        let databaseInfo;
        if (dryRun) {
          const existing = await prisma.database.findFirst({
            where: {
              organizationId: org.id,
              isOrgLevel: true,
              name: DEALS_DATABASE_NAME,
            },
          });
          databaseInfo = existing
            ? { database: existing, created: false }
            : { database: { id: "DRY_RUN", pageId: "DRY_RUN" }, created: true };
        } else {
          databaseInfo = await getOrCreateDealsDatabase(prisma, org.id, systemUser.id);
        }

        if (databaseInfo.created) {
          stats.databasesCreated++;
          console.log(`  ✓ Created Deals Database`);
        } else {
          console.log(`  ○ Using existing Deals Database`);
        }

        // Get deals without databaseEntryId
        const dealsToMigrate = await prisma.deal.findMany({
          where: {
            organizationId: org.id,
            databaseEntryId: null,
          },
          select: {
            id: true,
            name: true,
            stage: true,
            type: true,
            priority: true,
            value: true,
            probability: true,
            source: true,
            expectedCloseDate: true,
            leadPartnerId: true,
            organizationId: true,
          },
        });

        console.log(`  Found ${dealsToMigrate.length} deals to migrate`);

        for (const deal of dealsToMigrate) {
          try {
            if (dryRun) {
              console.log(`    [DRY RUN] Would migrate deal: ${deal.name}`);
            } else {
              await migrateDealToEntry(
                prisma,
                deal,
                databaseInfo.database.id,
                databaseInfo.database.pageId,
                systemUser.id
              );
              console.log(`    ✓ Migrated deal: ${deal.name}`);
            }
            stats.entriesCreated++;
            stats.dealsUpdated++;
          } catch (dealError) {
            const errorMsg = `Failed to migrate deal ${deal.id}: ${dealError instanceof Error ? dealError.message : String(dealError)}`;
            stats.errors.push(errorMsg);
            console.error(`    ✗ ${errorMsg}`);
          }
        }

        stats.organizationsProcessed++;
      } catch (orgError) {
        const errorMsg = `Failed to process org ${org.id}: ${orgError instanceof Error ? orgError.message : String(orgError)}`;
        stats.errors.push(errorMsg);
        console.error(`  ✗ ${errorMsg}`);
      }

      console.log("");
    }

    // Print summary
    console.log("═══════════════════════════════════════════════════════════");
    console.log("                    MIGRATION SUMMARY");
    console.log("═══════════════════════════════════════════════════════════");
    console.log(`Organizations processed: ${stats.organizationsProcessed}`);
    console.log(`Databases created:       ${stats.databasesCreated}`);
    console.log(`Entries created:         ${stats.entriesCreated}`);
    console.log(`Deals updated:           ${stats.dealsUpdated}`);
    console.log(`Errors:                  ${stats.errors.length}`);
    console.log("═══════════════════════════════════════════════════════════");

    if (stats.errors.length > 0) {
      console.log("\nErrors encountered:");
      stats.errors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
    }

    if (dryRun) {
      console.log("\n⚠️  DRY RUN - No changes were made to the database\n");
    } else {
      console.log("\n✅ Migration completed successfully\n");
    }

    return stats;
  } finally {
    await prisma.$disconnect();
  }
}

// Main entry point
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");

runMigration(dryRun)
  .then((stats) => {
    process.exit(stats.errors.length > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
