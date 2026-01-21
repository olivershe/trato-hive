/**
 * Company Management Tools
 *
 * Tool definitions for creating and managing companies via the ActionAgent.
 */
import { z } from 'zod';
import type { PrismaClient } from '@trato-hive/db';
import type { Tool } from '@trato-hive/ai-core';

// =============================================================================
// Tool Schemas (Zod for validation)
// =============================================================================

export const updateCompanySchema = z.object({
  companyId: z.string().describe('The ID of the company to update'),
  industry: z.string().optional().describe('Industry sector of the company'),
  sector: z.string().optional().describe('Sub-sector or niche'),
  notes: z.string().optional().describe('Notes about the company'),
  website: z.string().url().optional().describe('Company website URL'),
});

export const createCompanySchema = z.object({
  name: z.string().describe('Name of the company'),
  industry: z.string().optional().describe('Industry sector'),
  website: z.string().url().optional().describe('Company website URL'),
});

export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;

// =============================================================================
// Tool Definitions (for LLM)
// =============================================================================

export const updateCompanyTool: Tool = {
  name: 'update_company',
  description:
    'Update information about a company in the CRM. Use this to change industry, sector, website, or add notes.',
  input_schema: {
    type: 'object',
    properties: {
      companyId: {
        type: 'string',
        description: 'The ID of the company to update',
      },
      industry: {
        type: 'string',
        description: 'Industry sector of the company',
      },
      sector: {
        type: 'string',
        description: 'Sub-sector or niche',
      },
      notes: {
        type: 'string',
        description: 'Notes about the company',
      },
      website: {
        type: 'string',
        description: 'Company website URL',
      },
    },
    required: ['companyId'],
  },
};

export const createCompanyTool: Tool = {
  name: 'create_company',
  description:
    'Create a new company in the CRM. Provide at minimum the company name.',
  input_schema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name of the company',
      },
      industry: {
        type: 'string',
        description: 'Industry sector (optional)',
      },
      website: {
        type: 'string',
        description: 'Company website URL (optional)',
      },
    },
    required: ['name'],
  },
};

// =============================================================================
// Tool Executors
// =============================================================================

export interface CompanyToolContext {
  organizationId: string;
  userId: string;
}

/**
 * Execute update_company tool
 */
export async function executeUpdateCompany(
  db: PrismaClient,
  input: UpdateCompanyInput,
  context: CompanyToolContext
): Promise<{ success: boolean; message: string; company?: Record<string, unknown> }> {
  // Validate input
  const validated = updateCompanySchema.parse(input);

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

  // Build update data
  const updateData: Record<string, unknown> = {};
  if (validated.industry !== undefined) updateData.industry = validated.industry;
  if (validated.sector !== undefined) updateData.sector = validated.sector;
  if (validated.website !== undefined) updateData.website = validated.website;
  if (validated.notes !== undefined) updateData.notes = validated.notes;

  // Update the company
  const updatedCompany = await db.company.update({
    where: { id: validated.companyId },
    data: updateData,
  });

  return {
    success: true,
    message: `Company "${updatedCompany.name}" updated successfully.`,
    company: {
      id: updatedCompany.id,
      name: updatedCompany.name,
      industry: updatedCompany.industry,
      sector: updatedCompany.sector,
      website: updatedCompany.website,
    },
  };
}

/**
 * Execute create_company tool
 */
export async function executeCreateCompany(
  db: PrismaClient,
  input: CreateCompanyInput,
  context: CompanyToolContext
): Promise<{ success: boolean; message: string; company?: Record<string, unknown> }> {
  // Validate input
  const validated = createCompanySchema.parse(input);

  // Check if company with same name exists in org
  const existing = await db.company.findFirst({
    where: {
      name: validated.name,
      organizationId: context.organizationId,
    },
  });

  if (existing) {
    return {
      success: false,
      message: `A company named "${validated.name}" already exists.`,
      company: {
        id: existing.id,
        name: existing.name,
      },
    };
  }

  // Create the company
  const company = await db.company.create({
    data: {
      name: validated.name,
      industry: validated.industry,
      website: validated.website,
      organizationId: context.organizationId,
    },
  });

  return {
    success: true,
    message: `Company "${company.name}" created successfully.`,
    company: {
      id: company.id,
      name: company.name,
      industry: company.industry,
      website: company.website,
    },
  };
}
