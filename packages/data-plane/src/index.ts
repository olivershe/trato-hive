/**
 * @trato-hive/data-plane
 *
 * Data ingestion, document processing, and storage layer (Layer 1).
 * Provides S3 storage, Reducto AI parsing, and BullMQ job queue.
 */

// Storage
export {
  StorageClient,
  StorageError,
  createStorageClient,
  createStorageClientFromEnv,
  storageConfigSchema,
  SUPPORTED_MIME_TYPES,
  MAX_FILE_SIZE,
  type StorageConfig,
  type UploadOptions,
  type UploadResult,
  type PresignedUrlOptions,
  type FileMetadata,
  type StorageErrorCode,
} from './storage';

// Reducto AI
export {
  ReductoClient,
  ReductoError,
  createReductoClient,
  createReductoClientFromEnv,
  reductoConfigSchema,
  type ReductoConfig,
  type ReductoConfigInput,
  type ParseDocumentOptions,
  type BoundingBox,
  type ParsedChunk,
  type ParsedTable,
  type DocumentMetadata,
  type ReductoParseResult,
  type ReductoJobStatus,
  type ReductoErrorCode,
} from './reducto';

// Queue
export {
  DocumentQueue,
  DocumentQueueWorker,
  createDocumentQueue,
  createDocumentQueueFromEnv,
  createDocumentQueueWorker,
  queueConfigSchema,
  type QueueConfig,
  type QueueConfigInput,
  type WorkerConfig,
  type DocumentProcessingJob,
  type EmbeddingJob,
  type FactExtractionJob,
  type ReindexJob,
  type DeleteDocumentJob,
  type DataPlaneJob,
  type JobResult,
  type JobHandler,
} from './queue';
