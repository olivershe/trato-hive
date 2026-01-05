/**
 * Fact Extractor Unit Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  FactExtractor,
  createFactExtractor,
  formatFact,
  groupFactsByType,
  sortFactsByConfidence,
  type LLMClient,
} from './facts';
import type { ExtractedFact, FactType } from './types';

// Mock LLM client
const mockGenerateJSON = vi.fn();
const mockLLMClient: LLMClient = {
  generateJSON: mockGenerateJSON,
};

// Mock Prisma client
const mockPrismaClient = {
  fact: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
};

describe('FactExtractor', () => {
  let extractor: FactExtractor;

  beforeEach(() => {
    vi.clearAllMocks();
    extractor = createFactExtractor({ llmClient: mockLLMClient });
  });

  describe('constructor', () => {
    it('should create extractor without dependencies', () => {
      const ext = new FactExtractor();
      expect(ext).toBeInstanceOf(FactExtractor);
    });

    it('should create extractor with LLM client', () => {
      const ext = new FactExtractor({ llmClient: mockLLMClient });
      expect(ext).toBeInstanceOf(FactExtractor);
    });

    it('should create extractor with database client', () => {
      const ext = new FactExtractor({ db: mockPrismaClient as unknown as import('@trato-hive/db').PrismaClient });
      expect(ext).toBeInstanceOf(FactExtractor);
    });
  });

  describe('extractFacts', () => {
    const mockFacts: ExtractedFact[] = [
      {
        type: 'FINANCIAL_METRIC',
        subject: 'Acme Corp',
        predicate: 'has revenue of',
        object: '$10 million',
        confidence: 0.95,
        sourceText: 'Acme Corp reported revenue of $10 million',
      },
      {
        type: 'KEY_PERSON',
        subject: 'John Smith',
        predicate: 'is CEO of',
        object: 'Acme Corp',
        confidence: 0.9,
        sourceText: 'John Smith, CEO of Acme Corp',
      },
    ];

    beforeEach(() => {
      mockGenerateJSON.mockResolvedValue({
        data: { facts: mockFacts },
        response: { model: 'claude-sonnet-4.5' },
      });
    });

    it('should extract facts from text', async () => {
      const facts = await extractor.extractFacts('Sample document text');

      expect(mockGenerateJSON).toHaveBeenCalled();
      expect(facts).toHaveLength(2);
      expect(facts[0].type).toBe('FINANCIAL_METRIC');
    });

    it('should return empty array for empty text', async () => {
      const facts = await extractor.extractFacts('');
      expect(facts).toEqual([]);
      expect(mockGenerateJSON).not.toHaveBeenCalled();
    });

    it('should return empty array for whitespace text', async () => {
      const facts = await extractor.extractFacts('   ');
      expect(facts).toEqual([]);
    });

    it('should filter facts below confidence threshold', async () => {
      mockGenerateJSON.mockResolvedValue({
        data: {
          facts: [
            { ...mockFacts[0], confidence: 0.5 }, // Below threshold
            { ...mockFacts[1], confidence: 0.8 }, // Above threshold
          ],
        },
        response: { model: 'claude-sonnet-4.5' },
      });

      const facts = await extractor.extractFacts('Sample text');
      expect(facts).toHaveLength(1);
      expect(facts[0].confidence).toBe(0.8);
    });

    it('should add page number from context', async () => {
      const facts = await extractor.extractFacts('Sample text', {
        pageNumber: 5,
      });

      expect(facts[0].pageNumber).toBe(5);
    });

    it('should handle LLM errors gracefully', async () => {
      mockGenerateJSON.mockRejectedValue(new Error('LLM error'));

      const facts = await extractor.extractFacts('Sample text');
      expect(facts).toEqual([]);
    });

    it('should throw if LLM client not configured', async () => {
      const extractorWithoutLLM = new FactExtractor();

      await expect(extractorWithoutLLM.extractFacts('text')).rejects.toThrow(
        'LLM client not configured'
      );
    });
  });

  describe('extractFactsFromChunks', () => {
    it('should extract facts from multiple chunks', async () => {
      mockGenerateJSON
        .mockResolvedValueOnce({
          data: {
            facts: [
              {
                type: 'FINANCIAL_METRIC',
                subject: 'Company',
                predicate: 'has revenue of',
                object: '$10M',
                confidence: 0.9,
                sourceText: 'Revenue is $10M',
              },
            ],
          },
          response: { model: 'claude' },
        })
        .mockResolvedValueOnce({
          data: {
            facts: [
              {
                type: 'KEY_PERSON',
                subject: 'John',
                predicate: 'is CEO of',
                object: 'Company',
                confidence: 0.8,
                sourceText: 'John is CEO',
              },
            ],
          },
          response: { model: 'claude' },
        });

      const result = await extractor.extractFactsFromChunks(
        [
          { content: 'Chunk 1', pageNumber: 1 },
          { content: 'Chunk 2', pageNumber: 2 },
        ],
        {
          documentId: 'doc-1',
          documentName: 'Test.pdf',
          organizationId: 'org-1',
        }
      );

      expect(result.facts).toHaveLength(2);
      expect(result.documentId).toBe('doc-1');
      expect(result.totalChunks).toBe(2);
      expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should deduplicate similar facts', async () => {
      const duplicateFact = {
        type: 'FINANCIAL_METRIC' as FactType,
        subject: 'Company',
        predicate: 'has revenue of',
        object: '$10M',
        confidence: 0.9,
        sourceText: 'Revenue is $10M',
      };

      mockGenerateJSON
        .mockResolvedValueOnce({
          data: { facts: [duplicateFact] },
          response: { model: 'claude' },
        })
        .mockResolvedValueOnce({
          data: { facts: [duplicateFact] }, // Same fact
          response: { model: 'claude' },
        });

      const result = await extractor.extractFactsFromChunks(
        [{ content: 'Chunk 1' }, { content: 'Chunk 2' }],
        {
          documentId: 'doc-1',
          documentName: 'Test.pdf',
          organizationId: 'org-1',
        }
      );

      expect(result.facts).toHaveLength(1);
    });
  });

  describe('storeFacts', () => {
    it('should throw if database not configured', async () => {
      await expect(
        extractor.storeFacts(
          [],
          {
            documentId: 'doc-1',
            documentName: 'Test.pdf',
            organizationId: 'org-1',
          },
          'claude'
        )
      ).rejects.toThrow('Database client not configured');
    });

    it('should store facts in database', async () => {
      const extractorWithDb = createFactExtractor({
        llmClient: mockLLMClient,
        db: mockPrismaClient as unknown as import('@trato-hive/db').PrismaClient,
      });

      mockPrismaClient.fact.create.mockResolvedValue({
        id: 'fact-1',
        type: 'FINANCIAL_METRIC',
        subject: 'Company',
        predicate: 'has revenue of',
        object: '$10M',
        confidence: 0.9,
        sourceText: 'Revenue is $10M',
        documentId: 'doc-1',
        companyId: 'company-1',
        extractedBy: 'claude',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const facts = await extractorWithDb.storeFacts(
        [
          {
            type: 'FINANCIAL_METRIC',
            subject: 'Company',
            predicate: 'has revenue of',
            object: '$10M',
            confidence: 0.9,
            sourceText: 'Revenue is $10M',
          },
        ],
        {
          documentId: 'doc-1',
          documentName: 'Test.pdf',
          organizationId: 'org-1',
          companyId: 'company-1',
        },
        'claude'
      );

      expect(mockPrismaClient.fact.create).toHaveBeenCalled();
      expect(facts).toHaveLength(1);
      expect(facts[0].id).toBe('fact-1');
    });
  });

  describe('getFactsByDocument', () => {
    it('should throw if database not configured', async () => {
      await expect(extractor.getFactsByDocument('doc-1')).rejects.toThrow(
        'Database client not configured'
      );
    });

    it('should fetch facts from database', async () => {
      const extractorWithDb = createFactExtractor({
        db: mockPrismaClient as unknown as import('@trato-hive/db').PrismaClient,
      });

      mockPrismaClient.fact.findMany.mockResolvedValue([
        {
          id: 'fact-1',
          type: 'FINANCIAL_METRIC',
          subject: 'Company',
          predicate: 'has revenue of',
          object: '$10M',
          confidence: 0.9,
          sourceText: 'Revenue is $10M',
          documentId: 'doc-1',
          companyId: null,
          extractedBy: 'claude',
          createdAt: new Date(),
        },
      ]);

      const facts = await extractorWithDb.getFactsByDocument('doc-1');

      expect(facts).toHaveLength(1);
      expect(facts[0].documentId).toBe('doc-1');
    });
  });

  describe('getFactsByCompany', () => {
    it('should fetch facts by company ID', async () => {
      const extractorWithDb = createFactExtractor({
        db: mockPrismaClient as unknown as import('@trato-hive/db').PrismaClient,
      });

      mockPrismaClient.fact.findMany.mockResolvedValue([]);

      await extractorWithDb.getFactsByCompany('company-1');

      expect(mockPrismaClient.fact.findMany).toHaveBeenCalledWith({
        where: { companyId: 'company-1' },
        orderBy: { confidence: 'desc' },
      });
    });
  });

  describe('validateFact', () => {
    it('should validate valid fact', () => {
      const fact: ExtractedFact = {
        type: 'FINANCIAL_METRIC',
        subject: 'Company',
        predicate: 'has revenue of',
        object: '$10M',
        confidence: 0.9,
        sourceText: 'Revenue is $10M',
      };

      expect(extractor.validateFact(fact)).toBe(true);
    });

    it('should reject low confidence fact', () => {
      const fact: ExtractedFact = {
        type: 'FINANCIAL_METRIC',
        subject: 'Company',
        predicate: 'has revenue of',
        object: '$10M',
        confidence: 0.5,
        sourceText: 'Revenue is $10M',
      };

      expect(extractor.validateFact(fact)).toBe(false);
    });

    it('should reject fact with empty subject', () => {
      const fact: ExtractedFact = {
        type: 'FINANCIAL_METRIC',
        subject: '',
        predicate: 'has revenue of',
        object: '$10M',
        confidence: 0.9,
        sourceText: 'Revenue is $10M',
      };

      expect(extractor.validateFact(fact)).toBe(false);
    });
  });
});

describe('Utility Functions', () => {
  describe('formatFact', () => {
    it('should format fact as readable string', () => {
      const fact: ExtractedFact = {
        type: 'FINANCIAL_METRIC',
        subject: 'Acme Corp',
        predicate: 'has revenue of',
        object: '$10 million',
        confidence: 0.9,
        sourceText: 'Revenue is $10M',
      };

      expect(formatFact(fact)).toBe('Acme Corp has revenue of $10 million');
    });
  });

  describe('groupFactsByType', () => {
    it('should group facts by type', () => {
      const facts: ExtractedFact[] = [
        {
          type: 'FINANCIAL_METRIC',
          subject: 'A',
          predicate: 'x',
          object: '1',
          confidence: 0.9,
          sourceText: 'a',
        },
        {
          type: 'KEY_PERSON',
          subject: 'B',
          predicate: 'y',
          object: '2',
          confidence: 0.8,
          sourceText: 'b',
        },
        {
          type: 'FINANCIAL_METRIC',
          subject: 'C',
          predicate: 'z',
          object: '3',
          confidence: 0.7,
          sourceText: 'c',
        },
      ];

      const groups = groupFactsByType(facts);

      expect(groups.FINANCIAL_METRIC).toHaveLength(2);
      expect(groups.KEY_PERSON).toHaveLength(1);
      expect(groups.PRODUCT).toHaveLength(0);
    });
  });

  describe('sortFactsByConfidence', () => {
    it('should sort facts by confidence descending', () => {
      const facts: ExtractedFact[] = [
        {
          type: 'OTHER',
          subject: 'A',
          predicate: 'x',
          object: '1',
          confidence: 0.5,
          sourceText: 'a',
        },
        {
          type: 'OTHER',
          subject: 'B',
          predicate: 'y',
          object: '2',
          confidence: 0.9,
          sourceText: 'b',
        },
        {
          type: 'OTHER',
          subject: 'C',
          predicate: 'z',
          object: '3',
          confidence: 0.7,
          sourceText: 'c',
        },
      ];

      const sorted = sortFactsByConfidence(facts);

      expect(sorted[0].confidence).toBe(0.9);
      expect(sorted[1].confidence).toBe(0.7);
      expect(sorted[2].confidence).toBe(0.5);
    });

    it('should not mutate original array', () => {
      const facts: ExtractedFact[] = [
        {
          type: 'OTHER',
          subject: 'A',
          predicate: 'x',
          object: '1',
          confidence: 0.5,
          sourceText: 'a',
        },
      ];

      const sorted = sortFactsByConfidence(facts);
      expect(sorted).not.toBe(facts);
    });
  });
});
