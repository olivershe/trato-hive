/**
 * Deals Router Integration Tests
 *
 * Tests the full tRPC router using createCaller pattern.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { appRouter } from '../trpc/router';
import { createMockDeal, createMockPrisma, createMockSession, resetMocks, TEST_IDS } from '../tests/setup';
import type { DealStage, DealType } from '@trato-hive/db';

// Type for test context
type TestContext = {
  session: ReturnType<typeof createMockSession> | null;
  db: ReturnType<typeof createMockPrisma>;
  organizationId?: string;
};

describe('Deals Router Integration', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    resetMocks();
    mockPrisma = createMockPrisma();
  });

  function createCaller(session = createMockSession()) {
    const ctx: TestContext = {
      session,
      db: mockPrisma,
      organizationId: session?.user?.organizationId || undefined,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return appRouter.createCaller(ctx as any);
  }

  describe('deal.list', () => {
    it('should list deals for organization', async () => {
      const mockDeals = [createMockDeal(), createMockDeal({ id: TEST_IDS.deal2 })];
      mockPrisma.deal.findMany.mockResolvedValue(mockDeals);
      mockPrisma.deal.count.mockResolvedValue(2);

      const caller = createCaller();
      const result = await caller.deal.list({ page: 1, pageSize: 10 });

      expect(result.items).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it('should filter by stage', async () => {
      mockPrisma.deal.findMany.mockResolvedValue([]);
      mockPrisma.deal.count.mockResolvedValue(0);

      const caller = createCaller();
      await caller.deal.list({
        page: 1,
        pageSize: 10,
        filter: { stage: 'SOURCING' },
      });

      expect(mockPrisma.deal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ stage: 'SOURCING' }),
        })
      );
    });
  });

  describe('deal.get', () => {
    it('should return deal if belongs to organization', async () => {
      const mockDeal = createMockDeal();
      mockPrisma.deal.findUnique.mockResolvedValue(mockDeal);

      const caller = createCaller();
      const result = await caller.deal.get({ id: TEST_IDS.deal });

      expect(result.id).toBe(TEST_IDS.deal);
    });

    it('should throw NOT_FOUND if deal belongs to different org', async () => {
      mockPrisma.deal.findUnique.mockResolvedValue(
        createMockDeal({ organizationId: 'clqdifferentorg123456789012' })
      );

      const caller = createCaller();
      await expect(caller.deal.get({ id: TEST_IDS.deal })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });
  });

  describe('deal.create', () => {
    it('should create deal with organizationId from context', async () => {
      const mockDeal = createMockDeal();
      const mockPage = { id: TEST_IDS.page, dealId: TEST_IDS.deal, title: 'New Deal' };
      const mockBlock = { id: TEST_IDS.block, pageId: TEST_IDS.page };

      const mockDatabase = { id: 'clqddtracker12345678901234', name: 'New Deal - Due Diligence Tracker' };
      mockPrisma.$transaction.mockImplementation(async (fn) => {
        const tx = {
          deal: { create: vi.fn().mockResolvedValue(mockDeal) },
          page: { create: vi.fn().mockResolvedValue(mockPage) },
          block: { create: vi.fn().mockResolvedValue(mockBlock) },
          database: { create: vi.fn().mockResolvedValue(mockDatabase) },
        };
        return fn(tx);
      });
      mockPrisma.activity.create.mockResolvedValue({});

      const caller = createCaller();
      const result = await caller.deal.create({
        name: 'New Deal',
        type: 'ACQUISITION' as DealType,
        stage: 'SOURCING' as DealStage,
        currency: 'USD',
      });

      expect(result.id).toBe(TEST_IDS.deal);
      // Activity log should be called
      expect(mockPrisma.activity.create).toHaveBeenCalled();
    });
  });

  describe('deal.update', () => {
    it('should update deal and log stage change', async () => {
      const existingDeal = createMockDeal({ stage: 'SOURCING' as DealStage });
      const updatedDeal = createMockDeal({
        name: 'Updated Deal',
        stage: 'INITIAL_REVIEW' as DealStage,
      });

      mockPrisma.deal.findUnique.mockResolvedValue(existingDeal);
      mockPrisma.deal.update.mockResolvedValue(updatedDeal);
      mockPrisma.activity.create.mockResolvedValue({});

      const caller = createCaller();
      const result = await caller.deal.update({
        id: TEST_IDS.deal,
        name: 'Updated Deal',
        stage: 'INITIAL_REVIEW' as DealStage,
      });

      expect(result.name).toBe('Updated Deal');
      // Stage change activity should be logged
      expect(mockPrisma.activity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'DEAL_STAGE_CHANGED',
          }),
        })
      );
    });
  });

  describe('deal.getFactSheet', () => {
    it('should return facts for deal', async () => {
      const mockDeal = createMockDeal({ companyId: TEST_IDS.company });
      const mockFacts = [
        {
          id: TEST_IDS.fact,
          type: 'FINANCIAL_METRIC',
          subject: 'Revenue',
          predicate: 'is',
          object: '$10M',
          confidence: 0.95,
          sourceText: 'Annual revenue',
          document: { id: TEST_IDS.doc, name: 'Financial Statement' },
        },
      ];
      const mockCompany = { id: TEST_IDS.company, name: 'Acme Corp', aiSummary: null };

      mockPrisma.deal.findUnique.mockResolvedValue(mockDeal);
      mockPrisma.fact.findMany.mockResolvedValue(mockFacts);
      mockPrisma.company.findUnique.mockResolvedValue(mockCompany);

      const caller = createCaller();
      const result = await caller.deal.getFactSheet({ dealId: TEST_IDS.deal });

      expect(result.facts).toHaveLength(1);
      expect(result.company?.name).toBe('Acme Corp');
    });
  });

  describe('Multi-tenancy enforcement', () => {
    it('should reject requests without session (UNAUTHORIZED)', async () => {
      const ctx: TestContext = {
        session: null,
        db: mockPrisma,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const caller = appRouter.createCaller(ctx as any);

      await expect(caller.deal.list({ page: 1 })).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });

    it('should reject requests without organization (FORBIDDEN)', async () => {
      const sessionWithoutOrg = createMockSession();
      // Remove organizationId to test FORBIDDEN case
      (sessionWithoutOrg.user as { organizationId?: string }).organizationId = undefined;

      const ctx: TestContext = {
        session: sessionWithoutOrg,
        db: mockPrisma,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const caller = appRouter.createCaller(ctx as any);

      await expect(caller.deal.list({ page: 1 })).rejects.toMatchObject({
        code: 'FORBIDDEN',
      });
    });
  });
});
