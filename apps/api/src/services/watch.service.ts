/**
 * Watch Service
 * Business logic for CompanyWatch CRUD operations.
 * [TASK-109]
 */
import { TRPCError } from '@trpc/server';
import type { PrismaClient, CompanyWatch, Prisma } from '@trato-hive/db';
import type {
  WatchAddInput,
  WatchUpdateInput,
  WatchListInput,
} from '@trato-hive/shared';

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

  private watchKey(companyId: string, userId: string) {
    return { companyId_userId: { companyId, userId } };
  }

  private async validateCompanyAccess(
    companyId: string,
    organizationId: string
  ): Promise<void> {
    const company = await this.db.company.findUnique({
      where: { id: companyId },
      select: { organizationId: true },
    });

    if (!company || company.organizationId !== organizationId) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Company not found' });
    }
  }

  private async getWatch(
    companyId: string,
    userId: string
  ): Promise<CompanyWatch | null> {
    return this.db.companyWatch.findUnique({
      where: this.watchKey(companyId, userId),
    });
  }

  private async requireWatch(
    companyId: string,
    userId: string
  ): Promise<CompanyWatch> {
    const watch = await this.getWatch(companyId, userId);
    if (!watch) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Company is not in watch list',
      });
    }
    return watch;
  }

  async add(
    input: WatchAddInput,
    userId: string,
    organizationId: string
  ): Promise<CompanyWatch> {
    await this.validateCompanyAccess(input.companyId, organizationId);

    const existing = await this.getWatch(input.companyId, userId);
    if (existing) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Company is already in watch list',
      });
    }

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

  async remove(
    companyId: string,
    userId: string,
    organizationId: string
  ): Promise<CompanyWatch> {
    await this.validateCompanyAccess(companyId, organizationId);
    await this.requireWatch(companyId, userId);

    return this.db.companyWatch.delete({
      where: this.watchKey(companyId, userId),
    });
  }

  async update(
    input: WatchUpdateInput,
    userId: string,
    organizationId: string
  ): Promise<CompanyWatch> {
    await this.validateCompanyAccess(input.companyId, organizationId);
    await this.requireWatch(input.companyId, userId);

    const updateData: Prisma.CompanyWatchUpdateInput = {};
    if (input.notes !== undefined) updateData.notes = input.notes;
    if (input.tags !== undefined) updateData.tags = input.tags;
    if (input.priority !== undefined) updateData.priority = input.priority;

    return this.db.companyWatch.update({
      where: this.watchKey(input.companyId, userId),
      data: updateData,
    });
  }

  async list(
    input: WatchListInput,
    userId: string,
    organizationId: string
  ): Promise<WatchListResult> {
    const { page = 1, pageSize = 20, filter, sort } = input;
    const skip = (page - 1) * pageSize;

    const where: Prisma.CompanyWatchWhereInput = {
      userId,
      company: { organizationId },
      ...(filter?.priority !== undefined && { priority: filter.priority }),
      ...(filter?.tags?.length && { tags: { hasSome: filter.tags } }),
    };

    const sortField = sort?.field || 'createdAt';
    const sortOrder = sort?.order || 'desc';

    const orderBy: Prisma.CompanyWatchOrderByWithRelationInput =
      sortField === 'companyName'
        ? { company: { name: sortOrder } }
        : { [sortField]: sortOrder };

    const companySelect = {
      id: true,
      name: true,
      industry: true,
      sector: true,
      location: true,
      employees: true,
      revenue: true,
      status: true,
    };

    const [items, total] = await Promise.all([
      this.db.companyWatch.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: { company: { select: companySelect } },
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

  async isWatched(
    companyId: string,
    userId: string,
    organizationId: string
  ): Promise<{ isWatched: boolean; watch: CompanyWatch | null }> {
    await this.validateCompanyAccess(companyId, organizationId);
    const watch = await this.getWatch(companyId, userId);
    return { isWatched: !!watch, watch };
  }
}
