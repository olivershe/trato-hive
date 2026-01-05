/**
 * Embedding Service Unit Tests
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  EmbeddingService,
  createEmbeddingService,
  createEmbeddingServiceFromEnv,
} from './embeddings';

// Mock OpenAIEmbeddings
const mockEmbedQuery = vi.fn().mockResolvedValue(new Array(3072).fill(0.1));
const mockEmbedDocuments = vi.fn().mockResolvedValue([
  new Array(3072).fill(0.1),
  new Array(3072).fill(0.2),
]);

vi.mock('@langchain/openai', () => ({
  OpenAIEmbeddings: vi.fn().mockImplementation(() => ({
    embedQuery: mockEmbedQuery,
    embedDocuments: mockEmbedDocuments,
  })),
}));

describe('EmbeddingService', () => {
  let service: EmbeddingService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = createEmbeddingService();
  });

  describe('constructor', () => {
    it('should create with default settings', () => {
      const svc = new EmbeddingService();
      expect(svc.getModel()).toBe('text-embedding-3-large');
      expect(svc.getDimension()).toBe(3072);
    });

    it('should accept custom model', () => {
      const svc = new EmbeddingService({ model: 'text-embedding-3-small' });
      expect(svc.getModel()).toBe('text-embedding-3-small');
      expect(svc.getDimension()).toBe(1536);
    });

    it('should accept custom dimensions', () => {
      const svc = new EmbeddingService({
        model: 'text-embedding-3-large',
        dimensions: 1024,
      });
      expect(svc.getDimension()).toBe(1024);
    });
  });

  describe('generateEmbedding', () => {
    it('should generate embedding for text', async () => {
      const embedding = await service.generateEmbedding('Hello world');

      expect(mockEmbedQuery).toHaveBeenCalledWith('Hello world');
      expect(embedding).toHaveLength(3072);
    });

    it('should throw for empty text', async () => {
      await expect(service.generateEmbedding('')).rejects.toThrow(
        'Text cannot be empty'
      );
    });

    it('should throw for whitespace-only text', async () => {
      await expect(service.generateEmbedding('   ')).rejects.toThrow(
        'Text cannot be empty'
      );
    });
  });

  describe('generateEmbeddings', () => {
    it('should generate embeddings for multiple texts', async () => {
      const embeddings = await service.generateEmbeddings([
        'Hello',
        'World',
      ]);

      expect(mockEmbedDocuments).toHaveBeenCalledWith(['Hello', 'World']);
      expect(embeddings).toHaveLength(2);
    });

    it('should return empty array for empty input', async () => {
      const embeddings = await service.generateEmbeddings([]);
      expect(embeddings).toEqual([]);
    });

    it('should filter empty texts', async () => {
      mockEmbedDocuments.mockResolvedValueOnce([new Array(3072).fill(0.1)]);

      const embeddings = await service.generateEmbeddings([
        'Hello',
        '',
        '  ',
      ]);

      expect(mockEmbedDocuments).toHaveBeenCalledWith(['Hello']);
      expect(embeddings).toHaveLength(1);
    });

    it('should throw if all texts are empty', async () => {
      await expect(service.generateEmbeddings(['', '  '])).rejects.toThrow(
        'All texts are empty'
      );
    });

    it('should batch large arrays', async () => {
      // Create 150 texts (should be batched into 2 calls)
      const texts = Array.from({ length: 150 }, (_, i) => `Text ${i}`);

      mockEmbedDocuments
        .mockResolvedValueOnce(Array(100).fill(new Array(3072).fill(0.1)))
        .mockResolvedValueOnce(Array(50).fill(new Array(3072).fill(0.2)));

      const embeddings = await service.generateEmbeddings(texts);

      expect(mockEmbedDocuments).toHaveBeenCalledTimes(2);
      expect(embeddings).toHaveLength(150);
    });
  });

  describe('generateBatch', () => {
    it('should return embeddings with metadata', async () => {
      const result = await service.generateBatch({
        texts: ['Hello', 'World'],
      });

      expect(result.embeddings).toHaveLength(2);
      expect(result.model).toBe('text-embedding-3-large');
      expect(result.totalTokens).toBeGreaterThan(0);
    });

    it('should estimate tokens based on character count', async () => {
      const result = await service.generateBatch({
        texts: ['A'.repeat(100)], // 100 chars ~= 25 tokens
      });

      expect(result.totalTokens).toBe(25);
    });
  });

  describe('cosineSimilarity', () => {
    it('should calculate similarity between identical vectors', () => {
      const a = [1, 0, 0];
      const b = [1, 0, 0];

      const similarity = EmbeddingService.cosineSimilarity(a, b);
      expect(similarity).toBeCloseTo(1.0, 5);
    });

    it('should calculate similarity between orthogonal vectors', () => {
      const a = [1, 0, 0];
      const b = [0, 1, 0];

      const similarity = EmbeddingService.cosineSimilarity(a, b);
      expect(similarity).toBeCloseTo(0.0, 5);
    });

    it('should calculate similarity between opposite vectors', () => {
      const a = [1, 0, 0];
      const b = [-1, 0, 0];

      const similarity = EmbeddingService.cosineSimilarity(a, b);
      expect(similarity).toBeCloseTo(-1.0, 5);
    });

    it('should throw for different dimensions', () => {
      const a = [1, 0, 0];
      const b = [1, 0];

      expect(() => EmbeddingService.cosineSimilarity(a, b)).toThrow(
        'same dimension'
      );
    });

    it('should handle zero vectors', () => {
      const a = [0, 0, 0];
      const b = [1, 0, 0];

      const similarity = EmbeddingService.cosineSimilarity(a, b);
      expect(similarity).toBe(0);
    });
  });
});

describe('createEmbeddingServiceFromEnv', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should throw if OPENAI_API_KEY is missing', () => {
    delete process.env.OPENAI_API_KEY;

    expect(() => createEmbeddingServiceFromEnv()).toThrow('OPENAI_API_KEY');
  });

  it('should create service from environment variables', () => {
    process.env.OPENAI_API_KEY = 'test-key';

    const service = createEmbeddingServiceFromEnv();
    expect(service).toBeInstanceOf(EmbeddingService);
  });
});
