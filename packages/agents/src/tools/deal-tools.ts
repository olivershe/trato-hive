/**
 * Deal Management Tools
 *
 * Tool definitions for creating and managing deals via the ActionAgent.
 */
import { z } from 'zod';
import type { PrismaClient, DealStage, DealType } from '@trato-hive/db';
import type { Tool } from '@trato-hive/ai-core';

// Valid deal stages from the enum
const DEAL_STAGES = [
  'SOURCING',
  'INITIAL_REVIEW',
  'PRELIMINARY_DUE_DILIGENCE',
  'DEEP_DUE_DILIGENCE',
  'NEGOTIATION',
  'CLOSING',
  'CLOSED_WON',
  'CLOSED_LOST',
] as const;

// =============================================================================
// Tool Schemas (Zod for validation)
// =============================================================================

export const updateDealSchema = z.object({
  dealId: z.string().optional().describe('The ID of the deal to update'),
  dealName: z.string().optional().describe('The name of the deal to update (used if dealId not provided)'),
  stage: z.enum(DEAL_STAGES).optional().describe('New stage for the deal'),
  probability: z.number().min(0).max(100).optional().describe('Win probability percentage'),
  value: z.number().positive().optional().describe('Deal value in dollars'),
  notes: z.string().optional().describe('Notes to add to the deal'),
});

export const createDealSchema = z.object({
  name: z.string().describe('Name of the deal'),
  companyId: z.string().describe('ID of the target company'),
  stage: z.enum(DEAL_STAGES).optional().describe('Initial stage for the deal'),
  value: z.number().positive().optional().describe('Deal value in dollars'),
});

export const getDealSummarySchema = z.object({
  dealId: z.string().optional().describe('The ID of the deal to summarize'),
  dealName: z.string().optional().describe('The name of the deal to summarize (used if dealId not provided)'),
});

export type UpdateDealInput = z.infer<typeof updateDealSchema>;
export type CreateDealInput = z.infer<typeof createDealSchema>;
export type GetDealSummaryInput = z.infer<typeof getDealSummarySchema>;

// =============================================================================
// Tool Definitions (for LLM)
// =============================================================================

export const updateDealTool: Tool = {
  name: 'update_deal',
  description:
    'Update properties of an existing deal. Use this to change the stage, probability, value, or add notes to a deal. You can identify the deal by either its ID or name.',
  input_schema: {
    type: 'object',
    properties: {
      dealId: {
        type: 'string',
        description: 'The ID of the deal to update (optional if dealName is provided)',
      },
      dealName: {
        type: 'string',
        description: 'The name of the deal to update. Use this when the user refers to a deal by name instead of ID.',
      },
      stage: {
        type: 'string',
        description: 'New stage for the deal. Valid stages: SOURCING, INITIAL_REVIEW, PRELIMINARY_DUE_DILIGENCE, DEEP_DUE_DILIGENCE, NEGOTIATION, CLOSING, CLOSED_WON, CLOSED_LOST',
      },
      probability: {
        type: 'number',
        description: 'Win probability percentage (0-100)',
      },
      value: {
        type: 'number',
        description: 'Deal value in dollars',
      },
      notes: {
        type: 'string',
        description: 'Notes to add to the deal',
      },
    },
    required: [],
  },
};

export const createDealTool: Tool = {
  name: 'create_deal',
  description:
    'Create a new deal in the CRM. Requires a name and company ID.',
  input_schema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name of the deal',
      },
      companyId: {
        type: 'string',
        description: 'ID of the target company',
      },
      stage: {
        type: 'string',
        description: 'Initial stage for the deal. Valid stages: SOURCING, INITIAL_REVIEW, PRELIMINARY_DUE_DILIGENCE, DEEP_DUE_DILIGENCE, NEGOTIATION, CLOSING, CLOSED_WON, CLOSED_LOST. Defaults to SOURCING.',
      },
      value: {
        type: 'number',
        description: 'Deal value in dollars (optional)',
      },
    },
    required: ['name', 'companyId'],
  },
};

export const getDealSummaryTool: Tool = {
  name: 'get_deal_summary',
  description:
    'Get a summary and briefing for a specific deal, including key information, recent activity, and documents. You can identify the deal by either its ID or name.',
  input_schema: {
    type: 'object',
    properties: {
      dealId: {
        type: 'string',
        description: 'The ID of the deal to summarize (optional if dealName is provided)',
      },
      dealName: {
        type: 'string',
        description: 'The name of the deal to summarize. Use this when the user refers to a deal by name.',
      },
    },
    required: [],
  },
};

// =============================================================================
// Tool Executors
// =============================================================================

export interface DealToolContext {
  organizationId: string;
  userId: string;
}

/**
 * Execute update_deal tool
 */
