/**
 * Custom Agent Service
 *
 * Business logic for custom AI agent operations.
 * Handles CRUD, search, and execution of user-defined agents.
 *
 * [TASK-128] Custom Agents Database + File Attachments
 */
import { TRPCError } from '@trpc/server'
import type { PrismaClient, AgentOutputFormat as PrismaAgentOutputFormat } from '@trato-hive/db'
import type {
  CreateAgentInput,
  UpdateAgentInput,
  ListAgentsInput,
  SearchAgentsInput,
  ExecuteAgentInput,
  AgentExecutionResult,
  AgentOutputFormat,
} from '@trato-hive/shared'

// Helper to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)
}

// Creator include for relation
const CREATOR_INCLUDE = {
  creator: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} as const

export interface CustomAgentWithCreator {
  id: string
  organizationId: string
  name: string
  slug: string
  description: string | null
  promptTemplate: string
  outputFormat: PrismaAgentOutputFormat
  icon: string | null
  color: string | null
  tags: string[]
  isActive: boolean
  isSystem: boolean
  callCount: number
  lastCalledAt: Date | null
  createdById: string
  createdAt: Date
  updatedAt: Date
  creator: {
    id: string
    name: string | null
    email: string
  }
}

export interface AgentListResult {
  items: CustomAgentWithCreator[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export class AgentService {
  constructor(private db: PrismaClient) {}

  /**
   * Create a new custom agent
   * Multi-tenancy: Sets organizationId from context
   */
  async create(
    input: CreateAgentInput,
    userId: string,
    organizationId: string
  ): Promise<CustomAgentWithCreator> {
    // Generate unique slug
    let baseSlug = generateSlug(input.name)
    let slug = baseSlug
    let counter = 0

    // Check for slug uniqueness
    while (true) {
      const existing = await this.db.customAgent.findUnique({
        where: {
          organizationId_slug: {
            organizationId,
            slug,
          },
        },
      })

      if (!existing) break

      counter++
      slug = `${baseSlug}-${counter}`
    }

    const agent = await this.db.customAgent.create({
      data: {
        organizationId,
        createdById: userId,
        name: input.name,
        slug,
        description: input.description ?? null,
        promptTemplate: input.promptTemplate,
        outputFormat: input.outputFormat as PrismaAgentOutputFormat,
        icon: input.icon ?? null,
        color: input.color ?? null,
        tags: input.tags ?? [],
      },
      include: CREATOR_INCLUDE,
    })

    return agent as CustomAgentWithCreator
  }

  /**
   * Get a single agent by ID
   * Multi-tenancy: Validates agent belongs to organization
   */
  async getById(
    id: string,
    organizationId: string
  ): Promise<CustomAgentWithCreator> {
    const agent = await this.db.customAgent.findUnique({
      where: { id },
      include: CREATOR_INCLUDE,
    })

    if (!agent || agent.organizationId !== organizationId) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Agent not found',
      })
    }

