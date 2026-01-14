/**
 * Document Processing Event Emitter
 *
 * Singleton EventEmitter for broadcasting document processing updates.
 * Used by DocumentAgent to emit progress, and by SSE endpoint to stream to clients.
 *
 * Event Types:
 * - document_status: Document processing status change
 * - fact_extracted: New fact extracted from document
 * - processing_complete: Document processing finished
 */
import { EventEmitter } from 'events';

// =============================================================================
// Types
// =============================================================================

export interface DocumentStatusUpdate {
  documentId: string;
  documentName: string;
  status: 'uploading' | 'parsing' | 'extracting' | 'indexed' | 'error';
  progress?: number;
}

export interface FactExtractedUpdate {
  documentId: string;
  fact: {
    id: string;
    type: 'FINANCIAL_METRIC' | 'KEY_PERSON' | 'RISK' | 'OPPORTUNITY' | 'DATE' | 'OTHER';
    subject: string;
    predicate: string;
    object: string;
    confidence: number;
    sourceText: string;
  };
}

export interface ProcessingCompleteUpdate {
  documentId: string;
  factsExtracted: number;
  processingTimeMs: number;
}

export type ProcessingEventType = 'document_status' | 'fact_extracted' | 'processing_complete';

export interface ProcessingEvent {
  dealId: string;
  organizationId: string;
  type: ProcessingEventType;
  data: DocumentStatusUpdate | FactExtractedUpdate | ProcessingCompleteUpdate;
  timestamp: Date;
}

// =============================================================================
// Event Emitter Singleton
// =============================================================================

class DocumentProcessingEmitter extends EventEmitter {
  private static instance: DocumentProcessingEmitter;

  private constructor() {
    super();
    // Increase max listeners to support many concurrent SSE connections
    this.setMaxListeners(100);
  }

  static getInstance(): DocumentProcessingEmitter {
    if (!DocumentProcessingEmitter.instance) {
      DocumentProcessingEmitter.instance = new DocumentProcessingEmitter();
    }
    return DocumentProcessingEmitter.instance;
  }

  /**
   * Emit a document processing event
   */
  emitProcessingEvent(event: ProcessingEvent): void {
    this.emit('processing', event);
  }

  /**
   * Emit document status change
   */
  emitDocumentStatus(
    organizationId: string,
    dealId: string,
    data: DocumentStatusUpdate
  ): void {
    this.emitProcessingEvent({
      organizationId,
      dealId,
      type: 'document_status',
      data,
      timestamp: new Date(),
    });
  }

  /**
   * Emit fact extracted event
   */
  emitFactExtracted(
    organizationId: string,
    dealId: string,
    data: FactExtractedUpdate
  ): void {
    this.emitProcessingEvent({
      organizationId,
      dealId,
      type: 'fact_extracted',
      data,
      timestamp: new Date(),
    });
  }

  /**
   * Emit processing complete event
   */
  emitProcessingComplete(
    organizationId: string,
    dealId: string,
    data: ProcessingCompleteUpdate
  ): void {
    this.emitProcessingEvent({
      organizationId,
      dealId,
      type: 'processing_complete',
      data,
      timestamp: new Date(),
    });
  }
}

// Export singleton instance
export const documentProcessingEmitter = DocumentProcessingEmitter.getInstance();

// Export type for event handlers
export type ProcessingEventHandler = (event: ProcessingEvent) => void;
