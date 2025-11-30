/**
 * Storage abstractions (placeholder for S3/file storage)
 */

export interface StorageConfig {
  provider: 'local' | 's3';
  bucket?: string;
}

export interface UploadResult {
  url: string;
  key: string;
  size: number;
}

export class StorageClient {
  constructor(_config: StorageConfig) {
    // Config will be used when implementing actual storage logic
  }

  async upload(_file: Buffer, _filename: string): Promise<UploadResult> {
    // TODO: Implement actual storage logic
    throw new Error('Storage upload not yet implemented');
  }

  async download(_key: string): Promise<Buffer> {
    // TODO: Implement actual storage logic
    throw new Error('Storage download not yet implemented');
  }

  async delete(_key: string): Promise<void> {
    // TODO: Implement actual storage logic
    throw new Error('Storage delete not yet implemented');
  }
}
