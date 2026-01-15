/**
 * Company Service
 *
 * Business logic for Company CRUD operations.
 * Enforces multi-tenancy via organizationId on all operations.
 *
 * [TASK-106] Company tRPC Router - Service layer
 */
import { TRPCError } from '@trpc/server';
import type { PrismaClient, Company, Prisma, CompanyStatus } from '@trato-hive/db';
import type { CompanyListInput, RouterCreateCompanyInput, CompanySearchInput } from '@trato-hive/shared';
import { DATABASE_TEMPLATES } from '@trato-hive/shared';

// Re-export input types for convenience
export type { CompanyListInput, CompanySearchInput } from '@trato-hive/shared';

export interface CompanyListResult {
  items: Company[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Deal history entry from DealCompany junction table
 * Used by DealHistoryBlock to display company's deal involvement
 */
export interface DealHistoryEntry {
  id: string;
  dealId: string;
  name: string;
  stage: string;
  value: number | null;
  currency: string;
  role: string;
  createdAt: Date;
}

export interface CompanyWithDeals extends Company {
  dealHistory: DealHistoryEntry[];
}

export interface CompanySearchResult {
  id: string;
  name: string;
  industry: string | null;
  location: string | null;
  employees: number | null;
}

/**
 * Related company with similarity information
 * Used by RelatedCompaniesBlock to display company relationships
 */
export interface RelatedCompanyResult {
  id: string;
  name: string;
  industry: string | null;
  sector: string | null;
  location: string | null;
  employees: number | null;
  revenue: number | null;
  /** Similarity score 0-100 based on shared attributes/facts */
  similarityScore: number;
  /** What makes this company related */
  relationshipTypes: string[];
}

export class CompanyService {
  constructor(private db: PrismaClient) {}

  /**
   * List companies with pagination and filtering
   * Multi-tenancy: Filters by organizationId
   *
   * Uses CompanyListInput from discovery.ts schema:
   * - filter.status: Company status filter
   * - filter.industry: Industry filter
   * - filter.hasDeals: Filter by whether company has deals
   */
  async list(input: CompanyListInput, organizationId: string): Promise<CompanyListResult> {
    const { page = 1, pageSize = 20, filter, sort } = input;
    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: Prisma.CompanyWhereInput = {
      organizationId, // Multi-tenancy enforcement
    };

    if (filter?.status) {
      where.status = filter.status as CompanyStatus;
    }
    if (filter?.industry) {
      where.industry = {
        contains: filter.industry,
        mode: 'insensitive',
      };
    }
    if (filter?.hasDeals !== undefined) {
      if (filter.hasDeals) {
        where.dealCompanies = { some: {} };
      } else {
        where.dealCompanies = { none: {} };
      }
    }

    // Build orderBy
    const orderBy: Prisma.CompanyOrderByWithRelationInput = {};
    if (sort?.field) {
      orderBy[sort.field as keyof Prisma.CompanyOrderByWithRelationInput] = sort.order || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    // Execute queries in parallel
    const [items, total] = await Promise.all([
      this.db.company.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
      }),
      this.db.company.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Get single company by ID
   * Multi-tenancy: Validates company belongs to organization
   */
  async getById(id: string, organizationId: string): Promise<Company> {
    const company = await this.db.company.findUnique({
      where: { id },
    });

    if (!company) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Company not found',
      });
    }

    // Multi-tenancy check
    if (company.organizationId !== organizationId) {
      throw new TRPCError({
        code: 'NOT_FOUND', // Don't reveal existence
        message: 'Company not found',
      });
    }

    return company;
  }

  /**
   * Get company with deal history (via DealCompany junction)
   * Used for Company Page Deal History section and DealHistoryBlock
   *
   * Returns deals from DealCompany junction with role information:
   * - PLATFORM: Company is the main platform in a platform deal
   * - ADD_ON: Company is an add-on acquisition target
   * - SELLER: Company is selling assets/equity
   * - BUYER: Company is the buyer in a transaction
   * - ADVISOR: Company is advising on the deal
   */
  async getWithDeals(id: string, organizationId: string): Promise<CompanyWithDeals> {
    const company = await this.getById(id, organizationId);

    const companyWithDealCompanies = await this.db.company.findUnique({
      where: { id },
      include: {
        dealCompanies: {
          include: {
            deal: {
              select: {
                id: true,
                name: true,
                stage: true,
                value: true,
                currency: true,
                createdAt: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Transform to DealHistoryEntry array
    const dealHistory: DealHistoryEntry[] = (companyWithDealCompanies?.dealCompanies || []).map(dc => ({
      id: dc.id,
      dealId: dc.deal.id,
      name: dc.deal.name,
      stage: dc.deal.stage,
      value: dc.deal.value ? Number(dc.deal.value) : null,
      currency: dc.deal.currency || 'USD',
      role: dc.role,
      createdAt: dc.deal.createdAt,
    }));

    return {
      ...company,
      dealHistory,
    };
  }

  /**
   * Get company with its associated Page (for editor view)
   * Returns null for page if no page exists yet
   */
  async getWithPage(id: string, organizationId: string) {
    const company = await this.getById(id, organizationId);

    // Get page associated with this company
    const page = await this.db.page.findFirst({
      where: {
        companyId: id,
        type: 'COMPANY_PAGE',
      },
      include: {
        blocks: {
          orderBy: [{ order: 'asc' }],
        },
      },
    });

    return {
      ...company,
      page,
    };
  }

  /**
   * Create new company with auto-generated Company Page
   * Multi-tenancy: Sets organizationId from context
   *
   * Creates the following page structure:
   * - Root Page (company name) with CompanyHeaderBlock
   * - Placeholder sections for Deal History, AI Insights, Key Contacts
   */
  async create(
    input: RouterCreateCompanyInput,
    organizationId: string,
    userId: string
  ): Promise<Company> {
    return this.db.$transaction(async (tx) => {
      // 1. Create the company
      const company = await tx.company.create({
        data: {
          name: input.name,
          domain: input.domain,
          description: input.description,
          industry: input.industry,
          sector: input.sector,
          founded: input.founded,
          employees: input.employees,
          revenue: input.revenue,
          location: input.location,
          website: input.website,
          linkedin: input.linkedin,
          status: (input.status as CompanyStatus) || 'PROSPECT',
          organizationId,
        },
      });

      // 2. Create a "shadow" deal to hold the company page
      // (Required because Page model requires dealId - this is a workaround)
      // NOTE: In a future migration, we should make dealId optional on Page
      // For now, we create a placeholder deal
      const placeholderDeal = await tx.deal.create({
        data: {
          name: `${company.name} - Company Profile`,
          type: 'OTHER',
          stage: 'SOURCING',
          organizationId,
          companyId: company.id,
        },
      });

      // 3. Create root company page
      const rootPage = await tx.page.create({
        data: {
          dealId: placeholderDeal.id,
          companyId: company.id,
          type: 'COMPANY_PAGE',
          title: company.name,
          icon: '🏢',
          order: 0,
        },
      });

      // 4. Create company header block
      await tx.block.create({
        data: {
          pageId: rootPage.id,
          type: 'company_header',
          order: 0,
          properties: {
            companyId: company.id,
            name: company.name,
            industry: company.industry,
            revenue: company.revenue,
            employees: company.employees,
            location: company.location,
            editable: true,
            showWatch: true,
          },
          createdBy: userId,
        },
      });

      // 5. Create Deal History block (TASK-104)
      await tx.block.create({
        data: {
          pageId: rootPage.id,
          type: 'deal_history',
          order: 1,
          properties: {
            companyId: company.id,
            title: 'Deal History',
            showEmpty: true,
            maxItems: 10,
          },
          createdBy: userId,
        },
      });

      // 6. Create Related Companies block (TASK-105)
      await tx.block.create({
        data: {
          pageId: rootPage.id,
          type: 'related_companies',
          order: 2,
          properties: {
            companyId: company.id,
            title: 'Related Companies',
            maxItems: 6,
            showEmpty: true,
          },
          createdBy: userId,
        },
      });

      // 7. Create AI Insights section placeholder
      await tx.block.create({
        data: {
          pageId: rootPage.id,
          type: 'heading',
          order: 3,
          properties: {
            text: 'AI Insights',
            level: 2,
          },
          createdBy: userId,
        },
      });

      await tx.block.create({
        data: {
          pageId: rootPage.id,
          type: 'paragraph',
          order: 4,
          properties: {
            text: 'AI-generated insights will appear here once documents are processed.',
          },
          createdBy: userId,
        },
      });

      // 8. Create Key Contacts Database page (sub-page of root)
      const contactsTemplate = DATABASE_TEMPLATES.find(t => t.id === 'contact-list');
      if (contactsTemplate) {
        // Create a page for the database
        const contactsPage = await tx.page.create({
          data: {
            dealId: placeholderDeal.id,
            companyId: company.id,
            parentPageId: rootPage.id,
            type: 'COMPANY_PAGE',
            title: 'Key Contacts',
            icon: '👥',
            isDatabase: true,
            order: 1,
          },
        });

        // Create the Database linked to the contacts page
        await tx.database.create({
          data: {
            name: `${company.name} - Contacts`,
            description: 'Key contacts for this company',
            schema: contactsTemplate.schema as unknown as Prisma.InputJsonValue,
            organizationId,
            dealId: placeholderDeal.id,
            pageId: contactsPage.id,
            createdById: userId,
          },
        });
      }

      return company;
    });
  }

  /**
   * Update existing company
   * Multi-tenancy: Validates ownership before update
   */
  async update(
    id: string,
    data: Partial<RouterCreateCompanyInput>,
    organizationId: string
  ): Promise<Company> {
    // First validate access
    await this.getById(id, organizationId);

    // Build update data
    const updateData: Prisma.CompanyUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.domain !== undefined) updateData.domain = data.domain;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.industry !== undefined) updateData.industry = data.industry;
    if (data.sector !== undefined) updateData.sector = data.sector;
    if (data.founded !== undefined) updateData.founded = data.founded;
    if (data.employees !== undefined) updateData.employees = data.employees;
    if (data.revenue !== undefined) updateData.revenue = data.revenue;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.linkedin !== undefined) updateData.linkedin = data.linkedin;
    if (data.status !== undefined) updateData.status = data.status as CompanyStatus;

    // Perform update
    return this.db.company.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Delete company
   * Multi-tenancy: Validates ownership before delete
   * Note: This is a hard delete - consider soft delete for production
   */
  async delete(id: string, organizationId: string): Promise<Company> {
    // First validate access
    await this.getById(id, organizationId);

    // Delete company (cascades to dealCompanies, watches, etc.)
    return this.db.company.delete({
      where: { id },
    });
  }

  /**
   * Search companies by name, industry, or location
   * Used by Command Palette and entity search
   *
   * Uses CompanySearchInput from discovery.ts schema:
   * - query: Search string
   * - filters: Optional filters (status, industry, minRevenue, maxRevenue, location)
   * - page, pageSize: Pagination
   */
  async search(
    input: CompanySearchInput,
    organizationId: string
  ): Promise<CompanySearchResult[]> {
    const { query, filters, pageSize = 12 } = input;

    // Build where clause with search across multiple fields
    const where: Prisma.CompanyWhereInput = {
      organizationId,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { industry: { contains: query, mode: 'insensitive' } },
        { sector: { contains: query, mode: 'insensitive' } },
        { location: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    };

    // Apply optional filters
    if (filters?.status) {
      where.status = filters.status as CompanyStatus;
    }
    if (filters?.industry) {
      where.industry = { contains: filters.industry, mode: 'insensitive' };
    }
    if (filters?.location) {
      where.location = { contains: filters.location, mode: 'insensitive' };
    }
    if (filters?.minRevenue !== undefined || filters?.maxRevenue !== undefined) {
      where.revenue = {};
      if (filters.minRevenue !== undefined) {
        where.revenue.gte = filters.minRevenue;
      }
      if (filters.maxRevenue !== undefined) {
        where.revenue.lte = filters.maxRevenue;
      }
    }

    const companies = await this.db.company.findMany({
      where,
      select: {
        id: true,
        name: true,
        industry: true,
        location: true,
        employees: true,
      },
      take: pageSize,
      orderBy: { name: 'asc' },
    });

    return companies;
  }

  /**
   * Get related companies based on shared attributes
   * [TASK-105] Related Companies Section
   *
   * Finds companies related by:
   * 1. Same industry (40 points)
   * 2. Same sector (30 points)
   * 3. Same location (20 points)
   * 4. Similar employee count (±50%) (10 points)
   *
   * Note: In production, this should also query Neo4j KnowledgeGraphService
   * for companies sharing facts. For now, using Prisma-based similarity.
   */
  async getRelatedCompanies(
    companyId: string,
    organizationId: string,
    limit: number = 6
  ): Promise<RelatedCompanyResult[]> {
    // First get the target company
    const company = await this.getById(companyId, organizationId);

    // Build OR conditions for related companies
    const orConditions: Prisma.CompanyWhereInput[] = [];

    if (company.industry) {
      orConditions.push({ industry: company.industry });
    }
    if (company.sector) {
      orConditions.push({ sector: company.sector });
    }
    if (company.location) {
      orConditions.push({ location: { contains: company.location.split(',')[0], mode: 'insensitive' } });
    }

    // If no attributes to match, return empty
    if (orConditions.length === 0) {
      return [];
    }

    // Find potentially related companies
    const relatedCompanies = await this.db.company.findMany({
      where: {
        organizationId,
        id: { not: companyId }, // Exclude self
        OR: orConditions,
      },
      select: {
        id: true,
        name: true,
        industry: true,
        sector: true,
        location: true,
        employees: true,
        revenue: true,
      },
      take: limit * 2, // Fetch more to filter/score
    });

    // Calculate similarity scores and relationship types
    const scoredCompanies: RelatedCompanyResult[] = relatedCompanies.map((related) => {
      let score = 0;
      const relationshipTypes: string[] = [];

      // Industry match (40 points)
      if (company.industry && related.industry === company.industry) {
        score += 40;
        relationshipTypes.push('Same Industry');
      }

      // Sector match (30 points)
      if (company.sector && related.sector === company.sector) {
        score += 30;
        relationshipTypes.push('Same Sector');
      }

      // Location match (20 points) - check city/region overlap
      if (company.location && related.location) {
        const companyCity = company.location.split(',')[0].trim().toLowerCase();
        const relatedCity = related.location.split(',')[0].trim().toLowerCase();
        if (companyCity === relatedCity) {
          score += 20;
          relationshipTypes.push('Same Location');
        }
      }

      // Similar employee count (10 points) - within 50%
      if (company.employees && related.employees) {
        const ratio = related.employees / company.employees;
        if (ratio >= 0.5 && ratio <= 1.5) {
          score += 10;
          relationshipTypes.push('Similar Size');
        }
      }

      return {
        id: related.id,
        name: related.name,
        industry: related.industry,
        sector: related.sector,
        location: related.location,
        employees: related.employees,
        revenue: related.revenue ? Number(related.revenue) : null,
        similarityScore: score,
        relationshipTypes,
      };
    });

    // Sort by score and take top results
    return scoredCompanies
      .filter((c) => c.similarityScore > 0)
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit);
  }
}