    return agent as CustomAgentWithCreator
  }

  /**
   * Get agent by slug (for slash command lookup)
   */
  async getBySlug(
    slug: string,
    organizationId: string
  ): Promise<CustomAgentWithCreator | null> {
    const agent = await this.db.customAgent.findUnique({
      where: {
        organizationId_slug: {
          organizationId,
          slug,
        },
      },
      include: CREATOR_INCLUDE,
    })

    return agent as CustomAgentWithCreator | null
  }

  /**
   * Update an existing agent
   * Multi-tenancy: Validates agent belongs to organization
   * System agents: Cannot modify system agents (except isActive)
   */
  async update(
    input: UpdateAgentInput,
    organizationId: string
  ): Promise<CustomAgentWithCreator> {
    const existing = await this.getById(input.id, organizationId)

    // System agents can only have isActive toggled
    if (existing.isSystem) {
      if (Object.keys(input).some(k => k !== 'id' && k !== 'isActive')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'System agents cannot be modified',
        })
      }
    }

    // Generate new slug if name changed
    let slug = existing.slug
    if (input.name && input.name !== existing.name) {
      let baseSlug = generateSlug(input.name)
      slug = baseSlug
      let counter = 0

      while (true) {
        const conflict = await this.db.customAgent.findFirst({
          where: {
            organizationId,
            slug,
            id: { not: input.id },
          },
        })

        if (!conflict) break

        counter++
        slug = `${baseSlug}-${counter}`
      }
    }

    const agent = await this.db.customAgent.update({
      where: { id: input.id },
      data: {
        ...(input.name && { name: input.name, slug }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.promptTemplate && { promptTemplate: input.promptTemplate }),
        ...(input.outputFormat && { outputFormat: input.outputFormat as PrismaAgentOutputFormat }),
        ...(input.icon !== undefined && { icon: input.icon }),
        ...(input.color !== undefined && { color: input.color }),
        ...(input.tags && { tags: input.tags }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
      include: CREATOR_INCLUDE,
    })

    return agent as CustomAgentWithCreator
  }

  /**
   * Delete an agent
   * System agents: Cannot be deleted
   */
  async delete(
    id: string,
    organizationId: string
  ): Promise<void> {
    const agent = await this.getById(id, organizationId)

    if (agent.isSystem) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'System agents cannot be deleted',
      })
    }

    await this.db.customAgent.delete({
      where: { id },
    })
  }

  /**
   * List agents with filtering and pagination
   * Multi-tenancy: Filters by organizationId
   */
  async list(
    input: ListAgentsInput,
    organizationId: string
  ): Promise<AgentListResult> {
    const { page = 1, pageSize = 20, activeOnly, search, tags } = input
    const skip = (page - 1) * pageSize

    const where = {
      organizationId,
      ...(activeOnly && { isActive: true }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
          { slug: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(tags?.length && { tags: { hasSome: tags } }),
    }

    const [items, total] = await Promise.all([
      this.db.customAgent.findMany({
        where,
        orderBy: [
          { isSystem: 'desc' }, // System agents first
          { callCount: 'desc' }, // Then by usage
          { name: 'asc' },
        ],
        skip,
        take: pageSize,
        include: CREATOR_INCLUDE,
      }),
      this.db.customAgent.count({ where }),
    ])

    return {
      items: items as CustomAgentWithCreator[],
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  }

  /**
   * Search agents for slash command autocomplete
   * Returns active agents matching query
   */
  async search(
    input: SearchAgentsInput,
    organizationId: string
  ): Promise<CustomAgentWithCreator[]> {
    const { query, limit = 10 } = input

    const agents = await this.db.customAgent.findMany({
      where: {
        organizationId,
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { slug: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { tags: { hasSome: [query.toLowerCase()] } },
        ],
      },
      orderBy: [
        { isSystem: 'desc' },
        { callCount: 'desc' },
      ],
      take: limit,
      include: CREATOR_INCLUDE,
    })

    return agents as CustomAgentWithCreator[]
  }

  /**
   * Increment call count and update lastCalledAt
   * Called after successful agent execution
   */
  async trackExecution(id: string): Promise<void> {
    await this.db.customAgent.update({
      where: { id },
      data: {
        callCount: { increment: 1 },
        lastCalledAt: new Date(),
      },
    })
  }

  /**
   * Get context for agent execution
   * Fetches deal, company, and document information for template interpolation
   */
  async getExecutionContext(
    context: ExecuteAgentInput['context'],
    documentIds: string[] | undefined,
    organizationId: string
  ): Promise<AgentContext> {
    const result: AgentContext = {
      deal: null,
      company: null,
      documents: [],
    }

    if (context?.dealId) {
      const deal = await this.db.deal.findFirst({
        where: {
          id: context.dealId,
          organizationId,
        },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              industry: true,
            },
          },
        },
      })
      if (deal) {
        result.deal = {
          id: deal.id,
          name: deal.name,
          stage: deal.stage,
          value: deal.value?.toString() ?? null,
          currency: deal.currency,
          industry: deal.company?.industry ?? null,
        }
        if (deal.company) {
          result.company = {
            id: deal.company.id,
            name: deal.company.name,
            industry: deal.company.industry ?? null,
          }
        }
      }
    }

    if (context?.companyId && !result.company) {
      const company = await this.db.company.findFirst({
        where: {
          id: context.companyId,
          organizationId,
        },
      })
      if (company) {
        result.company = {
          id: company.id,
          name: company.name,
          industry: company.industry ?? null,
        }
      }
    }

    if (documentIds?.length) {
      const documents = await this.db.document.findMany({
        where: {
          id: { in: documentIds },
          organizationId,
        },
        select: {
          id: true,
          name: true,
          fileUrl: true,
          mimeType: true,
        },
      })
      result.documents = documents.map(d => ({
        id: d.id,
        name: d.name,
        url: d.fileUrl,
        contentType: d.mimeType,
      }))
    }

    return result
  }
}

export interface AgentContext {
  deal: {
    id: string
    name: string
    stage: string
    value: string | null
    currency: string
    industry: string | null
  } | null
  company: {
    id: string
    name: string
    industry: string | null
  } | null
  documents: {
    id: string
    name: string
    url: string
    contentType: string
  }[]
}
