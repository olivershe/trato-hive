/**
 * Document Agent Tests
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { DocumentAgent, DocumentAgentError } from './document-agent';
import type { DocumentAgentDependencies } from './document-agent';

// =============================================================================
// Mock Dependencies
// =============================================================================

function createMockDependencies(): DocumentAgentDependencies {
  return {
    db: {
      document: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      documentChunk: {
        create: vi.fn(),
        findMany: vi.fn(),
        deleteMany: vi.fn(),
        update: vi.fn(),
      },
      fact: {
        create: vi.fn(),
        deleteMany: vi.fn(),
      },
    } as unknown as DocumentAgentDependencies['db'],
    storage: {
      getPresignedUrl: vi.fn(),
    } as unknown as DocumentAgentDependencies['storage'],
    reducto: {
      parseDocument: vi.fn(),
    } as unknown as DocumentAgentDependencies['reducto'],
    vectorStore: {
      upsert: vi.fn(),
      delete: vi.fn(),
    } as unknown as DocumentAgentDependencies['vectorStore'],
    embeddings: {
      generateEmbeddings: vi.fn(),
    } as unknown as DocumentAgentDependencies['embeddings'],
    factExtractor: {
      extractFacts: vi.fn(),
    } as unknown as DocumentAgentDependencies['factExtractor'],
  };
}

function createMockDocument(overrides: Partial<{
  id: string;
  name: string;
  fileUrl: string;
  organizationId: string;
  companyId: string | null;
  status: string;
}> = {}) {
  return {
    id: 'doc-123',
    name: 'test-document.pdf',
    fileUrl: 's3://bucket/doc.pdf',
    organizationId: 'org-456',
    companyId: 'company-789',
    status: 'UPLOADING',
    ...overrides,
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('DocumentAgent', () => {
  let deps: DocumentAgentDependencies;
  let agent: DocumentAgent;

  beforeEach(() => {
    deps = createMockDependencies();
    agent = new DocumentAgent(deps);
  });

  describe('constructor', () => {
    it('should create agent with default config', () => {
      expect(agent).toBeInstanceOf(DocumentAgent);
    });

    it('should create agent with custom config', () => {
      const customAgent = new DocumentAgent(deps, {
        chunkBatchSize: 5,
        maxFactsPerChunk: 10,
      });
      expect(customAgent).toBeInstanceOf(DocumentAgent);
    });
  });

  describe('processDocument', () => {
    it('should process document successfully', async () => {
      // Setup mocks
      const mockDoc = createMockDocument();
      (deps.db.document.findUnique as Mock).mockResolvedValue(mockDoc);
      (deps.db.document.update as Mock).mockResolvedValue(mockDoc);
      (deps.storage.getPresignedUrl as Mock).mockResolvedValue('https://presigned.url');
      (deps.reducto.parseDocument as Mock).mockResolvedValue({
        chunks: [
          { content: 'Test content', pageNumber: 1, index: 0 },
        ],
      });
      (deps.db.documentChunk.create as Mock).mockResolvedValue({
        id: 'chunk-1',
        content: 'Test content',
        pageNumber: 1,
        chunkIndex: 0,
      });
      (deps.embeddings.generateEmbeddings as Mock).mockResolvedValue([[0.1, 0.2, 0.3]]);
      (deps.vectorStore.upsert as Mock).mockResolvedValue({ upsertedCount: 1 });
      (deps.db.documentChunk.update as Mock).mockResolvedValue({});
      (deps.factExtractor.extractFacts as Mock).mockResolvedValue([]);

      // Execute
      const result = await agent.processDocument('doc-123');

      // Assert
      expect(result.status).toBe('success');
      expect(result.documentId).toBe('doc-123');
      expect(result.chunksCreated).toBe(1);
      expect(result.chunksEmbedded).toBe(1);
      expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);

      // Verify status updates
      expect(deps.db.document.update).toHaveBeenCalledWith({
        where: { id: 'doc-123' },
        data: { status: 'PROCESSING' },
      });
      expect(deps.db.document.update).toHaveBeenCalledWith({
        where: { id: 'doc-123' },
        data: { status: 'PARSED' },
      });
      expect(deps.db.document.update).toHaveBeenCalledWith({
        where: { id: 'doc-123' },
        data: { status: 'INDEXED' },
      });
    });

    it('should return failed status when document not found', async () => {
      (deps.db.document.findUnique as Mock).mockResolvedValue(null);

      const result = await agent.processDocument('doc-not-found');

      expect(result.status).toBe('failed');
      expect(result.error).toContain('Document not found');
    });

    it('should skip embeddings when option is set', async () => {
      const mockDoc = createMockDocument();
      (deps.db.document.findUnique as Mock).mockResolvedValue(mockDoc);
      (deps.db.document.update as Mock).mockResolvedValue(mockDoc);
      (deps.storage.getPresignedUrl as Mock).mockResolvedValue('https://presigned.url');
      (deps.reducto.parseDocument as Mock).mockResolvedValue({
        chunks: [{ content: 'Test', pageNumber: 1, index: 0 }],
      });
      (deps.db.documentChunk.create as Mock).mockResolvedValue({
        id: 'chunk-1',
        content: 'Test',
        pageNumber: 1,
        chunkIndex: 0,
      });
      (deps.factExtractor.extractFacts as Mock).mockResolvedValue([]);

      const result = await agent.processDocument('doc-123', { skipEmbeddings: true });

      expect(result.status).toBe('success');
      expect(result.chunksEmbedded).toBe(0);
      expect(deps.embeddings.generateEmbeddings).not.toHaveBeenCalled();
    });

    it('should skip facts when option is set', async () => {
      const mockDoc = createMockDocument();
      (deps.db.document.findUnique as Mock).mockResolvedValue(mockDoc);
      (deps.db.document.update as Mock).mockResolvedValue(mockDoc);
      (deps.storage.getPresignedUrl as Mock).mockResolvedValue('https://presigned.url');
      (deps.reducto.parseDocument as Mock).mockResolvedValue({
        chunks: [{ content: 'Test', pageNumber: 1, index: 0 }],
      });
      (deps.db.documentChunk.create as Mock).mockResolvedValue({
        id: 'chunk-1',
        content: 'Test',
        pageNumber: 1,
        chunkIndex: 0,
      });
      (deps.embeddings.generateEmbeddings as Mock).mockResolvedValue([[0.1, 0.2]]);
      (deps.vectorStore.upsert as Mock).mockResolvedValue({ upsertedCount: 1 });
      (deps.db.documentChunk.update as Mock).mockResolvedValue({});

      const result = await agent.processDocument('doc-123', { skipFacts: true });

      expect(result.status).toBe('success');
      expect(result.factsExtracted).toBe(0);
      expect(deps.factExtractor.extractFacts).not.toHaveBeenCalled();
    });

    it('should handle Reducto parsing error', async () => {
      const mockDoc = createMockDocument();
      (deps.db.document.findUnique as Mock).mockResolvedValue(mockDoc);
      (deps.db.document.update as Mock).mockResolvedValue(mockDoc);
      (deps.storage.getPresignedUrl as Mock).mockResolvedValue('https://presigned.url');
      (deps.reducto.parseDocument as Mock).mockRejectedValue(new Error('Parsing failed'));

      const result = await agent.processDocument('doc-123');

      expect(result.status).toBe('failed');
      expect(result.error).toBe('Parsing failed');
    });

    it('should extract and store facts', async () => {
      const mockDoc = createMockDocument();
      (deps.db.document.findUnique as Mock).mockResolvedValue(mockDoc);
      (deps.db.document.update as Mock).mockResolvedValue(mockDoc);
      (deps.storage.getPresignedUrl as Mock).mockResolvedValue('https://presigned.url');
      (deps.reducto.parseDocument as Mock).mockResolvedValue({
        chunks: [{ content: 'Revenue is $10M', pageNumber: 1, index: 0 }],
      });
      (deps.db.documentChunk.create as Mock).mockResolvedValue({
        id: 'chunk-1',
        content: 'Revenue is $10M',
        pageNumber: 1,
        chunkIndex: 0,
      });
      (deps.embeddings.generateEmbeddings as Mock).mockResolvedValue([[0.1, 0.2]]);
      (deps.vectorStore.upsert as Mock).mockResolvedValue({ upsertedCount: 1 });
      (deps.db.documentChunk.update as Mock).mockResolvedValue({});
      (deps.factExtractor.extractFacts as Mock).mockResolvedValue([
        {
          type: 'FINANCIAL_METRIC',
          subject: 'Company',
          predicate: 'has revenue of',
          object: '$10M',
          confidence: 0.9,
          sourceText: 'Revenue is $10M',
        },
      ]);
      (deps.db.fact.create as Mock).mockResolvedValue({ id: 'fact-1' });

      const result = await agent.processDocument('doc-123');

      expect(result.status).toBe('success');
      expect(result.factsExtracted).toBe(1);
      expect(deps.db.fact.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          documentId: 'doc-123',
          type: 'FINANCIAL_METRIC',
          subject: 'Company',
          predicate: 'has revenue of',
          object: '$10M',
          extractedBy: 'document-agent',
        }),
      });
    });
  });

  describe('reprocessDocument', () => {
    it('should delete existing chunks when reembedding', async () => {
      const mockDoc = createMockDocument();
      (deps.db.document.findUnique as Mock).mockResolvedValue(mockDoc);
      (deps.db.document.update as Mock).mockResolvedValue(mockDoc);
      (deps.db.documentChunk.findMany as Mock).mockResolvedValue([
        { id: 'chunk-1', vectorId: 'vec-1' },
      ]);
      (deps.vectorStore.delete as Mock).mockResolvedValue(undefined);
      (deps.db.documentChunk.deleteMany as Mock).mockResolvedValue({ count: 1 });
      (deps.storage.getPresignedUrl as Mock).mockResolvedValue('https://presigned.url');
      (deps.reducto.parseDocument as Mock).mockResolvedValue({ chunks: [] });

      await agent.reprocessDocument('doc-123', { reembed: true });

      expect(deps.vectorStore.delete).toHaveBeenCalledWith(['vec-1'], 'org-456');
      expect(deps.db.documentChunk.deleteMany).toHaveBeenCalled();
    });

    it('should delete existing facts when reextracting', async () => {
      const mockDoc = createMockDocument();
      (deps.db.document.findUnique as Mock).mockResolvedValue(mockDoc);
      (deps.db.document.update as Mock).mockResolvedValue(mockDoc);
      (deps.db.fact.deleteMany as Mock).mockResolvedValue({ count: 1 });
      (deps.storage.getPresignedUrl as Mock).mockResolvedValue('https://presigned.url');
      (deps.reducto.parseDocument as Mock).mockResolvedValue({ chunks: [] });

      await agent.reprocessDocument('doc-123', { reextractFacts: true });

      expect(deps.db.fact.deleteMany).toHaveBeenCalledWith({
        where: { documentId: 'doc-123' },
      });
    });
  });
});

describe('DocumentAgentError', () => {
  it('should create error with code', () => {
    const error = new DocumentAgentError('Test error', 'DOCUMENT_NOT_FOUND');
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('DOCUMENT_NOT_FOUND');
    expect(error.name).toBe('DocumentAgentError');
  });

  it('should include cause error', () => {
    const cause = new Error('Original error');
    const error = new DocumentAgentError('Wrapped error', 'UNKNOWN', cause);
    expect(error.cause).toBe(cause);
  });
});
