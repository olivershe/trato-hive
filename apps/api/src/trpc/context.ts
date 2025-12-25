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
 * @see packages/auth for session enrichment logic
 */
import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import { auth } from '@trato-hive/auth';
import { prisma } from '@trato-hive/db';

/**
 * Create tRPC context for each request
 *
 * This function is called for every tRPC request.
 * It fetches the NextAuth session and provides database access.
 *
 * Note: In Next.js App Router, auth() is automatically memoized via React.cache()
 * to prevent duplicate session lookups within a single request.
 *
 * @param _opts - Fetch adapter options (unused, but required by type)
 * @returns Context object with session and database client
 */
export async function createContext({ req, res }: CreateFastifyContextOptions) {
  // Get session from NextAuth (includes organizationId and role)
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
