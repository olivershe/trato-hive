/**
 * Reducto AI Client
 *
 * Document parsing service that extracts text, tables, and structure from PDFs.
 * Uses Reducto.ai API for high-quality document understanding.
 *
 * @see https://docs.reducto.ai
 */
import axios, { type AxiosInstance, type AxiosError } from 'axios';
import { z } from 'zod';

// =============================================================================
// Types & Configuration
// =============================================================================

export const reductoConfigSchema = z.object({
  apiKey: z.string().min(1, 'Reducto API key is required'),
  apiUrl: z.string().url().optional().default('https://api.reducto.ai/v1'),
  timeoutMs: z.number().optional().default(60000), // 60 seconds default
});

// Input type allows optional fields
export type ReductoConfigInput = z.input<typeof reductoConfigSchema>;
// Output type has all defaults applied
export type ReductoConfig = z.output<typeof reductoConfigSchema>;

/**
 * Options for parsing a document
 */
export interface ParseDocumentOptions {
  /**
   * How to split the document into chunks
   * - 'page': One chunk per page
   * - 'block': Smart paragraph/section detection
   * - 'variable': Variable size based on semantic boundaries
   */
  chunkMode?: 'page' | 'block' | 'variable';

  /**
   * Target chunk size for 'variable' mode (in characters)
   */
  chunkSize?: number;

  /**
   * Extract tables as structured data
   */
  extractTables?: boolean;

  /**
   * Extract images with captions
   */
  extractImages?: boolean;

  /**
   * OCR language hint
   */
  language?: string;
}

/**
 * Bounding box for locating content in the original document
 */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
}

/**
 * A single chunk of extracted content
 */
export interface ParsedChunk {
  /** Chunk index (0-based) */
  index: number;

  /** The extracted text content */
  content: string;

  /** Page number (1-based) */
  pageNumber: number;

  /** Bounding box in the original document */
  boundingBox?: BoundingBox;

  /** Chunk type (paragraph, table, heading, etc.) */
  type?: 'paragraph' | 'heading' | 'table' | 'list' | 'caption' | 'footer' | 'header';

  /** Confidence score (0-1) */
  confidence?: number;
}

/**
 * Extracted table data
 */
export interface ParsedTable {
  /** Table index */
  index: number;

  /** Page number */
  pageNumber: number;

  /** Table headers */
  headers: string[];

  /** Table rows (each row is an array of cell values) */
  rows: string[][];

  /** Bounding box */
  boundingBox?: BoundingBox;
}

/**
 * Document metadata extracted during parsing
 */
export interface DocumentMetadata {
  /** Document title (if detected) */
  title?: string;

  /** Total page count */
  pageCount: number;

  /** Detected language */
  language?: string;

  /** Author (if in metadata) */
  author?: string;

  /** Creation date (if in metadata) */
  createdAt?: string;

  /** Word count */
  wordCount?: number;
}

/**
 * Complete parse result
 */
export interface ReductoParseResult {
  /** Unique job/document ID */
  documentId: string;

  /** Processing status */
  status: 'completed' | 'failed';

  /** Extracted text chunks */
  chunks: ParsedChunk[];

  /** Extracted tables */
  tables: ParsedTable[];

  /** Document metadata */
  metadata: DocumentMetadata;

  /** Processing duration in milliseconds */
  processingTimeMs: number;
}

/**
 * Job status response (for async processing)
 */
export interface ReductoJobStatus {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number; // 0-100
  result?: ReductoParseResult;
  error?: string;
}

// =============================================================================
// Reducto Client Class
// =============================================================================

export class ReductoClient {
  private readonly client: AxiosInstance;
  private readonly config: ReductoConfig;

