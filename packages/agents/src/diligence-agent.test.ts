/**
 * Diligence Agent Tests
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { DiligenceAgent, DiligenceAgentError } from './diligence-agent';
import type { DiligenceAgentDependencies, DiligenceQuery } from './diligence-agent';

// =============================================================================
// Mock Dependencies
// =============================================================================

function createMockDependencies(): DiligenceAgentDependencies {
  return {
    vectorStore: {
      search: vi.fn(),
    } as unknown as DiligenceAgentDependencies['vectorStore'],
    embeddings: {
      generateEmbedding: vi.fn(),
    } as unknown as DiligenceAgentDependencies['embeddings'],
    llmClient: {
      generate: vi.fn(),
    } as unknown as DiligenceAgentDependencies['llmClient'],
    db: {
      deal: {
        findUnique: vi.fn(),
      },
      fact: {
        findMany: vi.fn(),
      },
    } as unknown as DiligenceAgentDependencies['db'],
  };
}

function createMockSearchResults(count: number = 3) {
  return Array.from({ length: count }, (_, i) => ({
    id: `chunk-${i + 1}`,
    content: `This is content from chunk ${i + 1}. It contains important information.`,
    score: 0.9 - i * 0.1,
    metadata: {
      documentId: `doc-${i + 1}`,
      documentName: `Document ${i + 1}.pdf`,
      organizationId: 'org-123',
      pageNumber: i + 1,
    },
  }));
}

function createMockLLMResponse(answer: string = 'The company has revenue of $10M [1].') {
  return {
    content: answer,
    model: 'claude-sonnet-4-5-20250514',
    tokensUsed: { prompt: 500, completion: 100, total: 600 },
    cost: 0.0012,
    latencyMs: 1500,
    provider: 'claude' as const,
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('DiligenceAgent', () => {
  let deps: DiligenceAgentDependencies;
  let agent: DiligenceAgent;

  beforeEach(() => {
    deps = createMockDependencies();
    agent = new DiligenceAgent(deps);
  });

  describe('constructor', () => {
    it('should create agent with default config', () => {
      expect(agent).toBeInstanceOf(DiligenceAgent);
    });

    it('should create agent with custom config', () => {
      const customAgent = new DiligenceAgent(deps, {
        topK: 5,
        minScore: 0.7,
        temperature: 0.1,
      });
      expect(customAgent).toBeInstanceOf(DiligenceAgent);
    });
  });

  describe('answerQuestion', () => {
    const baseQuery: DiligenceQuery = {
      question: 'What is the company revenue?',
      organizationId: 'org-123',
    };

    it('should answer question successfully', async () => {
      // Setup mocks
      (deps.embeddings.generateEmbedding as Mock).mockResolvedValue([0.1, 0.2, 0.3]);
      (deps.vectorStore.search as Mock).mockResolvedValue(createMockSearchResults());
      (deps.llmClient.generate as Mock).mockResolvedValue(createMockLLMResponse());

      // Execute
      const result = await agent.answerQuestion(baseQuery);

      // Assert
      expect(result.answer).toContain('$10M');
      expect(result.citationIndices).toContain(1);
      expect(result.metadata.chunksRetrieved).toBe(3);
      expect(result.metadata.llmResponse.model).toBe('claude-sonnet-4-5-20250514');
      expect(result.metadata.processingTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should generate embedding for the question', async () => {
      (deps.embeddings.generateEmbedding as Mock).mockResolvedValue([0.1, 0.2]);
      (deps.vectorStore.search as Mock).mockResolvedValue([]);
      (deps.llmClient.generate as Mock).mockResolvedValue(createMockLLMResponse('I cannot find this information.'));

      await agent.answerQuestion(baseQuery);

      expect(deps.embeddings.generateEmbedding).toHaveBeenCalledWith('What is the company revenue?');
    });

    it('should search vector store with correct parameters', async () => {
      (deps.embeddings.generateEmbedding as Mock).mockResolvedValue([0.1, 0.2]);
      (deps.vectorStore.search as Mock).mockResolvedValue([]);
      (deps.llmClient.generate as Mock).mockResolvedValue(createMockLLMResponse('No info.'));

      await agent.answerQuestion(baseQuery);

      expect(deps.vectorStore.search).toHaveBeenCalledWith(
        [0.1, 0.2],
        'org-123',
        expect.objectContaining({
          topK: 10,
          minScore: 0.5,
        })
      );
    });

    it('should filter by document IDs when provided', async () => {
      (deps.embeddings.generateEmbedding as Mock).mockResolvedValue([0.1, 0.2]);
      (deps.vectorStore.search as Mock).mockResolvedValue([]);
      (deps.llmClient.generate as Mock).mockResolvedValue(createMockLLMResponse('No info.'));

      await agent.answerQuestion({
        ...baseQuery,
        documentIds: ['doc-specific'],
      });

      expect(deps.vectorStore.search).toHaveBeenCalledWith(
        [0.1, 0.2],
        'org-123',
        expect.objectContaining({
          filter: { documentId: 'doc-specific' },
        })
      );
    });

    it('should retrieve facts when companyId is provided', async () => {
      (deps.embeddings.generateEmbedding as Mock).mockResolvedValue([0.1, 0.2]);
      (deps.vectorStore.search as Mock).mockResolvedValue([]);
      (deps.db!.fact.findMany as Mock).mockResolvedValue([
        {
          id: 'fact-1',
          type: 'FINANCIAL_METRIC',
          subject: 'Company',
          predicate: 'has revenue of',
          object: '$10M',
          confidence: 0.9,
          sourceText: 'Revenue is $10M',
          documentId: 'doc-1',
          document: { name: 'Report.pdf' },
        },
      ]);
      (deps.llmClient.generate as Mock).mockResolvedValue(createMockLLMResponse());

      const result = await agent.answerQuestion({
        ...baseQuery,
        companyId: 'company-123',
      });

      expect(deps.db!.fact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { companyId: 'company-123' },
        })
      );
      expect(result.metadata.factsRetrieved).toBe(1);
    });

    it('should handle multiple citations in answer', async () => {
      (deps.embeddings.generateEmbedding as Mock).mockResolvedValue([0.1, 0.2]);
      (deps.vectorStore.search as Mock).mockResolvedValue(createMockSearchResults(3));
      (deps.llmClient.generate as Mock).mockResolvedValue(
        createMockLLMResponse('Revenue is $10M [1] and EBITDA is $2M [2]. Growth rate is 20% [3].')
      );

      const result = await agent.answerQuestion(baseQuery);

      expect(result.citationIndices).toEqual([1, 2, 3]);
      expect(result.citations.length).toBe(3);
    });

    it('should include correct metadata in response', async () => {
      (deps.embeddings.generateEmbedding as Mock).mockResolvedValue([0.1, 0.2]);
      (deps.vectorStore.search as Mock).mockResolvedValue(createMockSearchResults(5));
      (deps.llmClient.generate as Mock).mockResolvedValue({
        ...createMockLLMResponse(),
        tokensUsed: { prompt: 1000, completion: 200, total: 1200 },
        cost: 0.0024,
        latencyMs: 2000,
      });

      const result = await agent.answerQuestion(baseQuery);

      expect(result.metadata).toEqual({
        chunksRetrieved: 5,
        factsRetrieved: 0,
        llmResponse: {
          model: 'claude-sonnet-4-5-20250514',
          tokensUsed: 1200,
          cost: 0.0024,
          latencyMs: 2000,
        },
        processingTimeMs: expect.any(Number),
      });
    });
  });

  describe('generateReport', () => {
    it('should throw error when db is not configured', async () => {
      const agentWithoutDb = new DiligenceAgent({
        ...deps,
        db: undefined,
      });

      await expect(
        agentWithoutDb.generateReport('deal-123', 'org-123')
      ).rejects.toThrow(DiligenceAgentError);
    });

    it('should throw error when deal not found', async () => {
      (deps.db!.deal.findUnique as Mock).mockResolvedValue(null);

      await expect(
        agent.generateReport('deal-not-found', 'org-123')
      ).rejects.toThrow(DiligenceAgentError);
    });

    it('should generate report with all sections', async () => {
      (deps.db!.deal.findUnique as Mock).mockResolvedValue({
        id: 'deal-123',
        name: 'Test Deal',
        companyId: 'company-123',
        company: { id: 'company-123', name: 'Test Company' },
      });
      (deps.embeddings.generateEmbedding as Mock).mockResolvedValue([0.1, 0.2]);
      (deps.vectorStore.search as Mock).mockResolvedValue(createMockSearchResults(2));
      (deps.db!.fact.findMany as Mock).mockResolvedValue([]);
      (deps.llmClient.generate as Mock).mockResolvedValue(
        createMockLLMResponse('Section content with [1] citation.')
      );

      const report = await agent.generateReport('deal-123', 'org-123');

      expect(report.dealId).toBe('deal-123');
      expect(report.dealName).toBe('Test Deal');
      expect(report.sections.length).toBe(6); // All predefined sections
      expect(report.sections[0].title).toBe('Company Overview');
      expect(report.generatedAt).toBeInstanceOf(Date);
      expect(report.metadata.processingTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should handle section generation errors gracefully', async () => {
      (deps.db!.deal.findUnique as Mock).mockResolvedValue({
        id: 'deal-123',
        name: 'Test Deal',
        companyId: null,
      });
      (deps.embeddings.generateEmbedding as Mock).mockResolvedValue([0.1, 0.2]);
      (deps.vectorStore.search as Mock).mockResolvedValue([]);
      (deps.llmClient.generate as Mock)
        .mockResolvedValueOnce(createMockLLMResponse('First section'))
        .mockRejectedValueOnce(new Error('LLM error'))
        .mockResolvedValue(createMockLLMResponse('Remaining sections'));

      const report = await agent.generateReport('deal-123', 'org-123');

      // Should still generate all sections, with error for failed one
      expect(report.sections.length).toBe(6);
      expect(report.sections[1].content).toContain('Unable to generate');
    });
  });

  describe('canAnswer', () => {
    const baseQuery: DiligenceQuery = {
      question: 'What is the EBITDA?',
      organizationId: 'org-123',
    };

    it('should return true when sufficient relevant chunks exist', async () => {
      (deps.embeddings.generateEmbedding as Mock).mockResolvedValue([0.1, 0.2]);
      (deps.vectorStore.search as Mock).mockResolvedValue(
        createMockSearchResults(3).map(r => ({ ...r, score: 0.8 }))
      );

      const result = await agent.canAnswer(baseQuery);

      expect(result.canAnswer).toBe(true);
      expect(result.relevantChunks).toBe(3);
      expect(result.confidence).toBeCloseTo(0.8);
    });

    it('should return false when no relevant chunks', async () => {
      (deps.embeddings.generateEmbedding as Mock).mockResolvedValue([0.1, 0.2]);
      (deps.vectorStore.search as Mock).mockResolvedValue([]);

      const result = await agent.canAnswer(baseQuery);

      expect(result.canAnswer).toBe(false);
      expect(result.relevantChunks).toBe(0);
      expect(result.confidence).toBe(0);
    });

    it('should return false when confidence is too low', async () => {
      (deps.embeddings.generateEmbedding as Mock).mockResolvedValue([0.1, 0.2]);
      (deps.vectorStore.search as Mock).mockResolvedValue(
        createMockSearchResults(3).map(r => ({ ...r, score: 0.4 }))
      );

      const result = await agent.canAnswer(baseQuery);

      expect(result.canAnswer).toBe(false);
      expect(result.confidence).toBeCloseTo(0.4);
    });
  });

  describe('askFollowUp', () => {
    it('should include previous answer in follow-up context', async () => {
      (deps.embeddings.generateEmbedding as Mock).mockResolvedValue([0.1, 0.2]);
      (deps.vectorStore.search as Mock).mockResolvedValue(createMockSearchResults(2));
      (deps.llmClient.generate as Mock).mockResolvedValue(
        createMockLLMResponse('Follow-up answer [1].')
      );

      await agent.askFollowUp(
        'What about the EBITDA?',
        'The revenue is $10M.',
        [],
        { organizationId: 'org-123' }
      );

      expect(deps.llmClient.generate).toHaveBeenCalled();
      const prompt = (deps.llmClient.generate as Mock).mock.calls[0][0];
      expect(prompt).toContain('Previous answer');
      expect(prompt).toContain('Follow-up question');
    });
  });
});

describe('DiligenceAgentError', () => {
  it('should create error with code', () => {
    const error = new DiligenceAgentError('Test error', 'DEAL_NOT_FOUND');
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('DEAL_NOT_FOUND');
    expect(error.name).toBe('DiligenceAgentError');
  });

  it('should include cause error', () => {
    const cause = new Error('Original error');
    const error = new DiligenceAgentError('Wrapped error', 'UNKNOWN', cause);
    expect(error.cause).toBe(cause);
  });
});
