# Data Plane Package (@trato-hive/data-plane)

**Parent:** Root CLAUDE.md
**Purpose:** Document ingestion, parsing, OCR, storage, and job queue orchestration
**Last Updated:** 2025-11-18
**Layer Mapping:** Layer 1 (Data Plane) - Foundation layer for all document processing

---

## 1. Purpose

The Data Plane is the foundation of the Trato Hive stack. It handles:
- **Document Ingestion:** Accept files from UI, agents, or APIs with validation
- **Parsing & OCR:** Convert documents to machine-readable formats (Reducto AI primary, Tesseract.js fallback)
- **Storage:** Secure S3-based file storage with presigned URLs and multi-tenancy
- **Job Orchestration:** BullMQ-based async processing with retry logic
- **Error Handling:** Robust retry strategies and dead letter queues

This layer abstracts file handling complexity so semantic-layer and ai-core can focus on extracting verifiable facts.

**Reference:** `/docs/architecture/data-plane.md`

---

## 2. Ownership

**Owner:** Backend Team
**Shared Responsibility:**
- Document processing pipeline reliability
- S3 storage security and multi-tenancy
- Job queue monitoring and dead letter queue management
- Integration with semantic-layer for fact extraction

**Changes Requiring Approval:**
- New document format support
- S3 bucket configuration changes
- BullMQ retry strategy modifications
- Reducto API integration changes

---

## 3. Technology Stack

**Document Processing:**
- **Reducto AI** (primary) - Advanced document parsing with bounding boxes
- **Tesseract.js** (fallback) - OCR for cost optimization
- **pdf-parse** - PDF text extraction
- **xlsx** - Spreadsheet parsing

**Storage:**
- **AWS S3** - Object storage (via `@aws-sdk/client-s3`)
- Multi-tenant bucket segmentation by `firmId`
- Presigned URLs for secure downloads (1-hour expiry)

**Job Queues:**
- **BullMQ** 5.28.1 - Redis-backed job queues
- **IORedis** 5.4.2 - Redis client with auto-reconnect
- Exponential backoff retry (3 attempts)
- Dead letter queue for failed jobs

**Validation:**
- **Zod** 3.23.8 - Schema validation for inputs

**Build & Test:**
- **tsup** 8.3.5 - Dual output (CJS + ESM)
- **Vitest** 2.1.8 - Unit and integration tests
- **TypeScript** 5.6.3 (strict mode)

---

## 4. Architecture

### Directory Structure

```
packages/data-plane/src/
├── index.ts              # Package exports
├── storage.ts            # S3 client (upload, download, delete)
├── reducto.ts            # Reducto AI API client
├── queue.ts              # BullMQ job queue management
├── parsers/              # Format-specific parsers (TODO)
│   ├── pdf.ts           # PDF parser
│   ├── xlsx.ts          # Spreadsheet parser
│   └── email.ts         # Email parser (.msg, .eml)
└── validators/           # Input validation schemas (TODO)
    └── upload.ts        # File upload validation
```

### Data Flow

```
User Upload (apps/web)
    ↓
API Endpoint (apps/api) validates file
    ↓
data-plane.uploadDocument() → S3 staging bucket
    ↓
BullMQ job queued: "process-document"
    ↓
Worker picks up job
    ↓
Reducto AI parses document (or Tesseract.js fallback)
    ↓
Store metadata in database (via @trato-hive/db)
    ↓
Move file to permanent bucket (firmId/documentId)
    ↓
Trigger semantic-layer fact extraction
    ↓
Return documentId to client
```

---

## 5. Environment Variables

Required in `apps/api/.env`:

```bash
# Storage (AWS S3)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=trato-hive-documents
S3_STAGING_BUCKET=trato-hive-staging

# Document Processing
REDUCTO_API_KEY=your-reducto-api-key
REDUCTO_API_URL=https://api.reducto.ai/v1  # Optional, defaults to this

# Job Queue (Redis)
REDIS_URL=redis://localhost:6379
# Production: redis://user:password@redis-host:6379

# Processing Limits
MAX_FILE_SIZE_MB=100
ALLOWED_FILE_TYPES=pdf,xlsx,docx,msg,eml
```

**Security Notes:**
- Never commit `.env` files
- Use IAM roles in production (no hardcoded AWS keys)
- Rotate Reducto API keys quarterly
- Redis should require authentication in production

---

## 6. Exported Interfaces