export async function executeUpdateDeal(
  db: PrismaClient,
  input: UpdateDealInput,
  context: DealToolContext
): Promise<{ success: boolean; message: string; deal?: Record<string, unknown> }> {
  // Validate input
  const validated = updateDealSchema.parse(input);

  // Need either dealId or dealName
  if (!validated.dealId && !validated.dealName) {
    return {
      success: false,
      message: 'Please provide either a deal ID or deal name to identify the deal.',
    };
  }

  // Find deal by ID or name
  let deal;
  if (validated.dealId) {
    deal = await db.deal.findFirst({
      where: {
        id: validated.dealId,
        organizationId: context.organizationId,
      },
    });
  } else if (validated.dealName) {
    // Search by name (case-insensitive)
    deal = await db.deal.findFirst({
      where: {
        name: {
          contains: validated.dealName,
          mode: 'insensitive',
        },
        organizationId: context.organizationId,
      },
    });
  }

  if (!deal) {
    const identifier = validated.dealId || validated.dealName;
    // List available deals to help the user
    const availableDeals = await db.deal.findMany({
      where: { organizationId: context.organizationId },
      select: { id: true, name: true, stage: true },
      take: 10,
      orderBy: { updatedAt: 'desc' },
    });

    const dealList = availableDeals.map(d => `- "${d.name}" (${d.stage})`).join('\n');
    return {
      success: false,
      message: `Deal not found: "${identifier}". Here are your recent deals:\n${dealList}`,
    };
  }

  // Build update data
  const updateData: Record<string, unknown> = {};
  if (validated.stage !== undefined) updateData.stage = validated.stage as DealStage;
  if (validated.probability !== undefined) updateData.probability = validated.probability;
  if (validated.value !== undefined) updateData.value = validated.value;
  if (validated.notes !== undefined) updateData.notes = validated.notes;

  // Update the deal
  const updatedDeal = await db.deal.update({
    where: { id: deal.id },
    data: updateData,
  });

  // Add activity log for the update
  await db.activity.create({
    data: {
      dealId: deal.id,
      type: 'USER_ACTION',
      description: `Deal updated: ${Object.keys(updateData).join(', ')}`,
      userId: context.userId,
    },
  });

  return {
    success: true,
    message: `Deal "${updatedDeal.name}" updated successfully.`,
    deal: {
      id: updatedDeal.id,
      name: updatedDeal.name,
      stage: updatedDeal.stage,
      probability: updatedDeal.probability,
      value: updatedDeal.value?.toString(),
    },
  };
}

/**
 * Execute create_deal tool
 */
export async function executeCreateDeal(
  db: PrismaClient,
  input: CreateDealInput,
  context: DealToolContext
): Promise<{ success: boolean; message: string; deal?: Record<string, unknown> }> {
  // Validate input
  const validated = createDealSchema.parse(input);

  // Verify company exists and belongs to organization
  const company = await db.company.findFirst({
    where: {
      id: validated.companyId,
      organizationId: context.organizationId,
    },
  });

  if (!company) {
    return {
      success: false,
      message: `Company not found: ${validated.companyId}`,
    };
  }

  // Create the deal
  const deal = await db.deal.create({
    data: {
      name: validated.name,
      type: 'ACQUISITION' as DealType, // Default type
      stage: (validated.stage as DealStage) || 'SOURCING',
      value: validated.value,
      organizationId: context.organizationId,
      companyId: validated.companyId,
    },
  });

  // Log activity
  await db.activity.create({
    data: {
      dealId: deal.id,
      type: 'DEAL_CREATED',
      description: `Deal "${deal.name}" created`,
      userId: context.userId,
    },
  });

  return {
    success: true,
    message: `Deal "${deal.name}" created successfully.`,
    deal: {
      id: deal.id,
      name: deal.name,
      stage: deal.stage,
      companyId: deal.companyId,
      value: deal.value?.toString(),
    },
  };
}

/**
 * Execute get_deal_summary tool
 */
export async function executeGetDealSummary(
  db: PrismaClient,
  input: GetDealSummaryInput,
  context: DealToolContext
): Promise<{ success: boolean; message: string; summary?: Record<string, unknown> }> {
  // Validate input
  const validated = getDealSummarySchema.parse(input);

  // Need either dealId or dealName
  if (!validated.dealId && !validated.dealName) {
    return {
      success: false,
      message: 'Please provide either a deal ID or deal name to identify the deal.',
    };
  }

  // Build where clause based on provided identifier
  const whereClause: Record<string, unknown> = {
    organizationId: context.organizationId,
  };

  if (validated.dealId) {
    whereClause.id = validated.dealId;
  } else if (validated.dealName) {
    whereClause.name = {
      contains: validated.dealName,
      mode: 'insensitive',
    };
  }

  // Get deal with related data
  const deal = await db.deal.findFirst({
    where: whereClause,
    include: {
      company: true,
      documents: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, status: true, createdAt: true },
      },
      activities: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, type: true, description: true, createdAt: true },
      },
    },
  });

  if (!deal) {
    const identifier = validated.dealId || validated.dealName;
    // List available deals to help the user
    const availableDeals = await db.deal.findMany({
      where: { organizationId: context.organizationId },
      select: { id: true, name: true, stage: true },
      take: 10,
      orderBy: { updatedAt: 'desc' },
    });

    const dealList = availableDeals.map(d => `- "${d.name}" (${d.stage})`).join('\n');
    return {
      success: false,
      message: `Deal not found: "${identifier}". Here are your recent deals:\n${dealList}`,
    };
  }

  return {
    success: true,
    message: `Summary for deal "${deal.name}"`,
    summary: {
      id: deal.id,
      name: deal.name,
      stage: deal.stage,
      probability: deal.probability,
      value: deal.value?.toString(),
      company: deal.company
        ? { id: deal.company.id, name: deal.company.name }
        : null,
      recentDocuments: deal.documents.map((d) => ({
        id: d.id,
        name: d.name,
        status: d.status,
        createdAt: d.createdAt,
      })),
      recentActivity: deal.activities.map((a) => ({
        id: a.id,
        type: a.type,
        description: a.description,
        createdAt: a.createdAt,
      })),
      createdAt: deal.createdAt,
      updatedAt: deal.updatedAt,
    },
  };
}
