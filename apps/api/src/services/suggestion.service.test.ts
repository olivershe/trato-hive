/**
 * Suggestion Service Tests
 *
 * Tests for AI suggestion acceptance/dismissal logic.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SuggestionService } from './suggestion.service';
import {
  createMockPrisma,
  createMockDeal,
  createMockDatabase,
  createMockDatabaseEntry,
  createMockFact,
  resetMocks,
  TEST_IDS,
} from '../tests/setup';
import type { FactType } from '@trato-hive/db';

// Mock company type
interface MockCompany {
  id: string;
  organizationId: string;
  name: string;
  website: string | null;
  industry: string | null;
  employees: number | null;
  revenue: unknown;
  description: string | null;
}

function createMockCompany(overrides?: Partial<MockCompany>): MockCompany {
  return {
    id: TEST_IDS.company,
    organizationId: TEST_IDS.org,
    name: 'Test Company',
    website: 'https://example.com',
    industry: 'Technology',
    employees: 100,
    revenue: 5000000,
    description: 'A test company',
    ...overrides,
  };
}

// Mock activity result
const mockActivity = {
  id: 'clqactivity1234567890abcd',
  userId: TEST_IDS.user,
  type: 'AI_SUGGESTION_ACCEPTED',
  description: 'Test activity',
  createdAt: new Date(),
};

describe('SuggestionService', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let service: SuggestionService;

  beforeEach(() => {
    resetMocks();
    mockPrisma = createMockPrisma();
    // Mock activity.create to return a valid activity
    mockPrisma.activity.create.mockResolvedValue(mockActivity);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    service = new SuggestionService(mockPrisma as any);
  });

  // ===========================================================================
  // applySuggestion - Deal
  // ===========================================================================

  describe('applySuggestion - Deal', () => {
    it('should apply deal suggestion and log activity', async () => {
      const mockDeal = createMockDeal({ value: 1000000 });
      mockPrisma.deal.findUnique.mockResolvedValue(mockDeal);
      mockPrisma.deal.update.mockResolvedValue({ ...mockDeal, value: 2000000 });

      const result = await service.applySuggestion(
        {
          suggestionId: 'suggestion_123',
          entityType: 'Deal',
          entityId: TEST_IDS.deal,
          field: 'value',
          value: 2000000,
          factIds: [TEST_IDS.fact],
        },
        TEST_IDS.org,
        TEST_IDS.user
      );

      expect(result.success).toBe(true);
      expect(result.entityType).toBe('Deal');
      expect(result.previousValue).toBe(1000000);
      expect(result.newValue).toBe(2000000);
      expect(result.activityId).toBe(mockActivity.id);

      expect(mockPrisma.deal.update).toHaveBeenCalledWith({
        where: { id: TEST_IDS.deal },
        data: { value: 2000000 },
      });

      expect(mockPrisma.activity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'AI_SUGGESTION_ACCEPTED',
          description: expect.stringContaining('Deal'),
        }),
      });
    });

    it('should throw BAD_REQUEST when field is missing for Deal', async () => {
      await expect(
        service.applySuggestion(
          {
            suggestionId: 'suggestion_123',
            entityType: 'Deal',
            entityId: TEST_IDS.deal,
            value: 2000000,
            factIds: [],
          },
          TEST_IDS.org,
          TEST_IDS.user
        )
      ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Field is required for Deal suggestions',
      });
    });

    it('should throw NOT_FOUND for non-existent deal', async () => {
      mockPrisma.deal.findUnique.mockResolvedValue(null);

      await expect(
        service.applySuggestion(
          {
            suggestionId: 'suggestion_123',
            entityType: 'Deal',
            entityId: TEST_IDS.deal,
            field: 'value',
            value: 2000000,
            factIds: [],
          },
          TEST_IDS.org,
          TEST_IDS.user
        )
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('should throw NOT_FOUND for deal in different org', async () => {
      mockPrisma.deal.findUnique.mockResolvedValue(
        createMockDeal({ organizationId: 'clqdifferentorg123456789012' })
      );

      await expect(
        service.applySuggestion(
          {
            suggestionId: 'suggestion_123',
            entityType: 'Deal',
            entityId: TEST_IDS.deal,
            field: 'value',
            value: 2000000,
            factIds: [],
          },
          TEST_IDS.org,
          TEST_IDS.user
        )
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('should throw BAD_REQUEST for non-allowed deal field', async () => {
      mockPrisma.deal.findUnique.mockResolvedValue(createMockDeal());

      await expect(
        service.applySuggestion(
          {
            suggestionId: 'suggestion_123',
            entityType: 'Deal',
            entityId: TEST_IDS.deal,
            field: 'name', // not in allowed fields
            value: 'New Name',
            factIds: [],
          },
          TEST_IDS.org,
          TEST_IDS.user
        )
      ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Cannot update field: name',
      });
    });

    it('should apply probability suggestion', async () => {
      const mockDeal = createMockDeal({ probability: 50 });
      mockPrisma.deal.findUnique.mockResolvedValue(mockDeal);
      mockPrisma.deal.update.mockResolvedValue({ ...mockDeal, probability: 75 });

      const result = await service.applySuggestion(
        {
          suggestionId: 'suggestion_123',
          entityType: 'Deal',
          entityId: TEST_IDS.deal,
          field: 'probability',
          value: 75,
          factIds: [TEST_IDS.fact],
        },
        TEST_IDS.org,
        TEST_IDS.user
      );

      expect(result.success).toBe(true);
      expect(result.previousValue).toBe(50);
      expect(result.newValue).toBe(75);
    });
  });

  // ===========================================================================
  // applySuggestion - Company
  // ===========================================================================

  describe('applySuggestion - Company', () => {
    it('should apply company suggestion and log activity', async () => {
      const mockCompany = createMockCompany({ website: 'https://old.com' });
      mockPrisma.company.findUnique.mockResolvedValue(mockCompany);
      mockPrisma.company.update.mockResolvedValue({ ...mockCompany, website: 'https://new.com' });

      const result = await service.applySuggestion(
        {
          suggestionId: 'suggestion_123',
          entityType: 'Company',
          entityId: TEST_IDS.company,
          field: 'website',
          value: 'https://new.com',
          factIds: [TEST_IDS.fact],
        },
        TEST_IDS.org,
        TEST_IDS.user
      );

      expect(result.success).toBe(true);
      expect(result.entityType).toBe('Company');
      expect(result.previousValue).toBe('https://old.com');
      expect(result.newValue).toBe('https://new.com');
    });

    it('should throw BAD_REQUEST when field is missing for Company', async () => {
      await expect(
        service.applySuggestion(
          {
            suggestionId: 'suggestion_123',
            entityType: 'Company',
            entityId: TEST_IDS.company,
            value: 'value',
            factIds: [],
          },
          TEST_IDS.org,
          TEST_IDS.user
        )
      ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Field is required for Company suggestions',
      });
    });

    it('should throw NOT_FOUND for company in different org', async () => {
      mockPrisma.company.findUnique.mockResolvedValue(
        createMockCompany({ organizationId: 'clqdifferentorg123456789012' })
      );

      await expect(
        service.applySuggestion(
          {
            suggestionId: 'suggestion_123',
            entityType: 'Company',
            entityId: TEST_IDS.company,
            field: 'website',
            value: 'https://new.com',
            factIds: [],
          },
          TEST_IDS.org,
          TEST_IDS.user
        )
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('should throw BAD_REQUEST for non-allowed company field', async () => {
      mockPrisma.company.findUnique.mockResolvedValue(createMockCompany());

      await expect(
        service.applySuggestion(
          {
            suggestionId: 'suggestion_123',
            entityType: 'Company',
            entityId: TEST_IDS.company,
            field: 'name', // not in allowed fields
            value: 'New Name',
            factIds: [],
          },
          TEST_IDS.org,
          TEST_IDS.user
        )
      ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Cannot update field: name',
      });
    });
  });

  // ===========================================================================
  // applySuggestion - Database
  // ===========================================================================

  describe('applySuggestion - Database', () => {
    it('should update existing database entry', async () => {
      const mockDatabase = createMockDatabase();
      const mockEntry = createMockDatabaseEntry({
        properties: { [TEST_IDS.column]: 'Old Value' },
      });

      mockPrisma.database.findUnique.mockResolvedValue(mockDatabase);
      mockPrisma.databaseEntry.findUnique.mockResolvedValue(mockEntry);
      mockPrisma.databaseEntry.update.mockResolvedValue({
        ...mockEntry,
        properties: { [TEST_IDS.column]: 'New Value' },
      });

      const result = await service.applySuggestion(
        {
          suggestionId: 'suggestion_123',
          entityType: 'Database',
          entityId: TEST_IDS.database,
          columnId: TEST_IDS.column,
          entryId: TEST_IDS.entry,
          value: 'New Value',
          factIds: [TEST_IDS.fact],
        },
        TEST_IDS.org,
        TEST_IDS.user
      );

      expect(result.success).toBe(true);
      expect(result.entityType).toBe('Database');
      expect(result.previousValue).toBe('Old Value');
      expect(result.newValue).toBe('New Value');

      expect(mockPrisma.databaseEntry.update).toHaveBeenCalledWith({
        where: { id: TEST_IDS.entry },
        data: {
          properties: expect.objectContaining({
            [TEST_IDS.column]: 'New Value',
          }),
        },
      });
    });

    it('should create new database entry when no entryId', async () => {
      const mockDatabase = createMockDatabase();
      mockPrisma.database.findUnique.mockResolvedValue(mockDatabase);
      mockPrisma.databaseEntry.create.mockResolvedValue(
        createMockDatabaseEntry({
          properties: { [TEST_IDS.column]: 'New Value' },
        })
      );

      const result = await service.applySuggestion(
        {
          suggestionId: 'suggestion_123',
          entityType: 'Database',
          entityId: TEST_IDS.database,
          columnId: TEST_IDS.column,
          value: 'New Value',
          factIds: [TEST_IDS.fact],
        },
        TEST_IDS.org,
        TEST_IDS.user
      );

      expect(result.success).toBe(true);
      expect(result.previousValue).toBeUndefined();
      expect(result.newValue).toBe('New Value');

      expect(mockPrisma.databaseEntry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          databaseId: TEST_IDS.database,
          createdById: TEST_IDS.user,
        }),
      });
    });

    it('should throw BAD_REQUEST when columnId is missing', async () => {
      await expect(
        service.applySuggestion(
          {
            suggestionId: 'suggestion_123',
            entityType: 'Database',
            entityId: TEST_IDS.database,
            value: 'value',
            factIds: [],
          },
          TEST_IDS.org,
          TEST_IDS.user
        )
      ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Column ID is required for Database suggestions',
      });
    });

    it('should throw NOT_FOUND for database in different org', async () => {
      mockPrisma.database.findUnique.mockResolvedValue(
        createMockDatabase({ organizationId: 'clqdifferentorg123456789012' })
      );

      await expect(
        service.applySuggestion(
          {
            suggestionId: 'suggestion_123',
            entityType: 'Database',
            entityId: TEST_IDS.database,
            columnId: TEST_IDS.column,
            value: 'value',
            factIds: [],
          },
          TEST_IDS.org,
          TEST_IDS.user
        )
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('should throw NOT_FOUND for entry not in database', async () => {
      const mockDatabase = createMockDatabase();
      const mockEntry = createMockDatabaseEntry({
        databaseId: 'clqdifferentdb123456789012', // different database
      });

      mockPrisma.database.findUnique.mockResolvedValue(mockDatabase);
      mockPrisma.databaseEntry.findUnique.mockResolvedValue(mockEntry);

      await expect(
        service.applySuggestion(
          {
            suggestionId: 'suggestion_123',
            entityType: 'Database',
            entityId: TEST_IDS.database,
            columnId: TEST_IDS.column,
            entryId: TEST_IDS.entry,
            value: 'value',
            factIds: [],
          },
          TEST_IDS.org,
          TEST_IDS.user
        )
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Entry not found',
      });
    });
  });

  // ===========================================================================
  // applySuggestion - Unknown Entity Type
  // ===========================================================================

  describe('applySuggestion - Unknown Entity Type', () => {
    it('should throw BAD_REQUEST for unknown entity type', async () => {
      await expect(
        service.applySuggestion(
          {
            suggestionId: 'suggestion_123',
            entityType: 'Unknown' as 'Deal',
            entityId: TEST_IDS.deal,
            field: 'value',
            value: 'value',
            factIds: [],
          },
          TEST_IDS.org,
          TEST_IDS.user
        )
      ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: expect.stringContaining('Unknown entity type'),
      });
    });
  });

  // ===========================================================================
  // dismissSuggestion
  // ===========================================================================

  describe('dismissSuggestion', () => {
    it('should dismiss deal suggestion and log activity', async () => {
      mockPrisma.deal.findUnique.mockResolvedValue(createMockDeal());

      const result = await service.dismissSuggestion(
        {
          suggestionId: 'suggestion_123',
          entityType: 'Deal',
          entityId: TEST_IDS.deal,
          field: 'value',
          reason: 'Not applicable',
        },
        TEST_IDS.org,
        TEST_IDS.user
      );

      expect(result.success).toBe(true);
      expect(result.activityId).toBe(mockActivity.id);

      expect(mockPrisma.activity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'AI_SUGGESTION_DISMISSED',
          metadata: expect.objectContaining({
            suggestionId: 'suggestion_123',
            reason: 'Not applicable',
          }),
        }),
      });
    });

    it('should dismiss company suggestion', async () => {
      mockPrisma.company.findUnique.mockResolvedValue(createMockCompany());

      const result = await service.dismissSuggestion(
        {
          suggestionId: 'suggestion_123',
          entityType: 'Company',
          entityId: TEST_IDS.company,
        },
        TEST_IDS.org,
        TEST_IDS.user
      );

      expect(result.success).toBe(true);
    });

    it('should dismiss database suggestion', async () => {
      mockPrisma.database.findUnique.mockResolvedValue(createMockDatabase());

      const result = await service.dismissSuggestion(
        {
          suggestionId: 'suggestion_123',
          entityType: 'Database',
          entityId: TEST_IDS.database,
        },
        TEST_IDS.org,
        TEST_IDS.user
      );

      expect(result.success).toBe(true);
    });

    it('should throw NOT_FOUND for deal in different org', async () => {
      mockPrisma.deal.findUnique.mockResolvedValue(
        createMockDeal({ organizationId: 'clqdifferentorg123456789012' })
      );

      await expect(
        service.dismissSuggestion(
          {
            suggestionId: 'suggestion_123',
            entityType: 'Deal',
            entityId: TEST_IDS.deal,
          },
          TEST_IDS.org,
          TEST_IDS.user
        )
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('should throw NOT_FOUND for non-existent entity', async () => {
      mockPrisma.deal.findUnique.mockResolvedValue(null);

      await expect(
        service.dismissSuggestion(
          {
            suggestionId: 'suggestion_123',
            entityType: 'Deal',
            entityId: TEST_IDS.deal,
          },
          TEST_IDS.org,
          TEST_IDS.user
        )
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });
  });

  // ===========================================================================
  // generateSuggestionsForDeal
  // ===========================================================================

  describe('generateSuggestionsForDeal', () => {
    it('should generate suggestions from deal facts', async () => {
      const mockDeal = createMockDeal({
        value: null,
        probability: null,
        expectedCloseDate: null,
      });
      const mockFacts = [
        createMockFact({
          type: 'FINANCIAL_METRIC' as FactType,
          object: '$5,000,000',
          confidence: 0.9,
        }),
      ];

      mockPrisma.deal.findUnique.mockResolvedValue(mockDeal);
      mockPrisma.fact.findMany.mockResolvedValue(mockFacts);

      const result = await service.generateSuggestionsForDeal(TEST_IDS.deal, TEST_IDS.org);

      expect(result.dealId).toBe(TEST_IDS.deal);
      expect(result.totalFacts).toBe(1);
      expect(result.fieldSuggestions).toBeDefined();
    });

    it('should extract numeric value from FINANCIAL_METRIC facts', async () => {
      const mockDeal = createMockDeal({ value: null });
      const mockFacts = [
        createMockFact({
          type: 'FINANCIAL_METRIC' as FactType,
          object: 'Revenue: $10,000,000 in 2024',
          confidence: 0.95,
        }),
      ];

      mockPrisma.deal.findUnique.mockResolvedValue(mockDeal);
      mockPrisma.fact.findMany.mockResolvedValue(mockFacts);

      const result = await service.generateSuggestionsForDeal(TEST_IDS.deal, TEST_IDS.org);

      const valueSuggestion = result.fieldSuggestions.find((s) => s.field === 'value');
      expect(valueSuggestion).toBeDefined();
      expect(valueSuggestion?.suggestedValue).toBe(10000000);
    });

    it('should extract date from facts for expectedCloseDate', async () => {
      const mockDeal = createMockDeal({ expectedCloseDate: null });
      const mockFacts = [
        createMockFact({
          type: 'OTHER' as FactType,
          object: 'Expected close: 2024-06-30',
          confidence: 0.85,
        }),
      ];

      mockPrisma.deal.findUnique.mockResolvedValue(mockDeal);
      mockPrisma.fact.findMany.mockResolvedValue(mockFacts);

      const result = await service.generateSuggestionsForDeal(TEST_IDS.deal, TEST_IDS.org);

      const dateSuggestion = result.fieldSuggestions.find((s) => s.field === 'expectedCloseDate');
      expect(dateSuggestion).toBeDefined();
    });

    it('should deduplicate suggestions by field, keeping highest confidence', async () => {
      const mockDeal = createMockDeal({ value: null });
      const mockFacts = [
        createMockFact({
          id: TEST_IDS.fact,
          type: 'FINANCIAL_METRIC' as FactType,
          object: '$5,000,000',
          confidence: 0.8,
        }),
        createMockFact({
          id: TEST_IDS.fact2,
          type: 'FINANCIAL_METRIC' as FactType,
          object: '$10,000,000',
          confidence: 0.95,
        }),
      ];

      mockPrisma.deal.findUnique.mockResolvedValue(mockDeal);
      mockPrisma.fact.findMany.mockResolvedValue(mockFacts);

      const result = await service.generateSuggestionsForDeal(TEST_IDS.deal, TEST_IDS.org);

      const valueSuggestions = result.fieldSuggestions.filter((s) => s.field === 'value');
      expect(valueSuggestions).toHaveLength(1);
      expect(valueSuggestions[0].confidence).toBe(0.95);
      expect(valueSuggestions[0].suggestedValue).toBe(10000000);
    });

    it('should return empty suggestions when no facts found', async () => {
      const mockDeal = createMockDeal();
      mockPrisma.deal.findUnique.mockResolvedValue(mockDeal);
      mockPrisma.fact.findMany.mockResolvedValue([]);

      const result = await service.generateSuggestionsForDeal(TEST_IDS.deal, TEST_IDS.org);

      expect(result.fieldSuggestions).toEqual([]);
      expect(result.totalFacts).toBe(0);
    });

    it('should throw NOT_FOUND for non-existent deal', async () => {
      mockPrisma.deal.findUnique.mockResolvedValue(null);

      await expect(
        service.generateSuggestionsForDeal(TEST_IDS.deal, TEST_IDS.org)
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('should throw NOT_FOUND for deal in different org', async () => {
      mockPrisma.deal.findUnique.mockResolvedValue(
        createMockDeal({ organizationId: 'clqdifferentorg123456789012' })
      );

      await expect(
        service.generateSuggestionsForDeal(TEST_IDS.deal, TEST_IDS.org)
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('should pass options to fact retrieval', async () => {
      const mockDeal = createMockDeal();
      mockPrisma.deal.findUnique.mockResolvedValue(mockDeal);
      mockPrisma.fact.findMany.mockResolvedValue([]);

      await service.generateSuggestionsForDeal(TEST_IDS.deal, TEST_IDS.org, {
        minConfidence: 0.9,
        maxSuggestions: 5,
      });

      expect(mockPrisma.fact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            confidence: { gte: 0.9 },
          }),
        })
      );
    });
  });
});