### Storage Client

```typescript
import { StorageClient } from '@trato-hive/data-plane'

const storage = new StorageClient({
  provider: 's3',
  bucket: process.env.S3_BUCKET_NAME
})

// Upload a document
const result = await storage.upload(fileBuffer, 'deal-123/contract.pdf')
// Returns: { url: string, key: string, size: number }

// Download a document (returns presigned URL)
const buffer = await storage.download('deal-123/contract.pdf')

// Delete a document
await storage.delete('deal-123/contract.pdf')
```

### Reducto AI Client

```typescript
import { ReductoClient } from '@trato-hive/data-plane'

const reducto = new ReductoClient({
  apiKey: process.env.REDUCTO_API_KEY,
  apiUrl: process.env.REDUCTO_API_URL
})

// Parse a document (async job)
const response = await reducto.parseDocument(s3Url, {
  chunkMode: 'page',  // 'variable' | 'page' | 'block'
  chunkSize: 1000
})
// Returns: { jobId, status, data?: { chunks, metadata } }

// Poll for job completion
const status = await reducto.getJobStatus(response.jobId)
```

### Document Queue

```typescript
import { DocumentQueue } from '@trato-hive/data-plane'

const queue = new DocumentQueue({
  redisUrl: process.env.REDIS_URL
})

// Add a document processing job
const job = await queue.addDocumentProcessingJob({
  documentId: 'doc-123',
  fileUrl: 's3://bucket/key',
  organizationId: 'firm-456'
})

// Job is automatically retried 3 times with exponential backoff
// Failed jobs go to dead letter queue after max retries

// Close queue gracefully
await queue.close()
```

---

## 7. Supported Document Formats

| Format | Parser | Use Case | Extractable Data |
|--------|--------|----------|------------------|
| **PDF** | Reducto AI → Tesseract.js | Contracts, financial statements, IC decks | Text, tables, metadata, bounding boxes |
| **XLSX** | xlsx library | Financial models, data rooms | Tables, formulas, sheets |
| **DOCX** | Reducto AI | Memos, reports | Text, headings, tables |
| **EML/MSG** | mailparser | Email threads | Subject, body, attachments, headers |

**File Size Limits:**
- Max file size: 100 MB (configurable via `MAX_FILE_SIZE_MB`)
- Max batch upload: 50 files per request
- Supported compression: ZIP archives (auto-extracted)

**Validation Rules:**
- File type checked via MIME type (not just extension)
- Malware scanning recommended for production (e.g., ClamAV)
- Reject executable files (.exe, .sh, .bat)

---

## 8. Reducto AI Integration

### Workflow

1. **Upload to S3:** Document uploaded to staging bucket
2. **Submit to Reducto:** API call with S3 presigned URL
3. **Poll for Completion:** Check job status every 5 seconds (max 2 minutes)
4. **Process Results:** Extract text, bounding boxes, tables
5. **Store in Database:** Save metadata and chunks to Prisma

### Structured Extraction

Reducto returns:
```typescript
{
  chunks: [
    {
      content: "EBITDA: $12.5M",
      pageNumber: 3,
      boundingBox: {
        x: 100,
        y: 200,
        width: 150,
        height: 20
      }
    }
  ],
  metadata: {
    title: "Q4 Financial Report",
    author: "CFO",
    pageCount: 15,
    createdAt: "2024-01-15"
  }
}
```

**Bounding Boxes Enable:**
- Citation highlighting in UI (exact text location)
- Fact verification (link number to source)
- Document preview with highlighted excerpts

### Fallback to Tesseract.js

If Reducto fails (API down, unsupported format, rate limit):
1. Convert PDF to images via `pdf-parse`
2. Run Tesseract.js OCR (HOCR output for bounding boxes)
3. Clean OCR artifacts (whitespace, encoding)
4. Assign confidence score (flag low-confidence pages)
5. Store with `isOCR: true` flag in database

**Cost Optimization:**
- Use Reducto for critical documents (contracts, financials)
- Use Tesseract for high-volume, low-priority docs (emails, notes)
- Configure via `DOCUMENT_PARSER_STRATEGY` env var

---

## 9. S3 Storage Patterns

### Multi-Tenancy

**Bucket Structure:**
```
s3://trato-hive-documents/
├── firm-123/
│   ├── deal-456/
│   │   ├── contract.pdf
│   │   └── financial-model.xlsx
│   └── deal-789/
│       └── due-diligence-report.pdf
└── firm-999/
    └── ...
```

