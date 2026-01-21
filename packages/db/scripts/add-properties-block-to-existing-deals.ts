/**
 * Data Migration Script: Add Properties Block to Existing Deals
 *
 * This script adds the databaseViewBlock (deal properties inline database)
 * to existing deal root pages. It's safe to run multiple times (idempotent).
 *
 * Phase 12: Deal Properties as Inline Database Block
 *
 * Usage:
 *   pnpm --filter @trato-hive/db migrate:properties-block           # Run migration
 *   pnpm --filter @trato-hive/db migrate:properties-block --dry-run # Preview changes
 *
 * What it does:
 * 1. For each deal with a databaseEntryId:
 *    - Find the deal's root page (page with dealId and no parentPageId)
 *    - Check if databaseViewBlock with singleEntryMode already exists
 *    - If not, create it and shift existing blocks' order down
 */
import { PrismaClient, type Prisma } from "@prisma/client";

const DEALS_DATABASE_NAME = "Deals";

interface MigrationStats {
  dealsProcessed: number;
  blocksCreated: number;
  dealsSkipped: number;
  errors: string[];
}

async function addPropertiesBlockToDeal(
  prisma: PrismaClient,
  deal: {
    id: string;
    name: string;
    databaseEntryId: string;
    organizationId: string;
  },
  systemUserId: string
): Promise<boolean> {
  // Get the deal's database entry to find the Deals Database ID
  const databaseEntry = await prisma.databaseEntry.findUnique({
    where: { id: deal.databaseEntryId },
    select: { id: true, databaseId: true },
  });

  if (!databaseEntry) {
    throw new Error(`DatabaseEntry ${deal.databaseEntryId} not found`);
  }

  // Find the deal's root page (page with dealId and no parentPageId)
  const rootPage = await prisma.page.findFirst({
    where: {
      dealId: deal.id,
      parentPageId: null,
    },
  });

  if (!rootPage) {
    throw new Error(`Root page not found for deal ${deal.id}`);
  }

  // Check if databaseViewBlock with singleEntryMode already exists
  const existingBlocks = await prisma.block.findMany({
    where: { pageId: rootPage.id },
    orderBy: { order: "asc" },
  });

  const hasPropertiesBlock = existingBlocks.some((block) => {
    if (block.type !== "databaseViewBlock") return false;
    const props = block.properties as Record<string, unknown> | null;
    return props?.singleEntryMode === true;
  });

  if (hasPropertiesBlock) {
    return false; // Already has properties block, skip
  }

  // Find the deal_header block to insert after it
  const dealHeaderIndex = existingBlocks.findIndex((b) => b.type === "deal_header");
  const insertOrder = dealHeaderIndex >= 0 ? existingBlocks[dealHeaderIndex].order + 1 : 1;

  // Shift existing blocks with order >= insertOrder
  const blocksToShift = existingBlocks.filter((b) => b.order >= insertOrder);
  for (const block of blocksToShift) {
    await prisma.block.update({
      where: { id: block.id },
      data: { order: block.order + 1 },
    });
  }

  // Create the databaseViewBlock for deal properties
  await prisma.block.create({
    data: {
      pageId: rootPage.id,
      type: "databaseViewBlock",
      order: insertOrder,
      properties: {
        databaseId: databaseEntry.databaseId,
        viewType: "table",
        filterEntryId: databaseEntry.id,
        singleEntryMode: true,
        filters: [],
        sortBy: null,
        groupBy: null,
        hiddenColumns: ["name"], // Name shown in page title already
      } as Prisma.InputJsonValue,
      createdBy: systemUserId,
    },
  });

  return true; // Block created
}

async function runMigration(dryRun: boolean = false): Promise<MigrationStats> {
  const prisma = new PrismaClient();
  const stats: MigrationStats = {
    dealsProcessed: 0,
    blocksCreated: 0,
    dealsSkipped: 0,
    errors: [],
  };

  try {
    console.log(`\n🚀 Starting Add Properties Block Migration${dryRun ? " (DRY RUN)" : ""}\n`);

    // Get a system user for creating blocks
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

    // Get all deals with databaseEntryId (already migrated to database entries)
    const dealsToProcess = await prisma.deal.findMany({
      where: {
        databaseEntryId: { not: null },
      },
      select: {
        id: true,
        name: true,
        databaseEntryId: true,
        organizationId: true,
      },
    });

    console.log(`Found ${dealsToProcess.length} deals to process\n`);

    for (const deal of dealsToProcess) {
      try {
        if (dryRun) {
          // Check if it would be created
          const databaseEntry = await prisma.databaseEntry.findUnique({
            where: { id: deal.databaseEntryId! },
          });

          const rootPage = await prisma.page.findFirst({
            where: { dealId: deal.id, parentPageId: null },
          });

          if (!databaseEntry || !rootPage) {
            console.log(`  [DRY RUN] ✗ Would skip deal: ${deal.name} (missing entry or root page)`);
            stats.dealsSkipped++;
          } else {
            const existingBlocks = await prisma.block.findMany({
              where: { pageId: rootPage.id },
            });

            const hasPropertiesBlock = existingBlocks.some((block) => {
              if (block.type !== "databaseViewBlock") return false;
              const props = block.properties as Record<string, unknown> | null;
              return props?.singleEntryMode === true;
            });

            if (hasPropertiesBlock) {
              console.log(`  [DRY RUN] ○ Would skip deal: ${deal.name} (already has properties block)`);
              stats.dealsSkipped++;
            } else {
              console.log(`  [DRY RUN] ✓ Would add properties block to: ${deal.name}`);
              stats.blocksCreated++;
            }
          }
        } else {
          const created = await addPropertiesBlockToDeal(
            prisma,
            { ...deal, databaseEntryId: deal.databaseEntryId! },
            systemUser.id
          );

          if (created) {
            console.log(`  ✓ Added properties block to: ${deal.name}`);
            stats.blocksCreated++;
          } else {
            console.log(`  ○ Skipped deal: ${deal.name} (already has properties block)`);
            stats.dealsSkipped++;
          }
        }

        stats.dealsProcessed++;
      } catch (dealError) {
        const errorMsg = `Failed to process deal ${deal.id} (${deal.name}): ${dealError instanceof Error ? dealError.message : String(dealError)}`;
        stats.errors.push(errorMsg);
        console.error(`  ✗ ${errorMsg}`);
      }
    }

    // Print summary
    console.log("\n═══════════════════════════════════════════════════════════");
    console.log("                    MIGRATION SUMMARY");
    console.log("═══════════════════════════════════════════════════════════");
    console.log(`Deals processed:   ${stats.dealsProcessed}`);
    console.log(`Blocks created:    ${stats.blocksCreated}`);
    console.log(`Deals skipped:     ${stats.dealsSkipped}`);
    console.log(`Errors:            ${stats.errors.length}`);
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
