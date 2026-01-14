"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// =============================================================================
// Types (matching backend event types)
// =============================================================================

export interface DocumentStatus {
  documentId: string;
  documentName: string;
  status: "uploading" | "parsing" | "extracting" | "indexed" | "error";
  progress?: number;
}

export interface ExtractedFact {
  id: string;
  documentId: string;
  type:
    | "FINANCIAL_METRIC"
    | "KEY_PERSON"
    | "RISK"
    | "OPPORTUNITY"
    | "DATE"
    | "OTHER";
  subject: string;
  predicate: string;
  object: string;
  confidence: number;
  sourceText: string;
}

export interface UseDocumentProcessingStreamResult {
  /** Whether the SSE connection is active */
  isConnected: boolean;
  /** Map of document IDs to their processing status */
  documentStatuses: Map<string, DocumentStatus>;
  /** Array of extracted facts (newest last) */
  extractedFacts: ExtractedFact[];
  /** Connection error, if any */
  error: Error | null;
  /** Manually reconnect to the stream */
  reconnect: () => void;
  /** Clear extracted facts */
  clearFacts: () => void;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook for consuming real-time document processing updates via SSE
 *
 * @param dealId - The deal ID to stream updates for (null to disable)
 * @returns Stream state and control functions
 *
 * @example
 * ```tsx
 * const { isConnected, documentStatuses, extractedFacts } = useDocumentProcessingStream(dealId);
 *
 * // Show processing documents
 * {Array.from(documentStatuses.values()).map(doc => (
 *   <div key={doc.documentId}>
 *     {doc.documentName}: {doc.status}
 *   </div>
 * ))}
 *
 * // Show extracted facts
 * {extractedFacts.map(fact => (
 *   <FactCard key={fact.id} fact={fact} />
 * ))}
 * ```
 */
export function useDocumentProcessingStream(
  dealId: string | null
): UseDocumentProcessingStreamResult {
  const [isConnected, setIsConnected] = useState(false);
  const [documentStatuses, setDocumentStatuses] = useState<
    Map<string, DocumentStatus>
  >(new Map());
  const [extractedFacts, setExtractedFacts] = useState<ExtractedFact[]>([]);
  const [error, setError] = useState<Error | null>(null);

  // Ref to track EventSource instance
  const eventSourceRef = useRef<EventSource | null>(null);

  // Reconnect function
  const connect = useCallback(() => {
    if (!dealId) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Determine base URL for SSE endpoint
    // In development, API runs on port 4000
    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const streamUrl = `${apiBaseUrl}/api/documents/${dealId}/processing-stream`;

    const eventSource = new EventSource(streamUrl, {
      withCredentials: true, // Send cookies for auth
    });

    eventSourceRef.current = eventSource;

    // Connection opened
    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    // Connection error
    eventSource.onerror = () => {
      setIsConnected(false);
      setError(new Error("Connection lost. Retrying..."));

      // EventSource will auto-reconnect, but we track the error
      // If it fails repeatedly, the browser will stop trying
    };

    // Handle "connected" event
    eventSource.addEventListener("connected", (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log("[SSE] Connected to stream:", data);
      } catch {
        // Ignore parse errors
      }
    });

    // Handle "ping" keepalive
    eventSource.addEventListener("ping", () => {
      // Connection is alive, no action needed
    });

    // Handle document status updates
    eventSource.addEventListener("document_status", (e) => {
      try {
        const data = JSON.parse(e.data) as DocumentStatus;
        setDocumentStatuses((prev) => {
          const next = new Map(prev);
          next.set(data.documentId, data);
          return next;
        });
      } catch (err) {
        console.error("[SSE] Failed to parse document_status:", err);
      }
    });

    // Handle fact extracted events
    eventSource.addEventListener("fact_extracted", (e) => {
      try {
        const data = JSON.parse(e.data) as {
          documentId: string;
          fact: Omit<ExtractedFact, "documentId">;
        };
        const newFact: ExtractedFact = {
          ...data.fact,
          documentId: data.documentId,
        };
        setExtractedFacts((prev) => [...prev, newFact]);
      } catch (err) {
        console.error("[SSE] Failed to parse fact_extracted:", err);
      }
    });

    // Handle processing complete events
    eventSource.addEventListener("processing_complete", (e) => {
      try {
        const data = JSON.parse(e.data) as {
          documentId: string;
          factsExtracted: number;
          processingTimeMs: number;
        };
        console.log(
          `[SSE] Document ${data.documentId} complete: ${data.factsExtracted} facts in ${data.processingTimeMs}ms`
        );

        // Update document status to indexed
        setDocumentStatuses((prev) => {
          const next = new Map(prev);
          const existing = next.get(data.documentId);
          if (existing) {
            next.set(data.documentId, {
              ...existing,
              status: "indexed",
            });
          }
          return next;
        });
      } catch (err) {
        console.error("[SSE] Failed to parse processing_complete:", err);
      }
    });

    return eventSource;
  }, [dealId]);

  // Reconnect function exposed to consumers
  const reconnect = useCallback(() => {
    connect();
  }, [connect]);

  // Clear facts
  const clearFacts = useCallback(() => {
    setExtractedFacts([]);
  }, []);

  // Connect/disconnect on dealId change
  useEffect(() => {
    if (!dealId) {
      // No dealId, ensure disconnected
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    // Connect to stream
    const eventSource = connect();

    // Cleanup on unmount or dealId change
    return () => {
      if (eventSource) {
        eventSource.close();
      }
      eventSourceRef.current = null;
      setIsConnected(false);
    };
  }, [dealId, connect]);

  return {
    isConnected,
    documentStatuses,
    extractedFacts,
    error,
    reconnect,
    clearFacts,
  };
}
