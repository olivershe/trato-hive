/**
 * Search and Knowledge Tools
 *
 * Tool definitions for searching deals, companies, and knowledge base via the ActionAgent.
 */
import { z } from 'zod';
import type { PrismaClient, Prisma, DealStage } from '@trato-hive/db';
import type { Tool } from '@trato-hive/ai-core';

// Type definitions for semantic-layer (module doesn't have types)
interface VectorStore {
  search(
    embedding: number[],
    organizationId: string,
    options: { topK: number; minScore: number }
  ): Promise<VectorSearchResult[]>;
}

interface EmbeddingService {
  generateEmbedding(text: string): Promise<number[]>;
}

interface VectorSearchResult {
  id: string;
  content: string;
  score: number;
  metadata: {
    documentId?: string;
    documentName?: string;
    pageNumber?: number;
    organizationId?: string;
  };
}

// Valid deal stages
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

export const searchDealsSchema = z.object({
  query: z.string().optional().describe('Search query to filter deals by name'),
  stage: z.enum(DEAL_STAGES).optional().describe('Filter by deal stage'),
  limit: z.number().int().positive().max(20).optional().describe('Maximum results to return'),
});

export const searchKnowledgeSchema = z.object({
  query: z.string().describe('Question or search query for the knowledge base'),
  dealId: z.string().optional().describe('Filter to a specific deal'),
  companyId: z.string().optional().describe('Filter to a specific company'),
});

export const createTaskSchema = z.object({
  description: z.string().describe('Description of the task'),
  dueDate: z.string().optional().describe('Due date in ISO format (YYYY-MM-DD)'),
  dealId: z.string().optional().describe('Associate with a specific deal'),
});

export type SearchDealsInput = z.infer<typeof searchDealsSchema>;
export type SearchKnowledgeInput = z.infer<typeof searchKnowledgeSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

// =============================================================================
// Tool Definitions (for LLM)
// =============================================================================

export const searchDealsTool: Tool = {
  name: 'search_deals',
  description:
    'Search for deals in the CRM. You can filter by name, stage, or both. At least one of query or stage must be provided.',
  input_schema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query to filter deals by name. Optional if stage is provided.',
      },
      stage: {
        type: 'string',
        description: 'Filter by deal stage. Valid stages: SOURCING, INITIAL_REVIEW, PRELIMINARY_DUE_DILIGENCE, DEEP_DUE_DILIGENCE, NEGOTIATION, CLOSING, CLOSED_WON, CLOSED_LOST',
      },
      limit: {
        type: 'number',
        description: 'Maximum results to return (default: 10)',
      },
    },
    required: [],
  },
};

export const searchKnowledgeTool: Tool = {
  name: 'search_knowledge',
  description:
    'Search the knowledge base (documents and facts) using semantic search. Use this to find information from uploaded documents.',
  input_schema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Question or search query for the knowledge base',
      },
      dealId: {
        type: 'string',
        description: 'Filter to a specific deal (optional)',
      },
      companyId: {
        type: 'string',
        description: 'Filter to a specific company (optional)',
      },
    },
    required: ['query'],
  },
};

export const createTaskTool: Tool = {
  name: 'create_task',
  description:
    'Create a task or reminder as an activity. Can be associated with a specific deal.',
  input_schema: {
    type: 'object',
    properties: {
      description: {
        type: 'string',
        description: 'Description of the task',
      },
      dueDate: {
        type: 'string',
        description: 'Due date in ISO format (YYYY-MM-DD)',
      },
      dealId: {
        type: 'string',
        description: 'Associate with a specific deal (optional)',
      },
    },
    required: ['description'],
  },
};

// =============================================================================
// Tool Executors
// =============================================================================

export interface SearchToolContext {
  organizationId: string;
  userId: string;
}

export interface SearchToolDeps {
  db: PrismaClient;
  vectorStore?: VectorStore;
  embeddings?: EmbeddingService;
}

/**
 * Execute search_deals tool
 */