**Access Control:**
- Each firm has IAM policy restricting access to `firm-{id}/*` prefix
- Presigned URLs enforce 1-hour expiry
- All objects use AES-256 encryption at rest
- Object versioning enabled (protect against accidental deletes)

### Presigned URLs

**Upload (from client):**
```typescript
// apps/api generates presigned POST URL
const uploadUrl = await s3Client.createPresignedPost({
  Bucket: S3_STAGING_BUCKET,
  Key: `${firmId}/${documentId}`,
  Expires: 300, // 5 minutes
  Conditions: [
    ['content-length-range', 0, MAX_FILE_SIZE_MB * 1024 * 1024]
  ]
})

// Client uploads directly to S3 (no proxy through API)
```

**Download (to client):**
```typescript
// apps/api generates presigned GET URL
const downloadUrl = await s3Client.getSignedUrl('getObject', {
  Bucket: S3_BUCKET_NAME,
  Key: `${firmId}/${documentId}`,
  Expires: 3600 // 1 hour
})

// Client downloads directly from S3
```

---

## 10. BullMQ Job Queue Patterns

### Job Definition

```typescript
export interface DocumentProcessingJob {
  documentId: string;
  fileUrl: string;  // S3 URL
  organizationId: string;  // firmId for multi-tenancy
  options?: {
    parser: 'reducto' | 'tesseract';
    priority: number;  // 1-10 (10 highest)
  };
}
```

### Retry Strategy

```typescript
queue.add('process-document', job, {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000  // 2s, 4s, 8s
  },
  removeOnComplete: 1000,  // Keep 1000 completed jobs
  removeOnFail: 5000       // Keep 5000 failed jobs
})
```

### Dead Letter Queue

After 3 failed attempts, jobs move to `document-processing-dlq`:
```typescript
// Monitor DLQ for persistent failures
const dlqJobs = await queue.getFailed()

// Manually retry or investigate
for (const job of dlqJobs) {
  console.error('Job failed:', job.id, job.failedReason)
  // Option 1: Retry manually
  await job.retry()
  // Option 2: Move to manual review
  await db.failedDocument.create({ data: { jobId: job.id, reason: job.failedReason } })
}
```

### Worker Implementation (apps/api)

```typescript
import { Worker } from 'bullmq'
import { ReductoClient, StorageClient } from '@trato-hive/data-plane'

const worker = new Worker('document-processing', async (job) => {
  const { documentId, fileUrl, organizationId } = job.data

  // 1. Parse document
  const reducto = new ReductoClient({ apiKey: process.env.REDUCTO_API_KEY })
  const parseResult = await reducto.parseDocument(fileUrl)

  // 2. Store metadata
  await db.document.update({
    where: { id: documentId },
    data: {
      status: 'completed',
      chunks: parseResult.data.chunks,
      metadata: parseResult.data.metadata
    }
  })

  // 3. Trigger fact extraction
  await factExtractionQueue.add('extract-facts', { documentId })

  return { documentId, status: 'success' }
}, {
  connection: new IORedis(process.env.REDIS_URL),
  concurrency: 5  // Process 5 jobs in parallel
})

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err)
})
```

---

## 11. Error Handling & Retry Logic

### Error Types

1. **Transient Errors (retry):**
   - Network timeouts
   - S3 throttling
   - Reducto API rate limits
   - Redis connection failures

2. **Permanent Errors (fail fast):**
   - Corrupted files
   - Unsupported formats
   - File too large
   - Invalid permissions

### Error Responses

```typescript
try {
  await storage.upload(file, key)
} catch (error) {
  if (error.code === 'FileTooLarge') {
    throw new Error(`File exceeds ${MAX_FILE_SIZE_MB}MB limit`)
  }
  if (error.code === 'InvalidFileType') {
    throw new Error(`File type not supported: ${file.type}`)
  }
  if (error.code === 'S3AccessDenied') {
    throw new Error('Permission denied: check IAM policy')
  }
  // Transient errors are retried automatically by BullMQ
  throw error
}
```

### Monitoring

**Key Metrics:**
- Job success rate (target: >99%)
- Average processing time (target: <30s for PDFs)
- Queue length (alert if >100 pending jobs)
- Dead letter queue size (alert if >10 jobs)
- S3 upload/download latency
- Reducto API response time

