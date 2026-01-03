/**
 * DealService Unit Tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TRPCError } from '@trpc/server';
import { DealService } from './deals.service';
import { createMockDeal, createMockPrisma, resetMocks, TEST_IDS } from '../tests/setup';
import type { DealStage, DealType } from '@trato-hive/db';

describe('DealService', () => {
  let service: DealService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    resetMocks();
    mockPrisma = createMockPrisma();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    service = new DealService(mockPrisma as any);
  });

  describe('list', () => {
    it('should apply pagination correctly', async () => {
      mockPrisma.deal.findMany.mockResolvedValue([]);
      mockPrisma.deal.count.mockResolvedValue(25);

      const result = await service.list(
        { page: 2, pageSize: 10 },
        TEST_IDS.org
      );

      expect(mockPrisma.deal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10, // (2-1) * 10
          take: 10,
        })
      );
      expect(result.pagination.totalPages).toBe(3);
      expect(result.pagination.total).toBe(25);
    });

    it('should filter by organizationId (multi-tenancy)', async () => {
      mockPrisma.deal.findMany.mockResolvedValue([]);
      mockPrisma.deal.count.mockResolvedValue(0);

      await service.list({ page: 1, pageSize: 10 }, TEST_IDS.org);

      expect(mockPrisma.deal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: TEST_IDS.org,
          }),
        })
      );
    });

    it('should filter by stage', async () => {
      mockPrisma.deal.findMany.mockResolvedValue([]);
      mockPrisma.deal.count.mockResolvedValue(0);

      await service.list(
        { page: 1, pageSize: 10, filter: { stage: 'SOURCING' } },
        TEST_IDS.org
      );

      expect(mockPrisma.deal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: TEST_IDS.org,
            stage: 'SOURCING',
          }),
        })
      );
    });

    it('should apply search filter', async () => {
      mockPrisma.deal.findMany.mockResolvedValue([]);
      mockPrisma.deal.count.mockResolvedValue(0);

      await service.list(
        { page: 1, pageSize: 10, filter: { search: 'Acme' } },
        TEST_IDS.org
      );

      expect(mockPrisma.deal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: 'Acme', mode: 'insensitive' },
          }),
        })
      );
    });

    it('should apply sorting', async () => {
      mockPrisma.deal.findMany.mockResolvedValue([]);
      mockPrisma.deal.count.mockResolvedValue(0);

      await service.list(
        { page: 1, pageSize: 10, sort: { field: 'value', order: 'asc' } },
        TEST_IDS.org
      );

      expect(mockPrisma.deal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { value: 'asc' },
        })
      );
    });
  });

  describe('getById', () => {
    it('should return deal if belongs to organization', async () => {
      const mockDeal = createMockDeal();
      mockPrisma.deal.findUnique.mockResolvedValue(mockDeal);

      const result = await service.getById(TEST_IDS.deal, TEST_IDS.org);

      expect(result.id).toBe(TEST_IDS.deal);
    });

    it('should throw NOT_FOUND for non-existent deal', async () => {
      mockPrisma.deal.findUnique.mockResolvedValue(null);

      await expect(service.getById(TEST_IDS.deal, TEST_IDS.org)).rejects.toThrow(TRPCError);
      await expect(service.getById(TEST_IDS.deal, TEST_IDS.org)).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('should throw NOT_FOUND for deal in different organization', async () => {
      mockPrisma.deal.findUnique.mockResolvedValue(
        createMockDeal({ organizationId: 'clqdifferentorg123456789012' })
      );

      await expect(service.getById(TEST_IDS.deal, TEST_IDS.org)).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });
  });

  describe('create', () => {
    it('should create deal with organizationId from context', async () => {
      const mockDeal = createMockDeal();
      const mockPage = { id: TEST_IDS.page, dealId: TEST_IDS.deal, title: 'Test Deal' };
      const mockBlock = { id: TEST_IDS.block, pageId: TEST_IDS.page };

      // Mock transaction
      mockPrisma.$transaction.mockImplementation(async (fn) => {
        const tx = {
          deal: { create: vi.fn().mockResolvedValue(mockDeal) },
          page: { create: vi.fn().mockResolvedValue(mockPage) },
          block: { create: vi.fn().mockResolvedValue(mockBlock) },
        };
        return fn(tx);
      });

      const result = await service.create(
        {
          name: 'New Deal',
          type: 'ACQUISITION' as DealType,
          stage: 'SOURCING' as DealStage,
          currency: 'USD',
        },
        TEST_IDS.org,
        TEST_IDS.user
      );

      expect(result.id).toBe(TEST_IDS.deal);
    });
  });

  describe('update', () => {
    it('should update deal if belongs to organization', async () => {
      const existingDeal = createMockDeal();
      const updatedDeal = createMockDeal({ name: 'Updated Deal' });

      mockPrisma.deal.findUnique.mockResolvedValue(existingDeal);
      mockPrisma.deal.update.mockResolvedValue(updatedDeal);

      const result = await service.update(
        TEST_IDS.deal,
        { name: 'Updated Deal' },
        TEST_IDS.org
      );

      expect(result.name).toBe('Updated Deal');
      expect(mockPrisma.deal.update).toHaveBeenCalledWith({
        where: { id: TEST_IDS.deal },
        data: expect.objectContaining({ name: 'Updated Deal' }),
      });
    });

    it('should throw NOT_FOUND for deal in different organization', async () => {
      mockPrisma.deal.findUnique.mockResolvedValue(
        createMockDeal({ organizationId: 'clqdifferentorg123456789012' })
      );

      await expect(
        service.update(TEST_IDS.deal, { name: 'Updated' }, TEST_IDS.org)
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });
  });

  describe('getFactSheet', () => {
    it('should return facts for deal with company', async () => {
      const mockDeal = createMockDeal({ companyId: TEST_IDS.company });
      const mockFacts = [
        {
          id: TEST_IDS.fact,
          type: 'FINANCIAL_METRIC',
          subject: 'Revenue',
          predicate: 'is',
          object: '$10M',
          confidence: 0.95,
          sourceText: 'Annual revenue of $10M',
          document: { id: TEST_IDS.doc, name: 'Financial Statement' },
        },
      ];
      const mockCompany = { id: TEST_IDS.company, name: 'Acme Corp', aiSummary: null };

      mockPrisma.deal.findUnique.mockResolvedValue(mockDeal);
      mockPrisma.fact.findMany.mockResolvedValue(mockFacts);
      mockPrisma.company.findUnique.mockResolvedValue(mockCompany);

      const result = await service.getFactSheet(TEST_IDS.deal, TEST_IDS.org);

      expect(result.dealId).toBe(TEST_IDS.deal);
      expect(result.facts).toHaveLength(1);
      expect(result.facts[0].subject).toBe('Revenue');
      expect(result.company?.name).toBe('Acme Corp');
    });

    it('should return empty facts for deal without company', async () => {
      const mockDeal = createMockDeal({ companyId: null });
      mockPrisma.deal.findUnique.mockResolvedValue(mockDeal);

      const result = await service.getFactSheet(TEST_IDS.deal, TEST_IDS.org);

      expect(result.facts).toHaveLength(0);
      expect(result.company).toBeNull();
      expect(mockPrisma.fact.findMany).not.toHaveBeenCalled();
    });
  });
});
