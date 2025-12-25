/**
 * Trato Hive API Server
 *
 * Fastify server with tRPC adapter for type-safe API endpoints.
 *
 * Features:
 * - tRPC v11 with SuperJSON transformer
 * - NextAuth session integration
 * - Multi-tenant isolation via organizationId
 * - RBAC with role hierarchy
 *
 * @see apps/api/CLAUDE.md for architecture patterns
 */
import Fastify from 'fastify';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { createContext } from './trpc/context';
import { appRouter } from './trpc/router';
export type { AppRouter } from './trpc/router';

/**
 * Initialize Fastify instance
 *
 * Configuration:
 * - maxParamLength: Increased for complex query params
 * - logger: Pino logger for structured logging
 */
const fastify = Fastify({
  maxParamLength: 5000,
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport:
      process.env.NODE_ENV === 'development'
        ? {
          target: 'pino-pretty',
          options: {
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
        : undefined,
  },
});

/**
 * Register tRPC plugin
 *
 * Mounts the tRPC router at /trpc prefix.
 * All tRPC procedures are available at:
 * - http://localhost:4000/trpc/{router}.{procedure}
 *
 * Example:
 * - POST http://localhost:4000/trpc/deal.list
 * - POST http://localhost:4000/trpc/deal.get?input={"id":"123"}
 */
fastify.register(fastifyTRPCPlugin, {
  prefix: '/trpc',
  trpcOptions: {
    router: appRouter,
    createContext,
    onError({ path, error }: { path: string | undefined; error: Error }) {
      fastify.log.error(`❌ tRPC Error on ${path ?? '<no-path>'}:`);
      fastify.log.error(error);
    },
  },
});

/**
 * Health check endpoint
 * Used by load balancers and monitoring tools
 */
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

/**
 * Start server
 *
 * Environment variables:
 * - API_PORT: Server port (default: 4000)
 * - LOG_LEVEL: Log level (default: info)
 */
const start = async () => {
  try {
    const port = Number(process.env.API_PORT) || 4000;
    const host = '0.0.0.0';

    await fastify.listen({ port, host });

    fastify.log.info(`🚀 Trato Hive API Server started`);
    fastify.log.info(`📡 tRPC endpoint: http://localhost:${port}/trpc`);
    fastify.log.info(`❤️  Health check: http://localhost:${port}/health`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