**Logging:**
```typescript
import { logger } from '@trato-hive/shared'

logger.info('Document uploaded', {
  documentId,
  firmId,
  size: file.size,
  type: file.type
})

logger.error('Document processing failed', {
  documentId,
  error: error.message,
  attempt: job.attemptsMade
})
```

---

## 12. Testing

### Unit Tests

**Test Coverage:** ≥80% for all modules

```typescript
// src/__tests__/storage.test.ts
import { describe, it, expect, vi } from 'vitest'
import { StorageClient } from '../storage'

describe('StorageClient', () => {
  it('should upload file to S3', async () => {
    const storage = new StorageClient({ provider: 's3', bucket: 'test-bucket' })
    const mockS3 = vi.spyOn(storage, 'upload')

    const result = await storage.upload(Buffer.from('test'), 'test.pdf')

    expect(result.url).toContain('test.pdf')
    expect(result.size).toBeGreaterThan(0)
  })

  it('should reject files exceeding size limit', async () => {
    const storage = new StorageClient({ provider: 's3', bucket: 'test-bucket' })
    const largeFile = Buffer.alloc(101 * 1024 * 1024) // 101 MB

    await expect(storage.upload(largeFile, 'large.pdf')).rejects.toThrow('File too large')
  })
})
```

### Integration Tests

Test with real Redis and mocked S3:

```typescript
// src/__tests__/queue.integration.test.ts
import { DocumentQueue } from '../queue'

describe('DocumentQueue Integration', () => {
  let queue: DocumentQueue

  beforeAll(() => {
    queue = new DocumentQueue({ redisUrl: 'redis://localhost:6379' })
  })

  afterAll(async () => {
    await queue.close()
  })

  it('should add job to queue and process it', async () => {
    const job = await queue.addDocumentProcessingJob({
      documentId: 'doc-123',
      fileUrl: 's3://bucket/key',
      organizationId: 'firm-456'
    })

    expect(job.id).toBeDefined()
    expect(job.data.documentId).toBe('doc-123')
  })
})
```

---

## 13. Integration Examples

### From apps/api (tRPC Router)

```typescript
import { router, protectedProcedure } from '../trpc'
import { StorageClient, DocumentQueue } from '@trato-hive/data-plane'
import { z } from 'zod'

const storage = new StorageClient({ provider: 's3', bucket: process.env.S3_BUCKET_NAME })
const queue = new DocumentQueue({ redisUrl: process.env.REDIS_URL })

export const documentRouter = router({
  upload: protectedProcedure
    .input(z.object({
      filename: z.string(),
      dealId: z.string(),
      fileBuffer: z.instanceof(Buffer)
    }))
    .mutation(async ({ ctx, input }) => {
      const firmId = ctx.session.user.firmId
      const documentId = generateId()

      // 1. Upload to S3
      const key = `${firmId}/${input.dealId}/${documentId}`
      const result = await storage.upload(input.fileBuffer, key)

      // 2. Create database record
      await ctx.db.document.create({
        data: {
          id: documentId,
          name: input.filename,
          dealId: input.dealId,
          firmId,
          s3Key: result.key,
          size: result.size,
          status: 'processing'
        }
      })

      // 3. Queue processing job
      await queue.addDocumentProcessingJob({
        documentId,
        fileUrl: result.url,
        organizationId: firmId
      })

      return { documentId, status: 'queued' }
    }),

  download: protectedProcedure
    .input(z.object({ documentId: z.string() }))
    .query(async ({ ctx, input }) => {
      const doc = await ctx.db.document.findUnique({
        where: { id: input.documentId }
      })

      if (!doc || doc.firmId !== ctx.session.user.firmId) {
        throw new Error('Document not found')
      }

      // Return presigned URL (1-hour expiry)
      const url = await storage.getPresignedUrl(doc.s3Key, 3600)
      return { url, name: doc.name }
    })
})
```

### From semantic-layer (Fact Extraction)

```typescript
import { ReductoClient } from '@trato-hive/data-plane'
import { db } from '@trato-hive/db'

export async function extractFactsFromDocument(documentId: string) {
  // 1. Get document metadata
  const doc = await db.document.findUnique({
    where: { id: documentId },
    include: { chunks: true }
  })

  // 2. Extract facts from chunks
  const facts = []
  for (const chunk of doc.chunks) {
    if (chunk.content.match(/EBITDA|Revenue|Profit/i)) {
      facts.push({
        content: chunk.content,
        sourceDocumentId: documentId,
        pageNumber: chunk.pageNumber,
        boundingBox: chunk.boundingBox,
        confidence: 0.95
      })
    }
  }

  // 3. Store facts
  await db.fact.createMany({ data: facts })

  return facts
}
```

