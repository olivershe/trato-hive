/**
 * Database Creator Helper
 *
 * Creates real Database + DatabaseEntry records from the LLM's
 * GeneratedDatabaseSpec output during page generation.
 */
import type { PrismaClient, Prisma } from '@trato-hive/db';
import type { GeneratedDatabaseSpec, GeneratedColumnSpec } from '@trato-hive/ai-core';
import { createId } from '@paralleldrive/cuid2';

// =============================================================================
// Types
// =============================================================================

export interface CreateDatabaseFromGenerationInput {
  db: PrismaClient;
  parentPageId: string;
  dealId: string;
  organizationId: string;
  userId: string;
  spec: GeneratedDatabaseSpec;
  order: number;
}

export interface CreateDatabaseFromGenerationResult {
  databaseId: string;
  pageId: string;
  entryCount: number;
}

// =============================================================================
// Main Function
// =============================================================================

/**
 * Create a real Database entity from an LLM-generated specification.
 *
 * Flow:
 * 1. Create a child Page (isDatabase: true, parentPageId)
 * 2. Create Database with schema mapped from spec.columns
 * 3. Create DatabaseEntry records for each spec.entries row
 * 4. Return databaseId for injection into the databaseViewBlock node
 */
export async function createDatabaseFromGeneration(
  input: CreateDatabaseFromGenerationInput
): Promise<CreateDatabaseFromGenerationResult> {
  const { db, parentPageId, dealId, organizationId, userId, spec } = input;

  // Map columns to the database schema format
  const columns = spec.columns.map((col: GeneratedColumnSpec) => ({
    id: createId(),
    name: col.name,
    type: col.type,
    ...(col.options ? { options: col.options } : {}),
    width: getDefaultWidth(col.type),
  }));

  // Build column name → ID mapping for entry property keys
  const columnNameToId = new Map<string, string>();
  for (let i = 0; i < spec.columns.length; i++) {
    columnNameToId.set(spec.columns[i].name, columns[i].id);
  }

  const result = await db.$transaction(async (tx) => {
    // 1. Create child page for the database
    const databasePage = await tx.page.create({
      data: {
        dealId,
        parentPageId,
        title: spec.name,
        icon: '📊',
        isDatabase: true,
      },
    });

    // 2. Create the database
    const database = await tx.database.create({
      data: {
        name: spec.name,
        description: `AI-generated database: ${spec.name}`,
        schema: { columns } as unknown as Prisma.JsonObject,
        organizationId,
        dealId,
        pageId: databasePage.id,
        createdById: userId,
      },
    });

    // 3. Create entries
    let entryCount = 0;
    for (const entryData of spec.entries) {
      // Map entry keys from column names to column IDs
      const properties: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(entryData)) {
        const columnId = columnNameToId.get(key);
        if (columnId) {
          properties[columnId] = value;
        }
      }

      await tx.databaseEntry.create({
        data: {
          databaseId: database.id,
          properties: properties as Prisma.JsonObject,
          suggestedBy: 'GeneratorAgent',
          factIds: [],
          createdById: userId,
        },
      });
      entryCount++;
    }

    return {
      databaseId: database.id,
      pageId: databasePage.id,
      entryCount,
    };
  });

  return result;
}

// =============================================================================
// Helpers
// =============================================================================

function getDefaultWidth(type: GeneratedColumnSpec['type']): number {
  switch (type) {
    case 'TEXT':
      return 200;
    case 'NUMBER':
      return 120;
    case 'SELECT':
    case 'STATUS':
      return 140;
    case 'DATE':
      return 140;
    case 'CHECKBOX':
      return 80;
    case 'URL':
      return 200;
    case 'MULTI_SELECT':
      return 180;
    default:
      return 150;
  }
}
