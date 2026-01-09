/**
 * Sourcing Service
 *
 * Business logic for company search and discovery operations.
 * Enforces multi-tenancy via organizationId on all operations.
 */
import { TRPCError } from '@trpc/server'
import type { PrismaClient, Company, Prisma, CompanyStatus } from '@trato-hive/db'
import type { CompanySearchInput, CompanyListInput } from '@trato-hive/shared'

export interface CompanySearchResult {
  items: CompanyWithDealCount[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface CompanyWithDealCount extends Company {
  _count: { deals: number }
}

export interface CompanyWithFacts extends Company {
  facts: Array<{
    id: string
    type: string
    subject: string
    predicate: string
    object: string
    confidence: number
  }>
  _count: { deals: number }
}

export class SourcingService {
  constructor(private db: PrismaClient) {}

  /**
   * Search companies with text query
   * Multi-tenancy: Filters by organizationId
   *
   * Searches across: name, industry, description, sector, location (case-insensitive)
   */
  async search(
    input: CompanySearchInput,
    organizationId: string
  ): Promise<CompanySearchResult> {
    const { query, filters, page = 1, pageSize = 12 } = input
    const skip = (page - 1) * pageSize

    // Build where clause with text search across multiple fields
    const where: Prisma.CompanyWhereInput = {
      organizationId, // Multi-tenancy enforcement
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { industry: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { sector: { contains: query, mode: 'insensitive' } },
        { location: { contains: query, mode: 'insensitive' } },
      ],
    }

    // Apply optional filters
    if (filters?.status) {
      where.status = filters.status as CompanyStatus
    }
    if (filters?.industry) {
      // Override OR condition for industry if specific filter provided
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        { industry: { contains: filters.industry, mode: 'insensitive' } },
      ]
    }
    if (filters?.minRevenue !== undefined) {
      where.revenue = {
        ...(where.revenue as object),
        gte: filters.minRevenue,
      }
    }
    if (filters?.maxRevenue !== undefined) {
      where.revenue = {
        ...(where.revenue as object),
        lte: filters.maxRevenue,
      }
    }
    if (filters?.location) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        { location: { contains: filters.location, mode: 'insensitive' } },
      ]
    }

    // Execute queries in parallel
    const [items, total] = await Promise.all([
      this.db.company.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: pageSize,
        include: {
          _count: { select: { deals: true } },
        },
      }),
      this.db.company.count({ where }),
    ])

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  }

  /**
   * List companies with pagination and filtering
   * Multi-tenancy: Filters by organizationId
   */
  async list(
    input: CompanyListInput,
    organizationId: string
  ): Promise<CompanySearchResult> {
    const { page = 1, pageSize = 20, filter, sort } = input
    const skip = (page - 1) * pageSize

    // Build where clause
    const where: Prisma.CompanyWhereInput = {
      organizationId, // Multi-tenancy enforcement
    }

    if (filter?.status) {
      where.status = filter.status as CompanyStatus
    }
    if (filter?.industry) {
      where.industry = { contains: filter.industry, mode: 'insensitive' }
    }
    if (filter?.hasDeals === false) {
      // Exclude companies already linked to deals
      where.deals = { none: {} }
    }

    // Build orderBy
    const orderBy: Prisma.CompanyOrderByWithRelationInput = {}
    if (sort?.field) {
      orderBy[sort.field as keyof Prisma.CompanyOrderByWithRelationInput] =
        sort.order || 'desc'
    } else {
      orderBy.createdAt = 'desc'
    }

    // Execute queries in parallel
    const [items, total] = await Promise.all([
      this.db.company.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          _count: { select: { deals: true } },
        },
      }),
      this.db.company.count({ where }),
    ])

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  }

  /**
   * Get single company by ID with facts
   * Multi-tenancy: Validates company belongs to organization
   */
  async getById(id: string, organizationId: string): Promise<CompanyWithFacts> {
    const company = await this.db.company.findUnique({
      where: { id },
      include: {
        facts: {
          orderBy: { confidence: 'desc' },
          take: 10,
          select: {
            id: true,
            type: true,
            subject: true,
            predicate: true,
            object: true,
            confidence: true,
          },
        },
        _count: { select: { deals: true } },
      },
    })

    if (!company) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Company not found',
      })
    }

    // Multi-tenancy check - don't reveal existence to other orgs
    if (company.organizationId !== organizationId) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Company not found',
      })
    }

    return company
  }

  /**
   * Get distinct industries for filter dropdown
   */
  async getIndustries(organizationId: string): Promise<string[]> {
    const result = await this.db.company.findMany({
      where: {
        organizationId,
        industry: { not: null },
      },
      select: { industry: true },
      distinct: ['industry'],
      orderBy: { industry: 'asc' },
    })

    return result
      .map((r) => r.industry)
      .filter((i): i is string => i !== null)
  }
}
