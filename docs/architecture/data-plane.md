# Data Plane (Layer 1)

**Status:** Draft
**Last Updated:** 2025‑11‑12
**Owner:** Data Platform Team
**Priority:** High

The **Data Plane** is the foundation of the Trato Hive stack. It handles ingestion of raw documents, parsing, optical character recognition (OCR) and storage. This layer abstracts away the complexities of file handling and ensures that subsequent layers operate on clean, structured data.

## 1. Responsibilities

1. **Document Ingestion:** Accept files from the UI, agents or APIs. Support drag‑and‑drop uploads (e.g., zip archives containing VDR documents) as well as asynchronous ingestion from external storage (e.g., presigned URLs). Validate file types and sizes.
2. **Parsing & OCR:** Convert documents into machine‑readable formats. For PDFs and images, use **Reducto AI** (primary) for advanced document parsing with superior accuracy, falling back to Tesseract.js for cost-sensitive or offline scenarios. For spreadsheets (XLSX), parse sheets and normalise data. Extract metadata (title, author, pages) for indexing.
3. **Storage:** Store raw files and extracted text securely. Use S3 or an equivalent object storage service for files. Use a database for metadata and extracted text. Provide presigned URLs for download to avoid storing expensive copies in the UI.
4. **Error Handling & Retry:** Detect ingestion failures (e.g., corrupted files, OCR errors) and implement retry logic. Capture errors in audit logs and notify the user via the Experience Layer.
5. **Supported Formats:** Handle PDF (scanned or text‑based), Microsoft Office (DOCX, XLSX, PPTX), emails (EML/MSG), text files and zip archives containing mixed formats. Avoid proprietary or exotic formats to keep the scope manageable.
6. **Exported Interfaces:** Expose APIs for higher layers: `ingestDocument(file, metadata) → documentId`, `parseDocument(documentId) → parsedContent`, `getDocument(documentId) → presignedURL`, `deleteDocument(documentId)`.

## 2. Package Structure

Located in `packages/data-plane/`, this package is divided into several modules:

| Module | Description |
|--------|-------------|
| `ingestion/` | Entry point for file uploads. Handles validation and orchestrates parsing and storage. |
| `parsers/` | Contains parsers for different formats (PDF, XLSX, emails). Uses libraries like `pdfjs`, `xlsx` and `mailparser`. |
| `reducto/` | **Primary parser** - Integrates Reducto AI API for advanced document parsing with superior OCR accuracy, structured data extraction, and bounding box coordinates for citation highlighting. |
| `ocr/` | **Fallback parser** - Wraps Tesseract.js for performing OCR on scanned documents when Reducto is unavailable or for cost optimization. Supports language selection and coordinate extraction. |
| `storage/` | Integrates with object storage (e.g., S3) using SDKs. Handles upload, download (with presigned URLs) and deletion. |
| `validators/` | Defines allowable file types and size limits; returns descriptive errors on invalid uploads. |

## 3. S3 Integration Patterns

- **Upload:** Files are uploaded to a temporary staging bucket via presigned POST URLs. Once ingestion completes and metadata is stored, they are moved to a permanent bucket segmented by `firmId` for multi‑tenant isolation.
- **Download:** `getDocument()` returns a presigned GET URL with a short expiry. The Experience Layer uses this URL to fetch the file, eliminating the need to proxy large downloads through the API server.
- **Versioning:** Object versioning is enabled on buckets to protect against accidental deletions or overwrites. Version IDs are stored in the database.
- **Encryption:** Use S3 server‑side encryption with customer‑managed KMS keys (AES‑256)【516335038796236†L90-L99】.

## 4. Document Parsing Strategy

### 4.1 Reducto AI Workflow (Primary)

1. **API Integration:** Submit documents to Reducto AI via REST API. Reducto handles multi-format parsing (PDF, DOCX, XLSX, images) with state-of-the-art accuracy.
2. **Structured Extraction:** Reducto returns:
   - Full text with hierarchical structure (headings, paragraphs, tables)
   - Bounding box coordinates for every text element (enables precise citation highlighting)
   - Extracted tables in structured JSON format
   - Confidence scores per element
3. **Metadata Enrichment:** Reducto automatically extracts document metadata (title, author, creation date, page count).
4. **Error Handling:** On API failure or unsupported format, fall back to Tesseract.js workflow below.

**Environment Variables:**
- `REDUCTO_API_KEY` - API authentication
- `REDUCTO_API_URL` - API endpoint (default: `https://api.reducto.ai`)

### 4.2 Tesseract.js Workflow (Fallback)

1. **Preprocessing:** Convert PDFs into images (using PDF.js) and normalise for OCR (deskew, de‑noise). For images embedded in Office documents, extract images using appropriate parsers.
2. **OCR Execution:** Call Tesseract.js with appropriate language packs. Use the `HOCR` output format to capture bounding boxes for each word so citations can highlight the exact location of a fact in the document.
3. **Post‑processing:** Clean OCR output (remove artefacts, normalise whitespace) and assign a confidence score. Flag low‑confidence pages for manual review. Store both raw OCR and cleaned text for future reference.

## 5. Error Handling & Retry Logic

- **Transient Errors:** For network timeouts or S3 availability issues, retry uploads/downloads with exponential backoff up to three attempts.
- **File Errors:** If a file fails to parse (e.g., corrupted PDF), log the error and notify the user with details. Move the file to a quarantine bucket for manual inspection.
- **OCR Errors:** If OCR fails on a page, record the page number and error; proceed with remaining pages. Highlight incomplete OCR to the user during document review.

## 6. Exported Interfaces

```typescript
// ingest a new document and return its ID
async function ingestDocument(file: File, metadata: { firmId: string, dealId?: string, uploaderId: string }): Promise<string>

// parse and OCR a document; returns structured content and metadata
async function parseDocument(documentId: string): Promise<ParsedDocument>

// get a presigned URL to download the raw document
async function getDocument(documentId: string): Promise<string>

// delete a document (only if not referenced by facts)
async function deleteDocument(documentId: string): Promise<void>
```

## 7. Conclusion

The Data Plane abstracts the messy reality of ingesting unstructured documents. By using open‑source parsing and OCR tools, integrating cost‑effective object storage and providing clear interfaces, this layer enables the rest of the system to focus on extracting and reasoning over verifiable facts without worrying about file handling.
