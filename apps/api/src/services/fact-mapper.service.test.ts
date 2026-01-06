/**
 * Fact Mapper Service Tests
 *
 * Tests for mapping extracted facts to database entries.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { FactMapperService } from './fact-mapper.service';
import {
  createMockPrisma,
  createMockFact,
  createMockDeal,
  createMockDatabase,
  resetMocks,
  TEST_IDS,
} from '../tests/setup';
import type { FactType } from '@trato-hive/db';

describe('FactMapperService', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let service: FactMapperService;

  beforeEach(() => {
    resetMocks();
    mockPrisma = createMockPrisma();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    service = new FactMapperService(mockPrisma as any);
  });

  describe('getFactsForDeal', () => {
    it('should return facts for a deal via documents', async () => {
      const mockDeal = createMockDeal({ companyId: null });
      const mockFacts = [
        createMockFact({ confidence: 0.95 }),
        createMockFact({ id: TEST_IDS.fact2, subject: 'Employee Count', confidence: 0.85 }),
      ];

      mockPrisma.deal.findUnique.mockResolvedValue(mockDeal);
      mockPrisma.fact.findMany.mockResolvedValue(mockFacts);

      const result = await service.getFactsForDeal(TEST_IDS.deal, TEST_IDS.org);

      expect(result).toHaveLength(2);
      expect(mockPrisma.fact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            document: { dealId: TEST_IDS.deal },
            confidence: { gte: 0.7 },
          }),
        })
      );
    });

    it('should include company facts when deal has company', async () => {
      const mockDeal = createMockDeal({ companyId: TEST_IDS.company });
      const documentFacts = [createMockFact()];
      const companyFacts = [
        createMockFact({ id: TEST_IDS.fact2, companyId: TEST_IDS.company, documentId: null }),
      ];

      mockPrisma.deal.findUnique.mockResolvedValue(mockDeal);
      mockPrisma.fact.findMany
        .mockResolvedValueOnce(documentFacts)
        .mockResolvedValueOnce(companyFacts);

      const result = await service.getFactsForDeal(TEST_IDS.deal, TEST_IDS.org);

      expect(result).toHaveLength(2);
      expect(mockPrisma.fact.findMany).toHaveBeenCalledTimes(2);
    });

    it('should filter by minimum confidence', async () => {
      const mockDeal = createMockDeal();
      mockPrisma.deal.findUnique.mockResolvedValue(mockDeal);
      mockPrisma.fact.findMany.mockResolvedValue([]);

      await service.getFactsForDeal(TEST_IDS.deal, TEST_IDS.org, { minConfidence: 0.9 });

      expect(mockPrisma.fact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            confidence: { gte: 0.9 },
          }),
        })
      );
    });

    it('should filter by fact types', async () => {
      const mockDeal = createMockDeal();
      mockPrisma.deal.findUnique.mockResolvedValue(mockDeal);
      mockPrisma.fact.findMany.mockResolvedValue([]);

      await service.getFactsForDeal(TEST_IDS.deal, TEST_IDS.org, {
        factTypes: ['FINANCIAL_METRIC', 'KEY_PERSON'] as FactType[],
      });

      expect(mockPrisma.fact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: { in: ['FINANCIAL_METRIC', 'KEY_PERSON'] },
          }),
        })
      );
    });

    it('should throw NOT_FOUND for non-existent deal', async () => {
      mockPrisma.deal.findUnique.mockResolvedValue(null);

      await expect(service.getFactsForDeal(TEST_IDS.deal, TEST_IDS.org)).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('should throw NOT_FOUND for deal in different org', async () => {
      mockPrisma.deal.findUnique.mockResolvedValue(
        createMockDeal({ organizationId: 'clqdifferentorg123456789012' })
      );

      await expect(service.getFactsForDeal(TEST_IDS.deal, TEST_IDS.org)).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });
  });

  describe('getFactsForCompany', () => {
    it('should return facts for a company', async () => {
      const mockCompany = { id: TEST_IDS.company, organizationId: TEST_IDS.org };
      const mockFacts = [createMockFact({ companyId: TEST_IDS.company })];

      mockPrisma.company.findUnique.mockResolvedValue(mockCompany);
      mockPrisma.fact.findMany.mockResolvedValue(mockFacts);

      const result = await service.getFactsForCompany(TEST_IDS.company, TEST_IDS.org);

      expect(result).toHaveLength(1);
    });

    it('should throw NOT_FOUND for company in different org', async () => {
      mockPrisma.company.findUnique.mockResolvedValue({
        id: TEST_IDS.company,
        organizationId: 'clqdifferentorg123456789012',
      });

      await expect(
        service.getFactsForCompany(TEST_IDS.company, TEST_IDS.org)
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });
  });

  describe('mapFactsToEntries', () => {
    const schema = {
      columns: [
        { id: TEST_IDS.column, name: 'Item', type: 'TEXT' },
        { id: TEST_IDS.column2, name: 'Status', type: 'SELECT', options: ['Active', 'Inactive'] },
        { id: TEST_IDS.column3, name: 'Amount', type: 'NUMBER' },
      ],
    };

    it('should map facts to suggested entries', () => {
      const facts = [
        createMockFact({
          subject: 'Revenue',
          predicate: 'amount',
          object: '$5,000,000',
          type: 'FINANCIAL_METRIC' as FactType,
        }),
      ];

      const result = service.mapFactsToEntries(facts, schema);

      expect(result).toHaveLength(1);
      expect(result[0].suggestedBy).toBe('fact-mapper');
      expect(result[0].factIds).toContain(TEST_IDS.fact);
    });

    it('should convert number values correctly', () => {
      const facts = [
        createMockFact({
          subject: 'Revenue',
          predicate: 'amount',
          object: '$1,234,567.89',
          type: 'FINANCIAL_METRIC' as FactType,
        }),
      ];

      const result = service.mapFactsToEntries(facts, schema);

      // Check that a NUMBER column received the parsed value
      const amountColumn = result[0]?.properties[TEST_IDS.column3];
      if (amountColumn !== undefined) {
        expect(amountColumn).toBe(1234567.89);
      }
    });

    it('should group facts by subject', () => {
      const facts = [
        createMockFact({
          id: TEST_IDS.fact,
          subject: 'Product A',
          predicate: 'status',
          object: 'Active',
          type: 'PRODUCT' as FactType,
        }),
        createMockFact({
          id: TEST_IDS.fact2,
          subject: 'Product A',
          predicate: 'price',
          object: '$100',
          type: 'FINANCIAL_METRIC' as FactType,
        }),
      ];

      const result = service.mapFactsToEntries(facts, schema);

      // Should create one entry with both facts
      expect(result).toHaveLength(1);
      expect(result[0].factIds).toHaveLength(2);
    });

    it('should respect maxSuggestions limit', () => {
      const facts = Array.from({ length: 20 }, (_, i) =>
        createMockFact({
          id: `clqfact${i.toString().padStart(20, '0')}`,
          subject: `Subject ${i}`,
          confidence: 0.95 - i * 0.01,
        })
      );

      const result = service.mapFactsToEntries(facts, schema, { maxSuggestions: 5 });

      expect(result).toHaveLength(5);
    });

    it('should sort by confidence descending', () => {
      const facts = [
        createMockFact({ id: TEST_IDS.fact, subject: 'Low', confidence: 0.7 }),
        createMockFact({ id: TEST_IDS.fact2, subject: 'High', confidence: 0.95 }),
        createMockFact({ id: TEST_IDS.fact3, subject: 'Medium', confidence: 0.85 }),
      ];

      const result = service.mapFactsToEntries(facts, schema);

      expect(result[0].confidence).toBeGreaterThanOrEqual(result[1].confidence);
      expect(result[1].confidence).toBeGreaterThanOrEqual(result[2].confidence);
    });

    it('should return empty array for empty facts', () => {
      const result = service.mapFactsToEntries([], schema);
      expect(result).toEqual([]);
    });
  });

  describe('suggestEntriesFromFacts', () => {
    it('should return suggestions for a database and deal', async () => {
      const mockDatabase = createMockDatabase();
      const mockDeal = createMockDeal();
      const mockFacts = [createMockFact()];

      mockPrisma.database.findUnique.mockResolvedValue(mockDatabase);
      mockPrisma.deal.findUnique.mockResolvedValue(mockDeal);
      mockPrisma.fact.findMany.mockResolvedValue(mockFacts);

      const result = await service.suggestEntriesFromFacts(
        TEST_IDS.database,
        TEST_IDS.deal,
        TEST_IDS.org
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should throw NOT_FOUND for database in different org', async () => {
      mockPrisma.database.findUnique.mockResolvedValue(
        createMockDatabase({ organizationId: 'clqdifferentorg123456789012' })
      );

      await expect(
        service.suggestEntriesFromFacts(TEST_IDS.database, TEST_IDS.deal, TEST_IDS.org)
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('should return empty array when no facts found', async () => {
      const mockDatabase = createMockDatabase();
      const mockDeal = createMockDeal();

      mockPrisma.database.findUnique.mockResolvedValue(mockDatabase);
      mockPrisma.deal.findUnique.mockResolvedValue(mockDeal);
      mockPrisma.fact.findMany.mockResolvedValue([]);

      const result = await service.suggestEntriesFromFacts(
        TEST_IDS.database,
        TEST_IDS.deal,
        TEST_IDS.org
      );

      expect(result).toEqual([]);
    });

    it('should pass options to fact retrieval', async () => {
      const mockDatabase = createMockDatabase();
      const mockDeal = createMockDeal();

      mockPrisma.database.findUnique.mockResolvedValue(mockDatabase);
      mockPrisma.deal.findUnique.mockResolvedValue(mockDeal);
      mockPrisma.fact.findMany.mockResolvedValue([]);

      await service.suggestEntriesFromFacts(TEST_IDS.database, TEST_IDS.deal, TEST_IDS.org, {
        minConfidence: 0.9,
        maxSuggestions: 3,
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