---

## 14. Common Patterns

### Upload with Validation

```typescript
import { uploadDocumentSchema } from '@trato-hive/shared/validators'

const validated = uploadDocumentSchema.parse({
  filename: 'contract.pdf',
  fileType: 'application/pdf',
  fileSize: 5 * 1024 * 1024 // 5 MB
})

// Validation checks:
// - File type in allowlist (pdf, xlsx, docx, msg, eml)
// - File size < MAX_FILE_SIZE_MB
// - Filename sanitized (no path traversal)
```

### Batch Upload

```typescript
const files = [file1, file2, file3]
const jobs = []

for (const file of files) {
  const result = await storage.upload(file.buffer, file.name)
  const job = await queue.addDocumentProcessingJob({
    documentId: generateId(),
    fileUrl: result.url,
    organizationId: firmId
  })
  jobs.push(job)
}

// Wait for all jobs to complete
const results = await Promise.all(jobs.map(j => j.waitUntilFinished()))
```

---

## 15. Troubleshooting

### Issue: Jobs stuck in queue

**Symptoms:** Queue length grows, no jobs processed

**Causes:**
1. Worker not running
2. Redis connection lost
3. Worker crashes on job execution

**Solutions:**
```bash
# Check worker logs
docker logs api-worker

# Check Redis connection
redis-cli ping

# Restart worker
docker restart api-worker

# Manually process stuck jobs
pnpm --filter api worker:restart
```

### Issue: S3 upload fails with AccessDenied

**Symptoms:** `S3AccessDenied` error on upload

**Causes:**
1. Incorrect IAM permissions
2. Bucket policy restricts access
3. Incorrect AWS credentials

**Solutions:**
```bash
# Verify IAM policy allows PutObject
aws iam get-user-policy --user-name trato-hive-api

# Test S3 access manually
aws s3 cp test.txt s3://trato-hive-documents/test.txt

# Check environment variables
echo $AWS_ACCESS_KEY_ID
echo $AWS_SECRET_ACCESS_KEY
```

### Issue: Reducto API rate limit exceeded

**Symptoms:** `429 Too Many Requests` from Reducto

**Causes:**
- Too many concurrent API calls
- Exceeded monthly quota

**Solutions:**
```typescript
// Implement rate limiting in queue
queue.add('process-document', job, {
  limiter: {
    max: 10,      // Max 10 jobs
    duration: 1000 // Per second
  }
})

// Or fall back to Tesseract.js
if (error.status === 429) {
  logger.warn('Reducto rate limit exceeded, falling back to Tesseract')
  return await tesseractParser.parse(fileUrl)
}
```

---

## 16. Non-Negotiables

1. **Always validate file types** before upload (MIME type, not extension)
2. **Always use presigned URLs** for client downloads (never proxy large files)
3. **Always segment S3 by firmId** for multi-tenancy isolation
4. **Always retry transient errors** (3 attempts with exponential backoff)
5. **Always log to audit trail** for document uploads/deletes
6. **Always use AES-256 encryption** for S3 objects at rest
7. **Always implement dead letter queue** for failed jobs
8. **Never store files locally** (always use S3 or equivalent object storage)
9. **Never process >100MB files** (reject with clear error message)
10. **Always test with real Redis** for integration tests (not mocks)

---

## 17. Performance Requirements

**Targets:**
- Upload latency: <2s for files <10MB
- Processing time: <30s for PDF <50 pages
- Queue throughput: ≥100 jobs/minute
- S3 presigned URL generation: <100ms
- Job success rate: >99%

**Optimization:**
- Use multi-part uploads for files >5MB
- Enable S3 Transfer Acceleration for global uploads
- Use Redis pipelining for batch job operations
- Implement caching for frequently downloaded documents

---

**For More Information:**
- Architecture Doc: `/docs/architecture/data-plane.md`
- S3 Setup Guide: `/docs/deployment/s3-setup.md` (TODO)
- BullMQ Docs: https://docs.bullmq.io
- Reducto API Docs: https://docs.reducto.ai (TODO: contact for access)
