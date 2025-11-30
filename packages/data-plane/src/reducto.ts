/**
 * Reducto AI API client for document parsing
 */

export interface ReductoConfig {
  apiKey: string;
  apiUrl?: string;
}

export interface ParseDocumentOptions {
  chunkMode?: 'variable' | 'page' | 'block';
  chunkSize?: number;
}

export interface ReductoParseResponse {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  data?: {
    chunks: Array<{
      content: string;
      pageNumber?: number;
      boundingBox?: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
    }>;
    metadata?: Record<string, unknown>;
  };
}

export class ReductoClient {
  constructor(_config: ReductoConfig) {
    // Client will be initialized when implementing actual Reducto API calls
    // axios.create({ baseURL: config.apiUrl || 'https://api.reducto.ai/v1', ... })
  }

  /**
   * Parse a document (placeholder implementation)
   */
  async parseDocument(
    _fileUrl: string,
    _options?: ParseDocumentOptions
  ): Promise<ReductoParseResponse> {
    // TODO: Implement actual Reducto API call
    // This is a placeholder for POC
    throw new Error('Reducto API integration not yet implemented');
  }

  /**
   * Get job status (placeholder implementation)
   */
  async getJobStatus(_jobId: string): Promise<ReductoParseResponse> {
    // TODO: Implement actual Reducto API call
    throw new Error('Reducto API integration not yet implemented');
  }
}

export const createReductoClient = (config: ReductoConfig): ReductoClient => {
  return new ReductoClient(config);
};
