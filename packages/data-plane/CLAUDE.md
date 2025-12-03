# Data Plane Package (@trato-hive/data-plane)

## Purpose

Document ingestion, OCR, and storage layer (Layer 1).

## Tech Stack

- **Storage:** AWS S3 (Presigned URLs)
- **OCR:** Reducto AI (Primary), Tesseract.js (Fallback)
- **Queue:** BullMQ (Redis)
- **Validation:** Zod

## Architecture

- **Ingestion:** Upload → S3 Staging → Queue Job.
- **Processing:** Worker → OCR → Metadata → S3 Permanent.
- **Storage:** Segmented by `firmId`.

## Common Patterns

### Upload Document

```typescript
// storage.ts
const storage = new StorageClient({ provider: 's3' })
const { url } = await storage.upload(buffer, `${firmId}/${docId}`)
```

### Queue Processing Job

```typescript
// queue.ts
await queue.addDocumentProcessingJob({
  documentId: 'doc-123',
  fileUrl: s3Url,
  organizationId: 'firm-456',
})
```

## Non-Negotiables

- **Validation:** Validate file type/size before upload.
- **Security:** Use presigned URLs (never proxy large files).
- **Isolation:** S3 keys MUST start with `firmId/`.
- **Reliability:** Retry transient errors (3x backoff).
