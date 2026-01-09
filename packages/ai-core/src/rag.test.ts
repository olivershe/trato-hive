/**
 * RAG Service Unit Tests
 */
import { describe, it, expect } from 'vitest';
import {
  createRAGService,
  type RetrievedChunk,
  type FactRecord,
  type RAGContext,
  PROMPT_TEMPLATES,
} from './rag';

describe('RAGService', () => {
  describe('extractCitationIndices', () => {
    it('should extract single citation', () => {
      const service = createRAGService();
      const result = service.extractCitationIndices('The revenue is $10M [1].');

      expect(result).toEqual([1]);
    });

    it('should extract multiple citations', () => {
      const service = createRAGService();
      const result = service.extractCitationIndices(
        'Revenue is $10M [1] and EBITDA is $2M [2]. Growth rate is 15% [3].'
      );

      expect(result).toEqual([1, 2, 3]);
    });

    it('should return unique indices only', () => {
      const service = createRAGService();
      const result = service.extractCitationIndices(
        'Revenue is $10M [1]. This is confirmed [1] again.'
      );

      expect(result).toEqual([1]);
    });

    it('should return sorted indices', () => {
      const service = createRAGService();
      const result = service.extractCitationIndices(
        'EBITDA is $2M [3] and Revenue is $10M [1]. Margin is 20% [2].'
      );

      expect(result).toEqual([1, 2, 3]);
    });

    it('should handle no citations', () => {
      const service = createRAGService();
      const result = service.extractCitationIndices('No citations here.');

      expect(result).toEqual([]);
    });

    it('should handle multi-digit citations', () => {
      const service = createRAGService();
      const result = service.extractCitationIndices('Fact [10] and [123].');

      expect(result).toEqual([10, 123]);
    });
  });

  describe('extractCitationsWithPositions', () => {
    it('should extract citations with positions', () => {
      const service = createRAGService();
      const result = service.extractCitationsWithPositions('Revenue is $10M [1].');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        index: 1,
        startOffset: 16,
        endOffset: 19,
        text: '[1]',
      });
    });

    it('should handle multiple citations', () => {
      const service = createRAGService();
      const result = service.extractCitationsWithPositions('A [1] and B [2].');

      expect(result).toHaveLength(2);
      expect(result[0].index).toBe(1);
      expect(result[1].index).toBe(2);
    });
  });

  describe('validateCitations', () => {
    it('should validate all citations are within range', () => {
      const service = createRAGService();
      const result = service.validateCitations('Fact [1] and [2] and [3].', 5);

      expect(result.valid).toBe(true);
      expect(result.invalidIndices).toEqual([]);
    });

    it('should detect out-of-range citations', () => {
      const service = createRAGService();
      const result = service.validateCitations('Fact [1] and [10].', 3);

      expect(result.valid).toBe(false);
      expect(result.invalidIndices).toEqual([10]);
    });

    it('should detect zero citations as invalid', () => {
      const service = createRAGService();
      const result = service.validateCitations('Fact [0] is invalid.', 3);

      expect(result.valid).toBe(false);
      expect(result.invalidIndices).toEqual([0]);
    });
  });

  describe('cleanInvalidCitations', () => {
    it('should remove out-of-range citations', () => {
      const service = createRAGService();
      const result = service.cleanInvalidCitations('Fact [1] and [10].', 3);

      expect(result).toBe('Fact [1] and .');
    });

    it('should keep valid citations', () => {
      const service = createRAGService();
      const result = service.cleanInvalidCitations('Fact [1] and [2] and [3].', 3);

      expect(result).toBe('Fact [1] and [2] and [3].');
    });
  });

  describe('mapChunksToCitations', () => {
    const mockChunks: RetrievedChunk[] = [
      {
        id: 'chunk-1',
        content: 'Revenue was $10 million in FY2024.',
        score: 0.95,
        metadata: {
          documentId: 'doc-1',
          documentName: 'Annual Report.pdf',
          pageNumber: 5,
          organizationId: 'org-1',
        },
      },
      {
        id: 'chunk-2',
        content: 'EBITDA margin improved to 20%.',
        score: 0.88,
        metadata: {
          documentId: 'doc-1',
          documentName: 'Annual Report.pdf',
          pageNumber: 10,
          organizationId: 'org-1',
        },
      },
    ];

    it('should map citation indices to chunk attributes', () => {
      const service = createRAGService();
      const result = service.mapChunksToCitations([1, 2], mockChunks);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        factId: 'chunk-1',
        sourceText: 'Revenue was $10 million in FY2024.',
        confidence: 0.95,
        documentName: 'Annual Report.pdf',
        subject: 'Reference',
        predicate: 'from',
        object: 'Annual Report.pdf',
      });
    });

    it('should filter invalid indices', () => {
      const service = createRAGService();
      const result = service.mapChunksToCitations([1, 5, 10], mockChunks);

      expect(result).toHaveLength(1);
      expect(result[0].factId).toBe('chunk-1');
    });
  });

  describe('mapFactsToCitations', () => {
    const mockFacts: FactRecord[] = [
      {
        id: 'fact-1',
        type: 'FINANCIAL_METRIC',
        subject: 'Revenue',
        predicate: 'is',
        object: '$10M',
        confidence: 0.95,
        sourceText: 'Annual revenue of $10M',
        documentId: 'doc-1',
        documentName: 'Financials.pdf',
      },
      {
        id: 'fact-2',
        type: 'FINANCIAL_METRIC',
        subject: 'EBITDA',
        predicate: 'is',
        object: '$2M',
        confidence: 0.88,
        sourceText: 'EBITDA of $2M',
        documentId: 'doc-1',
        documentName: 'Financials.pdf',
      },
    ];

    it('should map fact indices to CitationAttributes', () => {
      const service = createRAGService();
      const result = service.mapFactsToCitations([1, 2], mockFacts);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        factId: 'fact-1',
        sourceText: 'Annual revenue of $10M',
        confidence: 0.95,
        documentName: 'Financials.pdf',
        subject: 'Revenue',
        predicate: 'is',
        object: '$10M',
      });
    });

    it('should use generated sourceText when null', () => {
      const factsWithNullSource: FactRecord[] = [
        {
          ...mockFacts[0],
          sourceText: null,
        },
      ];

      const service = createRAGService();
      const result = service.mapFactsToCitations([1], factsWithNullSource);

      expect(result[0].sourceText).toBe('Revenue is $10M');
    });
  });

  describe('processResponse', () => {
    it('should process response with chunks', () => {
      const service = createRAGService();
      const context: RAGContext = {
        query: 'What is the revenue?',
        chunks: [
          {
            id: 'chunk-1',
            content: 'Revenue was $10M.',
            score: 0.95,
            metadata: {
              documentId: 'doc-1',
              documentName: 'Report.pdf',
              organizationId: 'org-1',
            },
          },
        ],
      };

      const result = service.processResponse(
        'The revenue is $10M [1].',
        context
      );

      expect(result.answer).toBe('The revenue is $10M [1].');
      expect(result.citationIndices).toEqual([1]);
      expect(result.citations).toHaveLength(1);
    });

    it('should prefer facts over chunks when available', () => {
      const service = createRAGService();
      const context: RAGContext = {
        query: 'What is the revenue?',
        chunks: [
          {
            id: 'chunk-1',
            content: 'Some text',
            score: 0.9,
            metadata: {
              documentId: 'doc-1',
              documentName: 'Report.pdf',
              organizationId: 'org-1',
            },
          },
        ],
        facts: [
          {
            id: 'fact-1',
            type: 'FINANCIAL_METRIC',
            subject: 'Revenue',
            predicate: 'is',
            object: '$10M',
            confidence: 0.95,
            sourceText: 'Revenue of $10M',
            documentId: 'doc-1',
            documentName: 'Report.pdf',
          },
        ],
      };

      const result = service.processResponse(
        'The revenue is $10M [1].',
        context
      );

      expect(result.citations[0].factId).toBe('fact-1');
      expect(result.citations[0].subject).toBe('Revenue');
    });
  });

  describe('buildContextPrompt', () => {
    it('should build prompt with numbered citations', () => {
      const service = createRAGService();
      const context: RAGContext = {
        query: 'What is the revenue?',
        chunks: [
          {
            id: 'chunk-1',
            content: 'Revenue was $10M.',
            score: 0.95,
            metadata: {
              documentId: 'doc-1',
              documentName: 'Report.pdf',
              pageNumber: 5,
              organizationId: 'org-1',
            },
          },
        ],
      };

      const result = service.buildContextPrompt(context);

      expect(result).toContain('[1] Revenue was $10M.');
      expect(result).toContain('Source: Report.pdf (Page 5)');
      expect(result).toContain('QUESTION: What is the revenue?');
    });
  });

  describe('buildFactBasedPrompt', () => {
    it('should build prompt with facts', () => {
      const service = createRAGService();
      const context: RAGContext = {
        query: 'What is the revenue?',
        chunks: [],
        facts: [
          {
            id: 'fact-1',
            type: 'FINANCIAL_METRIC',
            subject: 'Revenue',
            predicate: 'is',
            object: '$10M',
            confidence: 0.95,
            sourceText: 'Annual revenue of $10M',
            documentId: 'doc-1',
            documentName: 'Financials.pdf',
          },
        ],
      };

      const result = service.buildFactBasedPrompt(context);

      expect(result).toContain('[1] Revenue is $10M');
      expect(result).toContain('Confidence: 95%');
      expect(result).toContain('Source: Financials.pdf');
    });

    it('should fallback to chunk prompt when no facts', () => {
      const service = createRAGService();
      const context: RAGContext = {
        query: 'What is the revenue?',
        chunks: [
          {
            id: 'chunk-1',
            content: 'Revenue was $10M.',
            score: 0.95,
            metadata: {
              documentId: 'doc-1',
              documentName: 'Report.pdf',
              organizationId: 'org-1',
            },
          },
        ],
      };

      const result = service.buildFactBasedPrompt(context);

      expect(result).toContain('[1] Revenue was $10M.');
    });
  });

  describe('PROMPT_TEMPLATES', () => {
    it('should have all expected templates', () => {
      expect(PROMPT_TEMPLATES.DILIGENCE_QA).toBeDefined();
      expect(PROMPT_TEMPLATES.FINANCIAL_ANALYSIS).toBeDefined();
      expect(PROMPT_TEMPLATES.LEGAL_REVIEW).toBeDefined();
      expect(PROMPT_TEMPLATES.SUMMARIZATION).toBeDefined();
    });
  });
});
