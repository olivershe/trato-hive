/**
 * Vector Store Unit Tests
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VectorStore, createVectorStore, createVectorStoreFromEnv } from './vector-store';
import type { VectorDocument } from './types';

// Mock Pinecone
const mockNamespace = {
  upsert: vi.fn().mockResolvedValue(undefined),
  query: vi.fn().mockResolvedValue({ matches: [] }),
  deleteMany: vi.fn().mockResolvedValue(undefined),
  deleteAll: vi.fn().mockResolvedValue(undefined),
  fetch: vi.fn().mockResolvedValue({ records: {} }),
};

const mockIndex = {
  namespace: vi.fn().mockReturnValue(mockNamespace),
  describeIndexStats: vi.fn().mockResolvedValue({
    dimension: 3072,
    namespaces: {},
  }),
};

vi.mock('@pinecone-database/pinecone', () => ({
  Pinecone: vi.fn().mockImplementation(() => ({
    index: vi.fn().mockReturnValue(mockIndex),
  })),
}));

describe('VectorStore', () => {
  let vectorStore: VectorStore;
  const config = {
    apiKey: 'test-api-key',
    indexName: 'test-index',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vectorStore = createVectorStore(config);
  });

  describe('constructor', () => {
    it('should create a vector store with config', () => {
      expect(vectorStore).toBeInstanceOf(VectorStore);
    });

    it('should use default dimension of 3072', () => {
      const store = new VectorStore(config);
      expect(store).toBeInstanceOf(VectorStore);
    });

    it('should accept custom dimension', () => {
      const store = new VectorStore({ ...config, dimension: 1536 });
      expect(store).toBeInstanceOf(VectorStore);
    });
  });

  describe('upsert', () => {
    it('should upsert documents to namespace', async () => {
      const documents: VectorDocument[] = [
        {
          id: 'doc-1',
          content: 'Test content',
          embedding: new Array(3072).fill(0.1),
          metadata: {
            documentId: 'doc-1',
            documentName: 'Test.pdf',
            organizationId: 'org-1',
          },
        },
      ];

      const result = await vectorStore.upsert(documents, 'org-1');

      expect(mockIndex.namespace).toHaveBeenCalledWith('org-1');
      expect(mockNamespace.upsert).toHaveBeenCalled();
      expect(result.upsertedCount).toBe(1);
    });

    it('should return 0 for empty documents array', async () => {
      const result = await vectorStore.upsert([], 'org-1');
      expect(result.upsertedCount).toBe(0);
    });

    it('should batch upsert for large arrays', async () => {
      const documents: VectorDocument[] = Array.from({ length: 150 }, (_, i) => ({
        id: `doc-${i}`,
        content: `Content ${i}`,
        embedding: new Array(3072).fill(0.1),
        metadata: {
          documentId: `doc-${i}`,
          documentName: `Test${i}.pdf`,
          organizationId: 'org-1',
        },
      }));

      const result = await vectorStore.upsert(documents, 'org-1');

      // Should be called twice (100 + 50)
      expect(mockNamespace.upsert).toHaveBeenCalledTimes(2);
      expect(result.upsertedCount).toBe(150);
    });
  });

  describe('search', () => {
    beforeEach(() => {
      mockNamespace.query.mockResolvedValue({
        matches: [
          {
            id: 'doc-1',
            score: 0.9,
            metadata: {
              content: 'Test content',
              documentId: 'doc-1',
              documentName: 'Test.pdf',
              organizationId: 'org-1',
              pageNumber: 5,
            },
          },
          {
            id: 'doc-2',
            score: 0.7,
            metadata: {
              content: 'Other content',
              documentId: 'doc-2',
              documentName: 'Other.pdf',
              organizationId: 'org-1',
            },
          },
        ],
      });
    });

    it('should search for similar documents', async () => {
      const embedding = new Array(3072).fill(0.1);
      const results = await vectorStore.search(embedding, 'org-1');

      expect(mockIndex.namespace).toHaveBeenCalledWith('org-1');
      expect(mockNamespace.query).toHaveBeenCalledWith(
        expect.objectContaining({
          vector: embedding,
          topK: 10,
          includeMetadata: true,
        })
      );
      expect(results).toHaveLength(2);
    });

    it('should filter by minimum score', async () => {
      const embedding = new Array(3072).fill(0.1);
      const results = await vectorStore.search(embedding, 'org-1', {
        minScore: 0.8,
      });

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('doc-1');
    });

    it('should apply custom topK', async () => {
      const embedding = new Array(3072).fill(0.1);
      await vectorStore.search(embedding, 'org-1', { topK: 5 });

      expect(mockNamespace.query).toHaveBeenCalledWith(
        expect.objectContaining({ topK: 5 })
      );
    });

    it('should apply filter by documentId', async () => {
      const embedding = new Array(3072).fill(0.1);
      await vectorStore.search(embedding, 'org-1', {
        filter: { documentId: 'doc-1' },
      });

      expect(mockNamespace.query).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { documentId: { $eq: 'doc-1' } },
        })
      );
    });

    it('should parse metadata correctly', async () => {
      const embedding = new Array(3072).fill(0.1);
      const results = await vectorStore.search(embedding, 'org-1');

      expect(results[0].metadata).toEqual({
        documentId: 'doc-1',
        documentName: 'Test.pdf',
        organizationId: 'org-1',
        pageNumber: 5,
        chunkIndex: undefined,
        boundingBox: undefined,
      });
    });
  });

  describe('searchByQuery', () => {
    it('should search with query and embedding', async () => {
      const embedding = new Array(3072).fill(0.1);
      mockNamespace.query.mockResolvedValue({ matches: [] });

      await vectorStore.searchByQuery('test query', embedding, 'org-1');

      expect(mockNamespace.query).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete documents by IDs', async () => {
      await vectorStore.delete(['doc-1', 'doc-2'], 'org-1');

      expect(mockNamespace.deleteMany).toHaveBeenCalledWith(['doc-1', 'doc-2']);
    });
  });

  describe('deleteByDocumentId', () => {
    it('should find and delete all chunks for a document', async () => {
      mockNamespace.query.mockResolvedValue({
        matches: [{ id: 'chunk-1' }, { id: 'chunk-2' }],
      });

      await vectorStore.deleteByDocumentId('doc-1', 'org-1');

      expect(mockNamespace.query).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { documentId: { $eq: 'doc-1' } },
        })
      );
      expect(mockNamespace.deleteMany).toHaveBeenCalledWith(['chunk-1', 'chunk-2']);
    });

    it('should not call delete if no matches found', async () => {
      mockNamespace.query.mockResolvedValue({ matches: [] });

      await vectorStore.deleteByDocumentId('doc-1', 'org-1');

      expect(mockNamespace.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe('deleteNamespace', () => {
    it('should delete all vectors in namespace', async () => {
      await vectorStore.deleteNamespace('org-1');

      expect(mockNamespace.deleteAll).toHaveBeenCalled();
    });
  });

  describe('fetch', () => {
    it('should fetch vectors by IDs', async () => {
      mockNamespace.fetch.mockResolvedValue({
        records: {
          'doc-1': {
            id: 'doc-1',
            metadata: {
              content: 'Test content',
              documentId: 'doc-1',
              documentName: 'Test.pdf',
              organizationId: 'org-1',
            },
          },
        },
      });

      const results = await vectorStore.fetch(['doc-1'], 'org-1');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('doc-1');
      expect(results[0].score).toBe(1.0);
    });
  });

  describe('getStats', () => {
    it('should return namespace statistics', async () => {
      mockIndex.describeIndexStats.mockResolvedValue({
        dimension: 3072,
        namespaces: {
          'org-1': { recordCount: 100 },
        },
      });

      const stats = await vectorStore.getStats('org-1');

      expect(stats.vectorCount).toBe(100);
      expect(stats.dimension).toBe(3072);
    });

    it('should return 0 for empty namespace', async () => {
      mockIndex.describeIndexStats.mockResolvedValue({
        dimension: 3072,
        namespaces: {},
      });

      const stats = await vectorStore.getStats('org-1');

      expect(stats.vectorCount).toBe(0);
    });
  });
});

describe('createVectorStoreFromEnv', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should throw if PINECONE_API_KEY is missing', () => {
    delete process.env.PINECONE_API_KEY;
    process.env.PINECONE_INDEX_NAME = 'test-index';

    expect(() => createVectorStoreFromEnv()).toThrow('PINECONE_API_KEY');
  });

  it('should throw if PINECONE_INDEX_NAME is missing', () => {
    process.env.PINECONE_API_KEY = 'test-key';
    delete process.env.PINECONE_INDEX_NAME;

    expect(() => createVectorStoreFromEnv()).toThrow('PINECONE_INDEX_NAME');
  });

  it('should create store from environment variables', () => {
    process.env.PINECONE_API_KEY = 'test-key';
    process.env.PINECONE_INDEX_NAME = 'test-index';

    const store = createVectorStoreFromEnv();
    expect(store).toBeInstanceOf(VectorStore);
  });
});
