/**
 * Document Processing SSE Stream Route
 *
 * Server-Sent Events endpoint for real-time document processing updates.
 * Streams fact extraction and processing status to connected clients.
 *
 * Security:
 * - Requires valid session (via NextAuth)
 * - Scoped to organizationId from session
 * - Only sends events for documents in user's organization
 *
 * Demo Mode:
 * - Set DEMO_MODE=true to bypass auth (development only)
 */
import type { FastifyInstance, FastifyReply } from 'fastify';
import { auth } from '@trato-hive/auth';
import {
  documentProcessingEmitter,
  type ProcessingEvent,
  type ProcessingEventHandler,
} from '../events/document-processing';

/**
 * Demo session for development/testing without OAuth setup
 * Uses real IDs from seed data (matches tRPC context)
 */
const DEMO_ORGANIZATION_ID = 'cmjg56shz0000vla8yayi619g'; // Acme Capital Partners

/**
 * Register document processing stream routes
 */
export async function registerDocumentStreamRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /api/documents/:dealId/processing-stream
   *
   * SSE endpoint for document processing updates.
   * Streams events for a specific deal's documents.
   */
  fastify.get<{
    Params: { dealId: string };
  }>('/api/documents/:dealId/processing-stream', async (request, reply) => {
    const { dealId } = request.params;

    // Get organizationId from session or demo mode
    let organizationId: string;

    // Demo mode: bypass auth for development
    if (process.env.DEMO_MODE === 'true') {
      organizationId = DEMO_ORGANIZATION_ID;
    } else {
      // Production: Get session from NextAuth
      try {
        const session = await auth();

        if (!session?.user?.organizationId) {
          return reply.status(401).send({
            error: 'Unauthorized',
            message: 'Valid session required for SSE connection',
          });
        }

        organizationId = session.user.organizationId;
      } catch {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Authentication failed',
        });
      }
    }

    // Set SSE headers
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    });

    // Send initial connection event
    sendEvent(reply, 'connected', { dealId, timestamp: new Date().toISOString() });

    // Keep-alive ping every 30 seconds
    const keepAliveInterval = setInterval(() => {
      sendEvent(reply, 'ping', { timestamp: new Date().toISOString() });
    }, 30000);

    // Event handler for processing updates
    const handleProcessingEvent: ProcessingEventHandler = (event: ProcessingEvent) => {
      // Only forward events for this deal and organization
      if (event.dealId === dealId && event.organizationId === organizationId) {
        sendEvent(reply, event.type, event.data);
      }
    };

    // Subscribe to events
    documentProcessingEmitter.on('processing', handleProcessingEvent);

    // Cleanup on connection close
    request.raw.on('close', () => {
      clearInterval(keepAliveInterval);
      documentProcessingEmitter.off('processing', handleProcessingEvent);
      fastify.log.info(`SSE connection closed for deal ${dealId}`);
    });

    // Keep connection open
    // Note: We don't call reply.send() - the connection stays open
  });

  /**
   * GET /api/documents/processing-stream/health
   *
   * Health check for SSE endpoint
   */
  fastify.get('/api/documents/processing-stream/health', async () => {
    return {
      status: 'ok',
      activeConnections: documentProcessingEmitter.listenerCount('processing'),
      timestamp: new Date().toISOString(),
    };
  });
}

/**
 * Send an SSE event
 */
function sendEvent(reply: FastifyReply, event: string, data: unknown): void {
  try {
    reply.raw.write(`event: ${event}\n`);
    reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
  } catch {
    // Connection may be closed
  }
}