  constructor(config: ReductoConfigInput) {
    this.config = reductoConfigSchema.parse(config);

    this.client = axios.create({
      baseURL: this.config.apiUrl,
      timeout: this.config.timeoutMs,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Parse a document from a URL (synchronous - waits for completion)
   *
   * @param fileUrl - Publicly accessible URL or presigned S3 URL
   * @param options - Parsing options
   * @returns Parsed document with chunks and metadata
   */
  async parseDocument(
    fileUrl: string,
    options: ParseDocumentOptions = {}
  ): Promise<ReductoParseResult> {
    const startTime = Date.now();

    try {
      const response = await this.client.post<ReductoAPIResponse>('/parse', {
        url: fileUrl,
        chunk_mode: options.chunkMode || 'block',
        chunk_size: options.chunkSize,
        extract_tables: options.extractTables ?? true,
        extract_images: options.extractImages ?? false,
        language: options.language,
      });

      return this.transformResponse(response.data, startTime);
    } catch (error) {
      throw this.classifyError(error as AxiosError);
    }
  }

  /**
   * Start async parsing (for large documents)
   * Returns a job ID that can be polled for status
   */
  async parseDocumentAsync(
    fileUrl: string,
    options: ParseDocumentOptions = {}
  ): Promise<{ jobId: string }> {
    try {
      const response = await this.client.post<{ job_id: string }>('/parse/async', {
        url: fileUrl,
        chunk_mode: options.chunkMode || 'block',
        chunk_size: options.chunkSize,
        extract_tables: options.extractTables ?? true,
        extract_images: options.extractImages ?? false,
        language: options.language,
      });

      return { jobId: response.data.job_id };
    } catch (error) {
      throw this.classifyError(error as AxiosError);
    }
  }

  /**
   * Get the status of an async parsing job
   */
  async getJobStatus(jobId: string): Promise<ReductoJobStatus> {
    try {
      const response = await this.client.get<ReductoAPIJobStatus>(`/jobs/${jobId}`);
      const data = response.data;

      const status: ReductoJobStatus = {
        jobId: data.job_id,
        status: data.status,
        progress: data.progress,
        error: data.error,
      };

      if (data.status === 'completed' && data.result) {
        status.result = this.transformResponse(data.result, 0);
      }

      return status;
    } catch (error) {
      throw this.classifyError(error as AxiosError);
    }
  }

  /**
   * Wait for a job to complete (with polling)
   */
  async waitForJob(
    jobId: string,
    options: { pollIntervalMs?: number; maxWaitMs?: number } = {}
  ): Promise<ReductoParseResult> {
    const pollInterval = options.pollIntervalMs || 2000;
    const maxWait = options.maxWaitMs || 300000; // 5 minutes
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      const status = await this.getJobStatus(jobId);

      if (status.status === 'completed' && status.result) {
        return status.result;
      }

      if (status.status === 'failed') {
        throw new ReductoError(
          status.error || 'Job failed without error message',
          'PROCESSING_FAILED'
        );
      }

      // Wait before polling again
      await this.sleep(pollInterval);
    }

    throw new ReductoError(
      `Job ${jobId} did not complete within ${maxWait}ms`,
      'TIMEOUT'
    );
  }

  /**
   * Parse a document uploaded as a buffer
   * (First uploads to Reducto's temporary storage)
   */
  async parseBuffer(
    buffer: Buffer,
    filename: string,
    options: ParseDocumentOptions = {}
  ): Promise<ReductoParseResult> {
    const startTime = Date.now();

    try {
      // Create form data for file upload
      const FormData = (await import('form-data')).default;
      const formData = new FormData();
      formData.append('file', buffer, filename);
      formData.append('chunk_mode', options.chunkMode || 'block');
      if (options.chunkSize) formData.append('chunk_size', options.chunkSize.toString());
      formData.append('extract_tables', (options.extractTables ?? true).toString());
      formData.append('extract_images', (options.extractImages ?? false).toString());
      if (options.language) formData.append('language', options.language);

      const response = await this.client.post<ReductoAPIResponse>('/parse/upload', formData, {
        headers: formData.getHeaders(),
        timeout: this.config.timeoutMs * 2, // Double timeout for uploads
      });

      return this.transformResponse(response.data, startTime);
    } catch (error) {
      throw this.classifyError(error as AxiosError);
    }
  }

  /**
   * Transform Reducto API response to our domain types
   */
  private transformResponse(data: ReductoAPIResponse, startTime: number): ReductoParseResult {
    const chunks: ParsedChunk[] = (data.chunks || []).map((chunk, index) => ({
      index,
      content: chunk.text,
      pageNumber: chunk.page_number,
      boundingBox: chunk.bounding_box ? {
        x: chunk.bounding_box.x,
        y: chunk.bounding_box.y,
        width: chunk.bounding_box.width,
        height: chunk.bounding_box.height,
        page: chunk.page_number,
      } : undefined,
      type: chunk.type as ParsedChunk['type'],
      confidence: chunk.confidence,
    }));

    const tables: ParsedTable[] = (data.tables || []).map((table, index) => ({
      index,
      pageNumber: table.page_number,
      headers: table.headers || [],
      rows: table.rows || [],
      boundingBox: table.bounding_box ? {
        x: table.bounding_box.x,
        y: table.bounding_box.y,
        width: table.bounding_box.width,
        height: table.bounding_box.height,
        page: table.page_number,
      } : undefined,
    }));

    return {
      documentId: data.document_id || data.job_id || '',
      status: 'completed',
      chunks,
      tables,
      metadata: {
        title: data.metadata?.title,
        pageCount: data.metadata?.page_count || 0,
        language: data.metadata?.language,
        author: data.metadata?.author,
        createdAt: data.metadata?.created_at,
        wordCount: data.metadata?.word_count,
      },
      processingTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Classify API errors into ReductoError
   */
  private classifyError(error: AxiosError): ReductoError {
    if (!error.response) {
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        return new ReductoError('Request timed out', 'TIMEOUT', error);
      }
      return new ReductoError('Network error', 'NETWORK_ERROR', error);
    }

    const status = error.response.status;
    const data = error.response.data as { error?: string; message?: string } | undefined;
    const message = data?.error || data?.message || error.message;

    switch (status) {
      case 400:
        return new ReductoError(`Invalid request: ${message}`, 'INVALID_REQUEST', error);
      case 401:
        return new ReductoError('Invalid API key', 'AUTHENTICATION_ERROR', error);
      case 403:
        return new ReductoError('Access forbidden', 'FORBIDDEN', error);
      case 404:
        return new ReductoError('Resource not found', 'NOT_FOUND', error);
      case 413:
        return new ReductoError('File too large', 'FILE_TOO_LARGE', error);
      case 422:
        return new ReductoError(`Unsupported document format: ${message}`, 'UNSUPPORTED_FORMAT', error);
      case 429:
        return new ReductoError('Rate limit exceeded', 'RATE_LIMIT', error);
      case 500:
      case 502:
      case 503:
      case 504:
        return new ReductoError(`Server error: ${message}`, 'SERVER_ERROR', error);
      default:
        return new ReductoError(`API error (${status}): ${message}`, 'UNKNOWN', error);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// =============================================================================
// Internal API Types (snake_case from Reducto API)
// =============================================================================

interface ReductoAPIResponse {
  document_id?: string;
  job_id?: string;
  chunks?: Array<{
    text: string;
    page_number: number;
    bounding_box?: { x: number; y: number; width: number; height: number };
    type?: string;
    confidence?: number;
  }>;
  tables?: Array<{
    page_number: number;
    headers?: string[];
    rows?: string[][];
    bounding_box?: { x: number; y: number; width: number; height: number };
  }>;
  metadata?: {
    title?: string;
    page_count?: number;
    language?: string;
    author?: string;
    created_at?: string;
    word_count?: number;
  };
}

interface ReductoAPIJobStatus {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  result?: ReductoAPIResponse;
  error?: string;
}

// =============================================================================
// Error Class
// =============================================================================

export type ReductoErrorCode =
  | 'INVALID_REQUEST'
  | 'AUTHENTICATION_ERROR'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'FILE_TOO_LARGE'
  | 'UNSUPPORTED_FORMAT'
  | 'RATE_LIMIT'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'PROCESSING_FAILED'
  | 'UNKNOWN';

export class ReductoError extends Error {
  constructor(
    message: string,
    public readonly code: ReductoErrorCode,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'ReductoError';
  }

  /**
   * Whether this error is retryable
   */
  get retryable(): boolean {
    return ['RATE_LIMIT', 'SERVER_ERROR', 'NETWORK_ERROR', 'TIMEOUT'].includes(this.code);
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a Reducto client with the specified configuration
 */
export function createReductoClient(config: ReductoConfigInput): ReductoClient {
  return new ReductoClient(config);
}

/**
 * Create a Reducto client from environment variables
 */
export function createReductoClientFromEnv(): ReductoClient {
  const apiKey = process.env.REDUCTO_API_KEY;

  if (!apiKey) {
    throw new ReductoError(
      'REDUCTO_API_KEY environment variable is required',
      'AUTHENTICATION_ERROR'
    );
  }

  return new ReductoClient({
    apiKey,
    apiUrl: process.env.REDUCTO_API_URL || 'https://api.reducto.ai/v1',
  });
}