export async function executeSearchDeals(
  deps: SearchToolDeps,
  input: SearchDealsInput,
  context: SearchToolContext
): Promise<{ success: boolean; message: string; deals: Record<string, unknown>[]; ui?: { component: string; props: Record<string, unknown>; layout?: 'inline' | 'full-width' } }> {
  // Validate input
  const validated = searchDealsSchema.parse(input);
  const limit = validated.limit ?? 10;

  // Need at least one filter
  if (!validated.query && !validated.stage) {
    return {
      success: false,
      message: 'Please provide a search query or a stage filter.',
      deals: [],
    };
  }

  // Build where clause
  const where: Prisma.DealWhereInput = {
    organizationId: context.organizationId,
  };

  // Add name-based text search only when query is provided
  if (validated.query) {
    where.OR = [
      { name: { contains: validated.query, mode: 'insensitive' } },
    ];
  }

  if (validated.stage) {
    where.stage = validated.stage as DealStage;
  }

  // Search deals
  const deals = await deps.db.deal.findMany({
    where,
    take: limit,
    orderBy: { updatedAt: 'desc' },
    include: {
      company: {
        select: { id: true, name: true },
      },
    },
  });

  const mappedDeals = deals.map((d) => ({
    id: d.id,
    name: d.name,
    stage: d.stage,
    probability: d.probability,
    value: d.value?.toString(),
    company: d.company ? { id: d.company.id, name: d.company.name } : null,
  }));

  const filterDesc = [
    validated.query ? `matching "${validated.query}"` : null,
    validated.stage ? `in ${validated.stage} stage` : null,
  ].filter(Boolean).join(' ');

  return {
    success: true,
    message: `Found ${deals.length} deal(s) ${filterDesc}`,
    deals: mappedDeals,
    ui: mappedDeals.length > 0
      ? {
          component: 'deal-search-results',
          props: { query: validated.query ?? '', deals: mappedDeals, totalCount: mappedDeals.length },
          layout: 'full-width',
        }
      : undefined,
  };
}

/**
 * Execute search_knowledge tool
 */
export async function executeSearchKnowledge(
  deps: SearchToolDeps,
  input: SearchKnowledgeInput,
  context: SearchToolContext
): Promise<{
  success: boolean;
  message: string;
  results: Array<{ content: string; source: string; score: number }>;
  ui?: { component: string; props: Record<string, unknown>; layout?: 'inline' | 'full-width' };
}> {
  // Validate input
  const validated = searchKnowledgeSchema.parse(input);

  // Check if vector store and embeddings are available
  if (!deps.vectorStore || !deps.embeddings) {
    // Fallback to text search in facts
    const facts = await deps.db.fact.findMany({
      where: {
        company: {
          organizationId: context.organizationId,
        },
        OR: [
          { subject: { contains: validated.query, mode: 'insensitive' } },
          { object: { contains: validated.query, mode: 'insensitive' } },
          { sourceText: { contains: validated.query, mode: 'insensitive' } },
        ],
      },
      take: 10,
      include: {
        document: { select: { name: true } },
      },
    });

    const factResults = facts.map((f) => ({
      content: `${f.subject} ${f.predicate} ${f.object}`,
      source: f.document?.name || 'Unknown',
      score: f.confidence,
    }));

    return {
      success: true,
      message: `Found ${facts.length} fact(s) matching "${validated.query}"`,
      results: factResults,
      ui: factResults.length > 0
        ? {
            component: 'knowledge-results',
            props: { query: validated.query, results: factResults },
            layout: 'full-width',
          }
        : undefined,
    };
  }

  // Generate embedding for query
  const queryEmbedding = await deps.embeddings.generateEmbedding(validated.query);

  // Search vector store
  const searchResults = await deps.vectorStore.search(
    queryEmbedding,
    context.organizationId,
    {
      topK: 10,
      minScore: 0.5,
    }
  );

  const vectorResults = searchResults.map((r: VectorSearchResult) => ({
    content: r.content,
    source: r.metadata.documentName || 'Unknown',
    score: r.score,
  }));

  return {
    success: true,
    message: `Found ${searchResults.length} relevant document(s) for "${validated.query}"`,
    results: vectorResults,
    ui: vectorResults.length > 0
      ? {
          component: 'knowledge-results',
          props: { query: validated.query, results: vectorResults },
          layout: 'full-width',
        }
      : undefined,
  };
}

/**
 * Execute create_task tool
 * Note: Since there's no dedicated Task model, we create an Activity with task-like metadata
 */
export async function executeCreateTask(
  deps: SearchToolDeps,
  input: CreateTaskInput,
  context: SearchToolContext
): Promise<{ success: boolean; message: string; task?: Record<string, unknown> }> {
  // Validate input
  const validated = createTaskSchema.parse(input);

  // Verify deal if provided
  if (validated.dealId) {
    const deal = await deps.db.deal.findFirst({
      where: {
        id: validated.dealId,
        organizationId: context.organizationId,
      },
    });

    if (!deal) {
      return {
        success: false,
        message: `Deal not found: ${validated.dealId}`,
      };
    }
  }

  // Parse due date if provided
  const dueDate = validated.dueDate ? new Date(validated.dueDate) : null;

  // Create as an activity with task metadata
  const activity = await deps.db.activity.create({
    data: {
      type: 'USER_ACTION',
      description: validated.description,
      metadata: {
        isTask: true,
        dueDate: dueDate?.toISOString(),
        status: 'PENDING',
      },
      userId: context.userId,
      dealId: validated.dealId,
    },
  });

  return {
    success: true,
    message: `Task created: "${validated.description}"`,
    task: {
      id: activity.id,
      description: activity.description,
      dueDate: dueDate?.toISOString(),
      status: 'PENDING',
      dealId: activity.dealId,
    },
  };
}
