/**
 * DashboardService Unit Tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DashboardService } from './dashboard.service';
import { createMockDeal, createMockPrisma, resetMocks, TEST_IDS } from '../tests/setup';

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

describe('DashboardService', () => {
  let service: DashboardService;
  let mockPrisma: ReturnType<typeof createDashboardMockPrisma>;

  beforeEach(() => {
    resetMocks();
    mockPrisma = createDashboardMockPrisma();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    service = new DashboardService(mockPrisma as any);
  });

  describe('getPipelineHealth', () => {
    it('should aggregate deals by stage', async () => {
      const mockDeals = [
        createMockDeal({ stage: 'SOURCING', value: 1000000 as unknown as null, probability: 30 }),
        createMockDeal({ stage: 'SOURCING', value: 500000 as unknown as null, probability: 20 }),
        createMockDeal({ stage: 'INITIAL_REVIEW', value: 2000000 as unknown as null, probability: 50 }),
      ];
      mockPrisma.deal.findMany.mockResolvedValue(mockDeals);

      const result = await service.getPipelineHealth(TEST_IDS.org);

      expect(result.summary.totalDeals).toBe(3);
      expect(result.summary.totalValue).toBe(3500000);
    });

    it('should filter by organizationId (multi-tenancy)', async () => {
      mockPrisma.deal.findMany.mockResolvedValue([]);

      await service.getPipelineHealth(TEST_IDS.org);

      expect(mockPrisma.deal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: TEST_IDS.org,
          }),
        })
      );
    });

    it('should exclude closed deals by default', async () => {
      mockPrisma.deal.findMany.mockResolvedValue([]);

      await service.getPipelineHealth(TEST_IDS.org);

      expect(mockPrisma.deal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] },
          }),
        })
      );
    });

    it('should include closed deals when requested', async () => {
      mockPrisma.deal.findMany.mockResolvedValue([]);

      await service.getPipelineHealth(TEST_IDS.org, { includeClosedDeals: true });

      expect(mockPrisma.deal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            stage: expect.anything(),
          }),
        })
      );
    });

    it('should filter by deal type', async () => {
      mockPrisma.deal.findMany.mockResolvedValue([]);

      await service.getPipelineHealth(TEST_IDS.org, { type: 'ACQUISITION', includeClosedDeals: false });

      expect(mockPrisma.deal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'ACQUISITION',
          }),
        })
      );
    });

    it('should calculate weighted values correctly', async () => {
      const mockDeals = [
        createMockDeal({ stage: 'SOURCING', value: 1000000 as unknown as null, probability: 50 }),
      ];
      mockPrisma.deal.findMany.mockResolvedValue(mockDeals);

      const result = await service.getPipelineHealth(TEST_IDS.org, { includeClosedDeals: true });

      expect(result.summary.totalWeightedValue).toBe(500000); // 1000000 * 0.5
    });

    it('should use default 50% probability when not set', async () => {
      const mockDeals = [
        createMockDeal({ stage: 'SOURCING', value: 1000000 as unknown as null, probability: null }),
      ];
      mockPrisma.deal.findMany.mockResolvedValue(mockDeals);

      const result = await service.getPipelineHealth(TEST_IDS.org, { includeClosedDeals: true });

      expect(result.summary.totalWeightedValue).toBe(500000); // 1000000 * 0.5 (default)
    });

    it('should return all stages even with zero deals', async () => {
      mockPrisma.deal.findMany.mockResolvedValue([]);

      const result = await service.getPipelineHealth(TEST_IDS.org);

      expect(result.stages.length).toBe(8); // All 8 deal stages
      expect(result.stages.every((s) => s.dealCount === 0)).toBe(true);
    });

    it('should aggregate by deal type', async () => {
      const mockDeals = [
        createMockDeal({ type: 'ACQUISITION', value: 1000000 as unknown as null }),
        createMockDeal({ type: 'ACQUISITION', value: 2000000 as unknown as null }),
        createMockDeal({ type: 'INVESTMENT', value: 500000 as unknown as null }),
      ];
      mockPrisma.deal.findMany.mockResolvedValue(mockDeals);

      const result = await service.getPipelineHealth(TEST_IDS.org, { includeClosedDeals: true });

      const acquisitions = result.byType.find((t) => t.type === 'ACQUISITION');
      const investments = result.byType.find((t) => t.type === 'INVESTMENT');

      expect(acquisitions?.count).toBe(2);
      expect(acquisitions?.value).toBe(3000000);
      expect(investments?.count).toBe(1);
      expect(investments?.value).toBe(500000);
    });
  });

  describe('getRecentActivities', () => {
    it('should return paginated activities', async () => {
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

      const result = await service.getRecentActivities(TEST_IDS.org, {
        page: 1,
        pageSize: 20,
        hoursBack: 48,
        excludeDismissed: false,
      });

      expect(result.items.length).toBe(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
    });

    it('should filter by organizationId via deal relation', async () => {
      mockPrisma.activity.findMany.mockResolvedValue([]);
      mockPrisma.activity.count.mockResolvedValue(0);

      await service.getRecentActivities(TEST_IDS.org, {
        page: 1,
        pageSize: 20,
        hoursBack: 48,
        excludeDismissed: false,
      });

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deal: { organizationId: TEST_IDS.org },
          }),
        })
      );
    });

    it('should filter by time window', async () => {
      mockPrisma.activity.findMany.mockResolvedValue([]);
      mockPrisma.activity.count.mockResolvedValue(0);

      const now = new Date();
      await service.getRecentActivities(TEST_IDS.org, {
        page: 1,
        pageSize: 20,
        hoursBack: 24,
        excludeDismissed: false,
      });

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
            }),
          }),
        })
      );
    });

    it('should order by createdAt desc', async () => {
      mockPrisma.activity.findMany.mockResolvedValue([]);
      mockPrisma.activity.count.mockResolvedValue(0);

      await service.getRecentActivities(TEST_IDS.org, {
        page: 1,
        pageSize: 20,
        hoursBack: 48,
        excludeDismissed: false,
      });

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should calculate hasMore correctly', async () => {
      const mockActivities = Array(20).fill(null).map((_, i) => ({
        id: `act${i}`,
        type: 'DEAL_CREATED',
        description: 'Created deal',
        metadata: {},
        createdAt: new Date(),
        user: null,
        deal: null,
      }));
      mockPrisma.activity.findMany.mockResolvedValue(mockActivities);
      mockPrisma.activity.count.mockResolvedValue(50);

      const result = await service.getRecentActivities(TEST_IDS.org, {
        page: 1,
        pageSize: 20,
        hoursBack: 48,
        excludeDismissed: false,
      });

      expect(result.pagination.hasMore).toBe(true);
    });
  });

  describe('getActivitySummary', () => {
    it('should return activity counts by type', async () => {
      const mockGroupBy = [
        { type: 'DEAL_CREATED', _count: { id: 5 } },
        { type: 'DOCUMENT_UPLOADED', _count: { id: 3 } },
      ];
      mockPrisma.activity.groupBy.mockResolvedValue(mockGroupBy);

      const result = await service.getActivitySummary(TEST_IDS.org, { hoursBack: 48 });

      const dealCreated = result.summary.find((s) => s.type === 'DEAL_CREATED');
      const docUploaded = result.summary.find((s) => s.type === 'DOCUMENT_UPLOADED');

      expect(dealCreated?.count).toBe(5);
      expect(docUploaded?.count).toBe(3);
    });

    it('should return all activity types including zeros', async () => {
      mockPrisma.activity.groupBy.mockResolvedValue([]);

      const result = await service.getActivitySummary(TEST_IDS.org, { hoursBack: 48 });

      expect(result.summary.length).toBe(12); // All 12 activity types (including QA_APPROVED, QA_EDITED, QA_REJECTED)
      expect(result.summary.every((s) => s.count === 0)).toBe(true);
    });

    it('should include human-readable labels', async () => {
      mockPrisma.activity.groupBy.mockResolvedValue([
        { type: 'DEAL_CREATED', _count: { id: 1 } },
      ]);

      const result = await service.getActivitySummary(TEST_IDS.org, { hoursBack: 48 });

      const dealCreated = result.summary.find((s) => s.type === 'DEAL_CREATED');
      expect(dealCreated?.label).toBe('Deals Created');
    });

    it('should filter by organizationId via deal relation', async () => {
      mockPrisma.activity.groupBy.mockResolvedValue([]);

      await service.getActivitySummary(TEST_IDS.org, { hoursBack: 48 });

      expect(mockPrisma.activity.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deal: { organizationId: TEST_IDS.org },
          }),
        })
      );
    });

    it('should calculate total activities correctly', async () => {
      const mockGroupBy = [
        { type: 'DEAL_CREATED', _count: { id: 5 } },
        { type: 'DOCUMENT_UPLOADED', _count: { id: 3 } },
        { type: 'DEAL_STAGE_CHANGED', _count: { id: 2 } },
      ];
      mockPrisma.activity.groupBy.mockResolvedValue(mockGroupBy);

      const result = await service.getActivitySummary(TEST_IDS.org, { hoursBack: 48 });

      expect(result.totalActivities).toBe(10);
    });

    it('should include period in result', async () => {
      mockPrisma.activity.groupBy.mockResolvedValue([]);

      const result = await service.getActivitySummary(TEST_IDS.org, { hoursBack: 24 });

      expect(result.period.from).toBeInstanceOf(Date);
      expect(result.period.to).toBeInstanceOf(Date);
      expect(result.period.from < result.period.to).toBe(true);
    });
  });
});
