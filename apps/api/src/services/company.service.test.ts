/**
 * CompanyService Unit Tests
 *
 * [TASK-106] Company tRPC Router - Service layer tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TRPCError } from '@trpc/server';
import { CompanyService } from './company.service';
import { createMockCompany, createMockPrisma, resetMocks, TEST_IDS } from '../tests/setup';
import type { CompanyStatus } from '@trato-hive/db';

describe('CompanyService', () => {
  let service: CompanyService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    resetMocks();
    mockPrisma = createMockPrisma();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    service = new CompanyService(mockPrisma as any);
  });

  describe('list', () => {
    it('should apply pagination correctly', async () => {
      mockPrisma.company.findMany.mockResolvedValue([]);
      mockPrisma.company.count.mockResolvedValue(25);

      const result = await service.list(
        { page: 2, pageSize: 10 },
        TEST_IDS.org
      );

      expect(mockPrisma.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10, // (2-1) * 10
          take: 10,
        })
      );
      expect(result.pagination.totalPages).toBe(3);
      expect(result.pagination.total).toBe(25);
    });

    it('should filter by organizationId (multi-tenancy)', async () => {
      mockPrisma.company.findMany.mockResolvedValue([]);
      mockPrisma.company.count.mockResolvedValue(0);

      await service.list({ page: 1, pageSize: 10 }, TEST_IDS.org);

      expect(mockPrisma.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: TEST_IDS.org,
          }),
        })
      );
    });

    it('should filter by status', async () => {
      mockPrisma.company.findMany.mockResolvedValue([]);
      mockPrisma.company.count.mockResolvedValue(0);

      await service.list(
        { page: 1, pageSize: 10, filter: { status: 'PROSPECT' } },
        TEST_IDS.org
      );

      expect(mockPrisma.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: TEST_IDS.org,
            status: 'PROSPECT',
          }),
        })
      );
    });

    it('should filter by industry', async () => {
      mockPrisma.company.findMany.mockResolvedValue([]);
      mockPrisma.company.count.mockResolvedValue(0);

      await service.list(
        { page: 1, pageSize: 10, filter: { industry: 'Technology' } },
        TEST_IDS.org
      );

      expect(mockPrisma.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            industry: { contains: 'Technology', mode: 'insensitive' },
          }),
        })
      );
    });

    it('should filter by hasDeals', async () => {
      mockPrisma.company.findMany.mockResolvedValue([]);
      mockPrisma.company.count.mockResolvedValue(0);

      await service.list(
        { page: 1, pageSize: 10, filter: { hasDeals: true } },
        TEST_IDS.org
      );

      expect(mockPrisma.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            dealCompanies: { some: {} },
          }),
        })
      );
    });

    it('should apply sorting', async () => {
      mockPrisma.company.findMany.mockResolvedValue([]);
      mockPrisma.company.count.mockResolvedValue(0);

      await service.list(
        { page: 1, pageSize: 10, sort: { field: 'name', order: 'asc' } },
        TEST_IDS.org
      );

      expect(mockPrisma.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        })
      );
    });
  });

  describe('getById', () => {
    it('should return company if belongs to organization', async () => {
      const mockCompany = createMockCompany();
      mockPrisma.company.findUnique.mockResolvedValue(mockCompany);

      const result = await service.getById(TEST_IDS.company, TEST_IDS.org);

      expect(result.id).toBe(TEST_IDS.company);
      expect(result.name).toBe('Test Company');
    });

    it('should throw NOT_FOUND for non-existent company', async () => {
      mockPrisma.company.findUnique.mockResolvedValue(null);

      await expect(service.getById(TEST_IDS.company, TEST_IDS.org)).rejects.toThrow(TRPCError);
      await expect(service.getById(TEST_IDS.company, TEST_IDS.org)).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('should throw NOT_FOUND for company in different organization (multi-tenancy)', async () => {
      mockPrisma.company.findUnique.mockResolvedValue(
        createMockCompany({ organizationId: 'clqdifferentorg123456789012' })
      );

      await expect(service.getById(TEST_IDS.company, TEST_IDS.org)).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });
  });

  describe('getWithDeals', () => {
    it('should return company with deal history', async () => {
      const mockCompany = createMockCompany();
      const mockCompanyWithDeals = {
        ...mockCompany,
        dealCompanies: [
          {
            id: 'clqdealcompany1234567890123',
            role: 'PLATFORM',
            deal: {
              id: TEST_IDS.deal,
              name: 'Test Deal',
              stage: 'SOURCING',
              value: null,
              createdAt: new Date(),
            },
          },
        ],
      };

      mockPrisma.company.findUnique
        .mockResolvedValueOnce(mockCompany) // First call in getById
        .mockResolvedValueOnce(mockCompanyWithDeals); // Second call for full data

      const result = await service.getWithDeals(TEST_IDS.company, TEST_IDS.org);

      // Service flattens dealCompanies into deals array with role property
      expect(result.deals).toHaveLength(1);
      expect((result.deals[0] as { role: string }).role).toBe('PLATFORM');
      expect(result.deals[0].name).toBe('Test Deal');
    });
  });

  describe('create', () => {
    it('should create company with organizationId from context', async () => {
      const mockCompany = createMockCompany();
      const mockDeal = {
        id: TEST_IDS.deal,
        name: 'Test Company - Company Profile',
        organizationId: TEST_IDS.org,
      };
      const mockPage = {
        id: TEST_IDS.page,
        companyId: TEST_IDS.company,
        title: 'Test Company',
      };
      const mockBlock = { id: TEST_IDS.block, pageId: TEST_IDS.page };

      // Mock transaction
      mockPrisma.$transaction.mockImplementation(async (fn) => {
        const tx = {
          company: { create: vi.fn().mockResolvedValue(mockCompany) },
          deal: { create: vi.fn().mockResolvedValue(mockDeal) },
          page: { create: vi.fn().mockResolvedValue(mockPage) },
          block: { create: vi.fn().mockResolvedValue(mockBlock) },
        };
        return fn(tx);
      });

      const result = await service.create(
        {
          name: 'Test Company',
          industry: 'Technology',
          status: 'PROSPECT' as CompanyStatus,
        },
        TEST_IDS.org,
        TEST_IDS.user
      );

      expect(result.id).toBe(TEST_IDS.company);
      expect(result.name).toBe('Test Company');
    });

    it('should create company page with CompanyHeaderBlock', async () => {
      const mockCompany = createMockCompany({ name: 'Acme Corp' });
      const mockDeal = { id: TEST_IDS.deal };
      const mockPage = { id: TEST_IDS.page };
      const mockBlock = { id: TEST_IDS.block };

      const companyCreate = vi.fn().mockResolvedValue(mockCompany);
      const dealCreate = vi.fn().mockResolvedValue(mockDeal);
      const pageCreate = vi.fn().mockResolvedValue(mockPage);
      const blockCreate = vi.fn().mockResolvedValue(mockBlock);

      mockPrisma.$transaction.mockImplementation(async (fn) => {
        const tx = {
          company: { create: companyCreate },
          deal: { create: dealCreate },
          page: { create: pageCreate },
          block: { create: blockCreate },
        };
        return fn(tx);
      });

      await service.create(
        {
          name: 'Acme Corp',
          industry: 'Technology',
          status: 'PROSPECT' as CompanyStatus,
        },
        TEST_IDS.org,
        TEST_IDS.user
      );

      // Verify company creation
      expect(companyCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Acme Corp',
          industry: 'Technology',
          organizationId: TEST_IDS.org,
        }),
      });

      // Verify page creation with COMPANY_PAGE type
      expect(pageCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'COMPANY_PAGE',
          companyId: TEST_IDS.company,
          title: 'Acme Corp',
          icon: '🏢',
        }),
      });

      // Verify CompanyHeaderBlock creation
      expect(blockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'company_header',
          order: 0,
          properties: expect.objectContaining({
            companyId: TEST_IDS.company,
            name: 'Acme Corp',
          }),
        }),
      });
    });
  });

  describe('update', () => {
    it('should update company if belongs to organization', async () => {
      const existingCompany = createMockCompany();
      const updatedCompany = createMockCompany({ name: 'Updated Company', industry: 'Healthcare' });

      mockPrisma.company.findUnique.mockResolvedValue(existingCompany);
      mockPrisma.company.update.mockResolvedValue(updatedCompany);

      const result = await service.update(
        TEST_IDS.company,
        { name: 'Updated Company', industry: 'Healthcare' },
        TEST_IDS.org
      );

      expect(result.name).toBe('Updated Company');
      expect(result.industry).toBe('Healthcare');
      expect(mockPrisma.company.update).toHaveBeenCalledWith({
        where: { id: TEST_IDS.company },
        data: expect.objectContaining({
          name: 'Updated Company',
          industry: 'Healthcare',
        }),
      });
    });

    it('should throw NOT_FOUND for company in different organization', async () => {
      mockPrisma.company.findUnique.mockResolvedValue(
        createMockCompany({ organizationId: 'clqdifferentorg123456789012' })
      );

      await expect(
        service.update(TEST_IDS.company, { name: 'Updated' }, TEST_IDS.org)
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });
  });

  describe('delete', () => {
    it('should delete company if belongs to organization', async () => {
      const mockCompany = createMockCompany();
      mockPrisma.company.findUnique.mockResolvedValue(mockCompany);
      mockPrisma.company.delete.mockResolvedValue(mockCompany);

      const result = await service.delete(TEST_IDS.company, TEST_IDS.org);

      expect(result.id).toBe(TEST_IDS.company);
      expect(mockPrisma.company.delete).toHaveBeenCalledWith({
        where: { id: TEST_IDS.company },
      });
    });

    it('should throw NOT_FOUND for company in different organization', async () => {
      mockPrisma.company.findUnique.mockResolvedValue(
        createMockCompany({ organizationId: 'clqdifferentorg123456789012' })
      );

      await expect(
        service.delete(TEST_IDS.company, TEST_IDS.org)
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });
  });

  describe('search', () => {
    it('should search companies by query', async () => {
      const mockCompanies = [
        { id: TEST_IDS.company, name: 'Acme Corp', industry: 'Technology', location: 'SF', employees: 50 },
      ];
      mockPrisma.company.findMany.mockResolvedValue(mockCompanies);

      const result = await service.search(
        { query: 'Acme', page: 1, pageSize: 12 },
        TEST_IDS.org
      );

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Acme Corp');
      expect(mockPrisma.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: TEST_IDS.org,
            OR: expect.arrayContaining([
              { name: { contains: 'Acme', mode: 'insensitive' } },
            ]),
          }),
          take: 12,
        })
      );
    });

    it('should respect pageSize parameter', async () => {
      mockPrisma.company.findMany.mockResolvedValue([]);

      await service.search({ query: 'test', page: 1, pageSize: 5 }, TEST_IDS.org);

      expect(mockPrisma.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        })
      );
    });

    it('should apply filters', async () => {
      mockPrisma.company.findMany.mockResolvedValue([]);

      await service.search(
        {
          query: 'test',
          page: 1,
          pageSize: 10,
          filters: { status: 'PROSPECT', industry: 'Tech', minRevenue: 1000000 },
        },
        TEST_IDS.org
      );

      expect(mockPrisma.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PROSPECT',
            industry: { contains: 'Tech', mode: 'insensitive' },
            revenue: { gte: 1000000 },
          }),
        })
      );
    });
  });
});
