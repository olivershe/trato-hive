/**
 * Reducto Client Unit Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ReductoClient,
  ReductoError,
  createReductoClient,
  reductoConfigSchema,
} from './reducto';

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      post: vi.fn(),
      get: vi.fn(),
    })),
  },
}));

describe('ReductoClient', () => {
  describe('configuration', () => {
    it('should validate config with Zod', () => {
      const result = reductoConfigSchema.safeParse({
        apiKey: 'test-api-key',
      });

      expect(result.success).toBe(true);
    });

    it('should reject empty API key', () => {
      const result = reductoConfigSchema.safeParse({
        apiKey: '',
      });

      expect(result.success).toBe(false);
    });

    it('should use default API URL', () => {
      const result = reductoConfigSchema.parse({
        apiKey: 'test-key',
      });

      expect(result.apiUrl).toBe('https://api.reducto.ai/v1');
    });

    it('should use default timeout', () => {
      const result = reductoConfigSchema.parse({
        apiKey: 'test-key',
      });

      expect(result.timeoutMs).toBe(60000);
    });

    it('should accept custom API URL', () => {
      const result = reductoConfigSchema.parse({
        apiKey: 'test-key',
        apiUrl: 'https://custom.reducto.ai/v1',
      });

      expect(result.apiUrl).toBe('https://custom.reducto.ai/v1');
    });
  });

  describe('constructor', () => {
    it('should create client with valid config', () => {
      const client = new ReductoClient({
        apiKey: 'test-api-key',
      });

      expect(client).toBeInstanceOf(ReductoClient);
    });

    it('should throw on invalid config', () => {
      expect(() => {
        new ReductoClient({
          apiKey: '',
        });
      }).toThrow();
    });
  });

  describe('factory functions', () => {
    it('createReductoClient should create client', () => {
      const client = createReductoClient({
        apiKey: 'test-api-key',
      });

      expect(client).toBeInstanceOf(ReductoClient);
    });
  });
});

describe('ReductoError', () => {
  it('should create error with correct properties', () => {
    const error = new ReductoError('Invalid API key', 'AUTHENTICATION_ERROR');

    expect(error.message).toBe('Invalid API key');
    expect(error.code).toBe('AUTHENTICATION_ERROR');
    expect(error.name).toBe('ReductoError');
  });

  it('should include cause when provided', () => {
    const cause = new Error('Original error');
    const error = new ReductoError('Wrapper', 'UNKNOWN', cause);

    expect(error.cause).toBe(cause);
  });

  describe('retryable property', () => {
    it('should be true for RATE_LIMIT', () => {
      const error = new ReductoError('Rate limited', 'RATE_LIMIT');
      expect(error.retryable).toBe(true);
    });

    it('should be true for SERVER_ERROR', () => {
      const error = new ReductoError('Server error', 'SERVER_ERROR');
      expect(error.retryable).toBe(true);
    });

    it('should be true for NETWORK_ERROR', () => {
      const error = new ReductoError('Network error', 'NETWORK_ERROR');
      expect(error.retryable).toBe(true);
    });

    it('should be true for TIMEOUT', () => {
      const error = new ReductoError('Timeout', 'TIMEOUT');
      expect(error.retryable).toBe(true);
    });

    it('should be false for AUTHENTICATION_ERROR', () => {
      const error = new ReductoError('Auth error', 'AUTHENTICATION_ERROR');
      expect(error.retryable).toBe(false);
    });

    it('should be false for INVALID_REQUEST', () => {
      const error = new ReductoError('Invalid', 'INVALID_REQUEST');
      expect(error.retryable).toBe(false);
    });

    it('should be false for UNSUPPORTED_FORMAT', () => {
      const error = new ReductoError('Unsupported', 'UNSUPPORTED_FORMAT');
      expect(error.retryable).toBe(false);
    });
  });

  it('should have all error codes', () => {
    const codes = [
      'INVALID_REQUEST',
      'AUTHENTICATION_ERROR',
      'FORBIDDEN',
      'NOT_FOUND',
      'FILE_TOO_LARGE',
      'UNSUPPORTED_FORMAT',
      'RATE_LIMIT',
      'SERVER_ERROR',
      'NETWORK_ERROR',
      'TIMEOUT',
      'PROCESSING_FAILED',
      'UNKNOWN',
    ];

    codes.forEach((code) => {
      const error = new ReductoError('Test', code as ReductoError['code']);
      expect(error.code).toBe(code);
    });
  });
});

describe('parseDocument', () => {
  let client: ReductoClient;
  let mockPost: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    mockPost = vi.fn();
    const axios = await import('axios');
    (axios.default.create as ReturnType<typeof vi.fn>).mockReturnValue({
      post: mockPost,
      get: vi.fn(),
    });

    client = new ReductoClient({
      apiKey: 'test-key',
    });
  });

  it('should send correct request body', async () => {
    mockPost.mockResolvedValue({
      data: {
        document_id: 'doc-123',
        chunks: [],
        tables: [],
        metadata: { page_count: 5 },
      },
    });

    await client.parseDocument('https://example.com/file.pdf', {
      chunkMode: 'page',
      extractTables: true,
    });

    expect(mockPost).toHaveBeenCalledWith('/parse', expect.objectContaining({
      url: 'https://example.com/file.pdf',
      chunk_mode: 'page',
      extract_tables: true,
    }));
  });

  it('should transform API response correctly', async () => {
    mockPost.mockResolvedValue({
      data: {
        document_id: 'doc-123',
        chunks: [
          {
            text: 'Sample text content',
            page_number: 1,
            bounding_box: { x: 0, y: 0, width: 100, height: 50 },
            type: 'paragraph',
            confidence: 0.95,
          },
        ],
        tables: [
          {
            page_number: 2,
            headers: ['Col1', 'Col2'],
            rows: [['A', 'B'], ['C', 'D']],
          },
        ],
        metadata: {
          title: 'Test Document',
          page_count: 5,
          language: 'en',
          word_count: 500,
        },
      },
    });

    const result = await client.parseDocument('https://example.com/file.pdf');

    expect(result.documentId).toBe('doc-123');
    expect(result.status).toBe('completed');
    expect(result.chunks).toHaveLength(1);
    expect(result.chunks[0].content).toBe('Sample text content');
    expect(result.chunks[0].pageNumber).toBe(1);
    expect(result.chunks[0].type).toBe('paragraph');
    expect(result.chunks[0].confidence).toBe(0.95);
    expect(result.tables).toHaveLength(1);
    expect(result.tables[0].headers).toEqual(['Col1', 'Col2']);
    expect(result.metadata.title).toBe('Test Document');
    expect(result.metadata.pageCount).toBe(5);
  });

  it('should use default options when not provided', async () => {
    mockPost.mockResolvedValue({
      data: {
        document_id: 'doc-123',
        chunks: [],
        tables: [],
        metadata: { page_count: 1 },
      },
    });

    await client.parseDocument('https://example.com/file.pdf');

    expect(mockPost).toHaveBeenCalledWith('/parse', expect.objectContaining({
      chunk_mode: 'block',
      extract_tables: true,
      extract_images: false,
    }));
  });
});

describe('Error handling', () => {
  let client: ReductoClient;
  let mockPost: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    mockPost = vi.fn();
    const axios = await import('axios');
    (axios.default.create as ReturnType<typeof vi.fn>).mockReturnValue({
      post: mockPost,
      get: vi.fn(),
    });

    client = new ReductoClient({
      apiKey: 'test-key',
    });
  });

  it('should classify 401 as AUTHENTICATION_ERROR', async () => {
    const axiosError = {
      response: {
        status: 401,
        data: { error: 'Invalid API key' },
      },
      message: 'Request failed with status 401',
    };
    mockPost.mockRejectedValue(axiosError);

    await expect(client.parseDocument('https://example.com/file.pdf'))
      .rejects.toMatchObject({
        code: 'AUTHENTICATION_ERROR',
      });
  });

  it('should classify 429 as RATE_LIMIT', async () => {
    const axiosError = {
      response: {
        status: 429,
        data: { error: 'Too many requests' },
      },
      message: 'Request failed with status 429',
    };
    mockPost.mockRejectedValue(axiosError);

    await expect(client.parseDocument('https://example.com/file.pdf'))
      .rejects.toMatchObject({
        code: 'RATE_LIMIT',
      });
  });

  it('should classify 413 as FILE_TOO_LARGE', async () => {
    const axiosError = {
      response: {
        status: 413,
        data: { error: 'File exceeds size limit' },
      },
      message: 'Request failed with status 413',
    };
    mockPost.mockRejectedValue(axiosError);

    await expect(client.parseDocument('https://example.com/file.pdf'))
      .rejects.toMatchObject({
        code: 'FILE_TOO_LARGE',
      });
  });

  it('should classify 422 as UNSUPPORTED_FORMAT', async () => {
    const axiosError = {
      response: {
        status: 422,
        data: { error: 'Unsupported file type' },
      },
      message: 'Request failed with status 422',
    };
    mockPost.mockRejectedValue(axiosError);

    await expect(client.parseDocument('https://example.com/file.pdf'))
      .rejects.toMatchObject({
        code: 'UNSUPPORTED_FORMAT',
      });
  });

  it('should classify 500 as SERVER_ERROR', async () => {
    const axiosError = {
      response: {
        status: 500,
        data: { error: 'Internal server error' },
      },
      message: 'Request failed with status 500',
    };
    mockPost.mockRejectedValue(axiosError);

    await expect(client.parseDocument('https://example.com/file.pdf'))
      .rejects.toMatchObject({
        code: 'SERVER_ERROR',
      });
  });

  it('should classify timeout as TIMEOUT', async () => {
    const axiosError = {
      code: 'ECONNABORTED',
      message: 'timeout of 60000ms exceeded',
    };
    mockPost.mockRejectedValue(axiosError);

    await expect(client.parseDocument('https://example.com/file.pdf'))
      .rejects.toMatchObject({
        code: 'TIMEOUT',
      });
  });

  it('should classify network error as NETWORK_ERROR', async () => {
    const axiosError = {
      message: 'Network Error',
    };
    mockPost.mockRejectedValue(axiosError);

    await expect(client.parseDocument('https://example.com/file.pdf'))
      .rejects.toMatchObject({
        code: 'NETWORK_ERROR',
      });
  });
});

describe('Async job processing', () => {
  let client: ReductoClient;
  let mockPost: ReturnType<typeof vi.fn>;
  let mockGet: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    mockPost = vi.fn();
    mockGet = vi.fn();
    const axios = await import('axios');
    (axios.default.create as ReturnType<typeof vi.fn>).mockReturnValue({
      post: mockPost,
      get: mockGet,
    });

    client = new ReductoClient({
      apiKey: 'test-key',
    });
  });

  it('should start async parsing and return job ID', async () => {
    mockPost.mockResolvedValue({
      data: { job_id: 'job-456' },
    });

    const result = await client.parseDocumentAsync('https://example.com/file.pdf');

    expect(result.jobId).toBe('job-456');
  });

  it('should get job status', async () => {
    mockGet.mockResolvedValue({
      data: {
        job_id: 'job-456',
        status: 'processing',
        progress: 50,
      },
    });

    const status = await client.getJobStatus('job-456');

    expect(status.jobId).toBe('job-456');
    expect(status.status).toBe('processing');
    expect(status.progress).toBe(50);
  });

  it('should include result when job is completed', async () => {
    mockGet.mockResolvedValue({
      data: {
        job_id: 'job-456',
        status: 'completed',
        result: {
          document_id: 'doc-123',
          chunks: [{ text: 'Content', page_number: 1 }],
          tables: [],
          metadata: { page_count: 1 },
        },
      },
    });

    const status = await client.getJobStatus('job-456');

    expect(status.status).toBe('completed');
    expect(status.result).toBeDefined();
    expect(status.result?.chunks).toHaveLength(1);
  });

  it('should include error when job fails', async () => {
    mockGet.mockResolvedValue({
      data: {
        job_id: 'job-456',
        status: 'failed',
        error: 'Processing failed due to corrupted file',
      },
    });

    const status = await client.getJobStatus('job-456');

    expect(status.status).toBe('failed');
    expect(status.error).toBe('Processing failed due to corrupted file');
  });
});
