/**
 * tRPC Context Creation
 *
 * Creates the context object passed to all tRPC procedures.
 * Includes:
 * - NextAuth session (user authentication and organization data)
 * - Prisma database client
 *
 * The session is enriched with:
 * - user.id: User ID
 * - user.organizationId: Primary organization (multi-tenancy)
 * - user.role: Organization role (RBAC)
 *
 * Demo Mode:
 * - Set DEMO_MODE=true in .env to bypass auth
 * - Uses hardcoded demo user/org for development
 *
 * @see packages/auth for session enrichment logic
 */
import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import { auth } from '@trato-hive/auth';
import { prisma } from '@trato-hive/db';

/**
 * Demo session for development/testing without OAuth setup
 */
const DEMO_SESSION = {
  user: {
    id: 'demo-user-id',
    name: 'Demo User',
    email: 'demo@tratohive.com',
    organizationId: 'demo-org-id',
    role: 'ADMIN' as const,
  },
  expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
};

/**
 * Create tRPC context for each request
 *
 * This function is called for every tRPC request.
 * It fetches the NextAuth session and provides database access.
 *
 * In demo mode (DEMO_MODE=true), returns a mock session
 * to allow development without OAuth configuration.
 *
 * @param _opts - Fetch adapter options (unused, but required by type)
 * @returns Context object with session and database client
 */
export async function createContext({ req, res }: CreateFastifyContextOptions) {
  // Demo mode: bypass auth for development
  if (process.env.DEMO_MODE === 'true') {
    return {
      session: DEMO_SESSION,
      db: prisma,
    };
  }

  // Production: Get session from NextAuth (includes organizationId and role)
  const session = await auth();

  return {
    session,
    db: prisma,
  };
}

/**
 * Context type for use in tRPC procedures
 *
 * @example
 * ```typescript
 * export const protectedProcedure = t.procedure.use(async ({ ctx }) => {
 *   // ctx.session is Session | null
 *   // ctx.db is PrismaClient
 * });
 * ```
 */
export type Context = Awaited<ReturnType<typeof createContext>>;
