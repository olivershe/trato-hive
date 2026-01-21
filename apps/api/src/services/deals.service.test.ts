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
      const mockDatabase = { id: 'clqddtracker12345678901234', name: 'Test Deal - Due Diligence Tracker' };
      const mockDealsDb = { id: TEST_IDS.database, name: 'Deals', isOrgLevel: true, pageId: TEST_IDS.page };
      const mockEntry = { id: TEST_IDS.entry, databaseId: TEST_IDS.database };

      // Mock transaction
      mockPrisma.$transaction.mockImplementation(async (fn) => {
        const tx = {
          deal: { create: vi.fn().mockResolvedValue(mockDeal) },
          page: { create: vi.fn().mockResolvedValue(mockPage), createMany: vi.fn().mockResolvedValue({ count: 3 }) },
          block: { create: vi.fn().mockResolvedValue(mockBlock), createMany: vi.fn().mockResolvedValue({ count: 4 }) },
          database: { create: vi.fn().mockResolvedValue(mockDatabase), findFirst: vi.fn().mockResolvedValue(mockDealsDb) },
          databaseEntry: { create: vi.fn().mockResolvedValue(mockEntry) },
        };
        return fn(tx);
      });

      const result = await service.create(
        {
          name: 'New Deal',
          type: 'ACQUISITION' as DealType,
          stage: 'SOURCING' as DealStage,
          currency: 'USD',
          priority: 'NONE',
        },
        TEST_IDS.org,
        TEST_IDS.user
      );

      expect(result.id).toBe(TEST_IDS.deal);
    });

    it('should create DD Tracker database and DatabaseViewBlock', async () => {
      const mockDeal = createMockDeal({ name: 'Acme Acquisition' });
      const mockPage = { id: TEST_IDS.page, dealId: TEST_IDS.deal, title: 'Acme Acquisition' };
      const mockBlock = { id: TEST_IDS.block, pageId: TEST_IDS.page };
      const mockDatabase = { id: 'clqddtracker12345678901234', name: 'Acme Acquisition - Due Diligence Tracker' };
      const mockDealsDb = { id: TEST_IDS.database, name: 'Deals', isOrgLevel: true, pageId: TEST_IDS.page };
      const mockEntry = { id: TEST_IDS.entry, databaseId: TEST_IDS.database };

      const dealCreate = vi.fn().mockResolvedValue(mockDeal);
      const pageCreate = vi.fn().mockResolvedValue(mockPage);
      const blockCreate = vi.fn().mockResolvedValue(mockBlock);
      const databaseCreate = vi.fn().mockResolvedValue(mockDatabase);
      const entryCreate = vi.fn().mockResolvedValue(mockEntry);

      mockPrisma.$transaction.mockImplementation(async (fn) => {
        const tx = {
          deal: { create: dealCreate },
          page: { create: pageCreate, createMany: vi.fn().mockResolvedValue({ count: 3 }) },
          block: { create: blockCreate, createMany: vi.fn().mockResolvedValue({ count: 4 }) },
          database: { create: databaseCreate, findFirst: vi.fn().mockResolvedValue(mockDealsDb) },
          databaseEntry: { create: entryCreate },
        };
        return fn(tx);
      });

      await service.create(
        {
          name: 'Acme Acquisition',
          type: 'ACQUISITION' as DealType,
          stage: 'SOURCING' as DealStage,
          currency: 'USD',
          priority: 'NONE',
        },
        TEST_IDS.org,
        TEST_IDS.user
      );

      // Verify database creation with new format (DD Tracker as page)
      expect(databaseCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'DD Tracker',
          description: 'Track due diligence tasks for this deal',
          organizationId: TEST_IDS.org,
          dealId: TEST_IDS.deal,
          createdById: TEST_IDS.user,
        }),
      });

      // Verify only DealHeaderBlock created (database is now a page, not a block)
      expect(blockCreate).toHaveBeenCalledTimes(1);

      // DealHeaderBlock on root page
      expect(blockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'deal_header',
          order: 0,
        }),
      });
    });

    // Phase 12: Test DatabaseEntry creation
    it('should create DatabaseEntry in org-level Deals Database', async () => {
      const mockDeal = createMockDeal({ name: 'Phase12 Deal', databaseEntryId: TEST_IDS.entry });
      const mockPage = { id: TEST_IDS.page, dealId: TEST_IDS.deal, title: 'Phase12 Deal' };
      const mockBlock = { id: TEST_IDS.block, pageId: TEST_IDS.page };
      const mockDatabase = { id: 'clqddtracker12345678901234', name: 'DD Tracker' };
      const mockDealsDb = { id: TEST_IDS.database, name: 'Deals', isOrgLevel: true, pageId: 'clqdealsdbpage1234567890' };
      const mockEntry = { id: TEST_IDS.entry, databaseId: TEST_IDS.database };

      const dealCreate = vi.fn().mockResolvedValue(mockDeal);
      const entryCreate = vi.fn().mockResolvedValue(mockEntry);
      const databaseFindFirst = vi.fn().mockResolvedValue(mockDealsDb);

      mockPrisma.$transaction.mockImplementation(async (fn) => {
        const tx = {
          deal: { create: dealCreate },
          page: { create: vi.fn().mockResolvedValue(mockPage), createMany: vi.fn().mockResolvedValue({ count: 3 }) },
          block: { create: vi.fn().mockResolvedValue(mockBlock), createMany: vi.fn().mockResolvedValue({ count: 4 }) },
          database: { create: vi.fn().mockResolvedValue(mockDatabase), findFirst: databaseFindFirst },
          databaseEntry: { create: entryCreate },
        };
        return fn(tx);
      });

      await service.create(
        {
          name: 'Phase12 Deal',
          type: 'ACQUISITION' as DealType,
          stage: 'SOURCING' as DealStage,
          currency: 'USD',
          priority: 'NONE',
          value: 1000000,
        },
        TEST_IDS.org,
        TEST_IDS.user
      );

      // Verify Deals Database lookup
      expect(databaseFindFirst).toHaveBeenCalledWith({
        where: {
          organizationId: TEST_IDS.org,
          isOrgLevel: true,
          name: 'Deals',
        },
      });

      // Verify DatabaseEntry creation with deal properties
      expect(entryCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          databaseId: TEST_IDS.database,
          properties: expect.objectContaining({
            name: 'Phase12 Deal',
            stage: 'SOURCING',
            type: 'ACQUISITION',
          }),
          createdById: TEST_IDS.user,
        }),
      });

      // Verify deal is linked to entry
      expect(dealCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            databaseEntryId: TEST_IDS.entry,
          }),
        })
      );
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

    // Phase 12: Test DatabaseEntry sync on update
    it('should sync updates to DatabaseEntry if deal has databaseEntryId', async () => {
      const existingDeal = createMockDeal({ databaseEntryId: TEST_IDS.entry });
      const existingEntry = {
        id: TEST_IDS.entry,
        properties: { name: 'Old Name', stage: 'SOURCING' },
        database: { organizationId: TEST_IDS.org },
      };
      const updatedDeal = createMockDeal({ name: 'Updated Deal', stage: 'DEEP_DUE_DILIGENCE' as DealStage, databaseEntryId: TEST_IDS.entry });

      mockPrisma.deal.findUnique.mockResolvedValue(existingDeal);
      mockPrisma.deal.update.mockResolvedValue(updatedDeal);
      mockPrisma.databaseEntry.findUnique.mockResolvedValue(existingEntry);
      mockPrisma.databaseEntry.update.mockResolvedValue({
        ...existingEntry,
        properties: { name: 'Updated Deal', stage: 'DEEP_DUE_DILIGENCE' },
      });

      const result = await service.update(
        TEST_IDS.deal,
        { name: 'Updated Deal', stage: 'DEEP_DUE_DILIGENCE' as DealStage },
        TEST_IDS.org
      );

      expect(result.name).toBe('Updated Deal');

      // Verify DatabaseEntry was updated
      expect(mockPrisma.databaseEntry.update).toHaveBeenCalledWith({
        where: { id: TEST_IDS.entry },
        data: expect.objectContaining({
          properties: expect.objectContaining({
            name: 'Updated Deal',
            stage: 'DEEP_DUE_DILIGENCE',
          }),
        }),
      });
    });

    it('should not update DatabaseEntry if deal has no databaseEntryId', async () => {
      const existingDeal = createMockDeal({ databaseEntryId: null });
      const updatedDeal = createMockDeal({ name: 'Updated Deal', databaseEntryId: null });

      mockPrisma.deal.findUnique.mockResolvedValue(existingDeal);
      mockPrisma.deal.update.mockResolvedValue(updatedDeal);

      await service.update(
        TEST_IDS.deal,
        { name: 'Updated Deal' },
        TEST_IDS.org
      );

      // DatabaseEntry update should not be called
      expect(mockPrisma.databaseEntry.update).not.toHaveBeenCalled();
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
