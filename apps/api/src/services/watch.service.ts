/**
 * Watch Service
 *
 * Business logic for CompanyWatch CRUD operations.
 * Enforces multi-tenancy via organizationId on all operations.
 *
 * [TASK-109] Watch tRPC Procedures - Service layer
 */
import { TRPCError } from '@trpc/server';
import type { PrismaClient, CompanyWatch, Prisma } from '@trato-hive/db';
import type {
  WatchAddInput,
  WatchUpdateInput,
  WatchListInput,
} from '@trato-hive/shared';

/**
 * Watch entry with company details
 */
export interface WatchWithCompany extends CompanyWatch {
  company: {
    id: string;
    name: string;
    industry: string | null;
    sector: string | null;
    location: string | null;
    employees: number | null;
    revenue: number | null;
    status: string;
  };
}

/**
 * Paginated watch list result
 */
export interface WatchListResult {
  items: WatchWithCompany[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export class WatchService {
  constructor(private db: PrismaClient) {}

  /**
   * Validate company belongs to user's organization
   * Multi-tenancy enforcement
   */
  private async validateCompanyAccess(
    companyId: string,
    organizationId: string
  ): Promise<void> {
    const company = await this.db.company.findUnique({
      where: { id: companyId },
      select: { organizationId: true },
    });

    if (!company || company.organizationId !== organizationId) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Company not found',
      });
    }
  }

  /**
   * Add company to watch list
   * Creates a new CompanyWatch entry for the user
   */
  async add(
    input: WatchAddInput,
    userId: string,
    organizationId: string
  ): Promise<CompanyWatch> {
    // Validate company access
    await this.validateCompanyAccess(input.companyId, organizationId);

    // Check if already watching
    const existing = await this.db.companyWatch.findUnique({
      where: {
        companyId_userId: {
          companyId: input.companyId,
          userId,
        },
      },
    });

    if (existing) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Company is already in watch list',
      });
    }

    // Create watch entry
    return this.db.companyWatch.create({
      data: {
        companyId: input.companyId,
        userId,
        notes: input.notes,
        tags: input.tags || [],
        priority: input.priority ?? 0,
      },
    });
  }

  /**
   * Remove company from watch list
   */
  async remove(
    companyId: string,
    userId: string,
    organizationId: string
  ): Promise<CompanyWatch> {
    // Validate company access
    await this.validateCompanyAccess(companyId, organizationId);

    // Find existing watch
    const existing = await this.db.companyWatch.findUnique({
      where: {
        companyId_userId: {
          companyId,
          userId,
        },
      },
    });

    if (!existing) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Company is not in watch list',
      });
    }

    // Delete watch entry
    return this.db.companyWatch.delete({
      where: {
        companyId_userId: {
          companyId,
          userId,
        },
      },
    });
  }

  /**
   * Update watch entry (notes, tags, priority)
   */
  async update(
    input: WatchUpdateInput,
    userId: string,
    organizationId: string
  ): Promise<CompanyWatch> {
    // Validate company access
    await this.validateCompanyAccess(input.companyId, organizationId);

    // Find existing watch
    const existing = await this.db.companyWatch.findUnique({
      where: {
        companyId_userId: {
          companyId: input.companyId,
          userId,
        },
      },
    });

    if (!existing) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Company is not in watch list',
      });
    }

    // Build update data
    const updateData: Prisma.CompanyWatchUpdateInput = {};
    if (input.notes !== undefined) updateData.notes = input.notes;
    if (input.tags !== undefined) updateData.tags = input.tags;
    if (input.priority !== undefined) updateData.priority = input.priority;

    // Update watch entry
    return this.db.companyWatch.update({
      where: {
        companyId_userId: {
          companyId: input.companyId,
          userId,
        },
      },
      data: updateData,
    });
  }

  /**
   * List watched companies with pagination and filters
   */
  async list(
    input: WatchListInput,
    userId: string,
    organizationId: string
  ): Promise<WatchListResult> {
    const { page = 1, pageSize = 20, filter, sort } = input;
    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: Prisma.CompanyWatchWhereInput = {
      userId,
      company: {
        organizationId, // Multi-tenancy enforcement
      },
    };

    if (filter?.priority !== undefined) {
      where.priority = filter.priority;
    }

    if (filter?.tags && filter.tags.length > 0) {
      where.tags = {
        hasSome: filter.tags,
      };
    }

    // Build orderBy
    let orderBy: Prisma.CompanyWatchOrderByWithRelationInput;
    const sortField = sort?.field || 'createdAt';
    const sortOrder = sort?.order || 'desc';

    if (sortField === 'companyName') {
      orderBy = { company: { name: sortOrder } };
    } else if (sortField === 'priority') {
      orderBy = { priority: sortOrder };
    } else {
      orderBy = { createdAt: sortOrder };
    }

    // Execute queries in parallel
    const [items, total] = await Promise.all([
      this.db.companyWatch.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          company: {
            select: {
              id: true,
              name: true,
              industry: true,
              sector: true,
              location: true,
              employees: true,
              revenue: true,
              status: true,
            },
          },
        },
      }),
      this.db.companyWatch.count({ where }),
    ]);

    return {
      items: items as WatchWithCompany[],
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Check if a specific company is watched by the user
   */
  async isWatched(
    companyId: string,
    userId: string,
    organizationId: string
  ): Promise<{ isWatched: boolean; watch: CompanyWatch | null }> {
    // Validate company access
    await this.validateCompanyAccess(companyId, organizationId);

    const watch = await this.db.companyWatch.findUnique({
      where: {
        companyId_userId: {
          companyId,
          userId,
        },
      },
    });

    return {
      isWatched: !!watch,
      watch,
    };
  }
}
