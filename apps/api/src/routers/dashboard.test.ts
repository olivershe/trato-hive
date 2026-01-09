/**
 * Dashboard Router Integration Tests
 *
 * Tests the full tRPC router using createCaller pattern.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { appRouter } from '../trpc/router';
import { createMockDeal, createMockPrisma, createMockSession, resetMocks, TEST_IDS } from '../tests/setup';

// Extend mock Prisma with dashboard-specific methods
function createDashboardMockPrisma() {
  const baseMock = createMockPrisma();
  return {
    ...baseMock,
    activity: {
      ...baseMock.activity,
      findMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
  };
}

// Type for test context
type TestContext = {
  session: ReturnType<typeof createMockSession> | null;
  db: ReturnType<typeof createDashboardMockPrisma>;
  organizationId?: string;
};

describe('Dashboard Router Integration', () => {
  let mockPrisma: ReturnType<typeof createDashboardMockPrisma>;

  beforeEach(() => {
    resetMocks();
    mockPrisma = createDashboardMockPrisma();
  });

  function createCaller(session: ReturnType<typeof createMockSession> | null = createMockSession()) {
    const ctx: TestContext = {
      session,
      db: mockPrisma,
      organizationId: session?.user?.organizationId || undefined,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return appRouter.createCaller(ctx as any);
  }

  describe('dashboard.pipelineHealth', () => {
    it('should return pipeline health metrics', async () => {
      const mockDeals = [
        createMockDeal({ stage: 'SOURCING', value: 1000000 as unknown as null }),
        createMockDeal({ stage: 'INITIAL_REVIEW', value: 2000000 as unknown as null }),
      ];
      mockPrisma.deal.findMany.mockResolvedValue(mockDeals);

      const caller = createCaller();
      const result = await caller.dashboard.pipelineHealth({});

      expect(result.summary.totalDeals).toBe(2);
      expect(result.summary.totalValue).toBe(3000000);
      expect(result.stages).toHaveLength(8);
    });

    it('should filter by deal type', async () => {
      mockPrisma.deal.findMany.mockResolvedValue([]);

      const caller = createCaller();
      await caller.dashboard.pipelineHealth({ type: 'ACQUISITION' });

      expect(mockPrisma.deal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'ACQUISITION' }),
        })
      );
    });

    it('should include closed deals when requested', async () => {
      mockPrisma.deal.findMany.mockResolvedValue([]);

      const caller = createCaller();
      await caller.dashboard.pipelineHealth({ includeClosedDeals: true });

      expect(mockPrisma.deal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            stage: expect.anything(),
          }),
        })
      );
    });

    it('should reject unauthenticated requests', async () => {
      const caller = createCaller(null);
      await expect(caller.dashboard.pipelineHealth({})).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });

  });

  describe('dashboard.recentActivities', () => {
    it('should return paginated activity feed', async () => {
      const mockActivities = [
        {
          id: 'act1',
          type: 'DEAL_CREATED',
          description: 'Created deal',
          metadata: {},
          createdAt: new Date(),
          user: { id: TEST_IDS.user, name: 'Test User', email: 'test@example.com', image: null },
          deal: { id: TEST_IDS.deal, name: 'Test Deal', stage: 'SOURCING' },
        },
      ];
      mockPrisma.activity.findMany.mockResolvedValue(mockActivities);
      mockPrisma.activity.count.mockResolvedValue(1);

      const caller = createCaller();
      const result = await caller.dashboard.recentActivities({
        page: 1,
        pageSize: 20,
        hoursBack: 48,
      });

      expect(result.items).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should validate input parameters', async () => {
      mockPrisma.activity.findMany.mockResolvedValue([]);
      mockPrisma.activity.count.mockResolvedValue(0);

      const caller = createCaller();

      // pageSize max is 50
      await expect(
        caller.dashboard.recentActivities({
          page: 1,
          pageSize: 100,
          hoursBack: 48,
        })
      ).rejects.toThrow();
    });

    it('should reject unauthenticated requests', async () => {
      const caller = createCaller(null);
      await expect(
        caller.dashboard.recentActivities({ page: 1, pageSize: 20, hoursBack: 48 })
      ).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });
  });

  describe('dashboard.activitySummary', () => {
    it('should return activity counts by type', async () => {
      const mockGroupBy = [
        { type: 'DEAL_CREATED', _count: { id: 5 } },
        { type: 'DOCUMENT_UPLOADED', _count: { id: 3 } },
      ];
      mockPrisma.activity.groupBy.mockResolvedValue(mockGroupBy);

      const caller = createCaller();
      const result = await caller.dashboard.activitySummary({ hoursBack: 48 });

      expect(result.totalActivities).toBe(8);
      expect(result.summary).toHaveLength(9); // All activity types
    });

    it('should filter by time range', async () => {
      mockPrisma.activity.groupBy.mockResolvedValue([]);

      const caller = createCaller();
      await caller.dashboard.activitySummary({ hoursBack: 24 });

      expect(mockPrisma.activity.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
            }),
          }),
        })
      );
    });

    it('should reject unauthenticated requests', async () => {
      const caller = createCaller(null);
      await expect(caller.dashboard.activitySummary({ hoursBack: 48 })).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });

  });
});
