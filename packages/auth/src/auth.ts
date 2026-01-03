/**
 * NextAuth.js v5 Instance with Prisma Adapter
 *
 * This file creates the main NextAuth instance with database-backed sessions.
 * Requires Node.js environment (uses Prisma client).
 *
 * Session Enrichment:
 * - Fetches user's organization memberships
 * - Adds organizationId and role to session.user
 * - Enables multi-tenant isolation via organizationId
 *
 * OAuth Providers:
 * - Google OAuth 2.0
 * - Microsoft Azure AD
 *
 * Account Linking:
 * - Automatically links OAuth accounts to existing users by email
 * - Enforces organization membership requirement (invite-only)
 *
 * @see https://authjs.dev/guides/upgrade-to-v5
 */
import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import type { Adapter } from 'next-auth/adapters';
import type { Session } from 'next-auth';
import Google from 'next-auth/providers/google';
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id';
import { prisma } from '@trato-hive/db';
import { authConfig } from './auth.config';

/**
 * NextAuth instance with database adapter
 * Uses AUTH_SECRET from environment (NextAuth v5 default)
 */
const nextAuth = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma) as Adapter,

  providers: [
    /**
     * Google OAuth 2.0 Provider
     * Requires: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
     * Callback URL: {AUTH_URL}/api/auth/callback/google
     */
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true, // Enable automatic account linking by email
    }),

    /**
     * Microsoft Entra ID Provider (formerly Azure AD)
     * Requires: AUTH_MICROSOFT_ENTRA_ID_ID, AUTH_MICROSOFT_ENTRA_ID_SECRET, AUTH_MICROSOFT_ENTRA_ID_ISSUER
     * Callback URL: {AUTH_URL}/api/auth/callback/microsoft-entra-id
     */
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER!, // https://login.microsoftonline.com/{tenant-id}/v2.0
      allowDangerousEmailAccountLinking: true, // Enable automatic account linking by email
    }),
  ],

  callbacks: {
    ...authConfig.callbacks,

    /**
     * Sign In callback - Enforces organization membership requirement
     *
     * Account Linking Strategy:
     * 1. If OAuth provider (not credentials), check if user exists by email
     * 2. If user exists, Prisma adapter automatically links the OAuth account
     * 3. Enforce organization membership requirement (invite-only model)
     * 4. Reject sign-in if user has no organization memberships
     *
     * Future Enhancement:
     * - Auto-join based on email domain (e.g., @company.com → Company Org)
     * - Custom invitation flow with token validation
     *
     * @param user - The user object
     * @param account - The account object (provider info)
     * @returns true to allow sign-in, false to reject
     */
    async signIn({ user, account }) {
      // Only enforce for OAuth providers (not credentials)
      if (account?.provider !== 'credentials') {
        // Check if user exists in database
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: {
            organizations: true, // Include organization memberships
          },
        });

        // If user exists but has no organization memberships, reject sign-in
        // This enforces the invite-only model
        if (existingUser && existingUser.organizations.length === 0) {
          console.warn(
            `[Auth] Sign-in rejected: User ${user.email} has no organization membership`
          );
          return false;
        }

        // Future: Auto-join based on email domain
        // const domain = user.email!.split('@')[1];
        // const org = await prisma.organization.findFirst({ where: { domain } });
        // if (org) {
        //   await prisma.organizationMember.create({
        //     data: { userId: existingUser.id, organizationId: org.id, role: 'MEMBER' }
        //   });
        // }
      }

      return true;
    },

    /**
     * Session callback - Enriches session with organization data
     *
     * Critical for Multi-Tenancy:
     * - Fetches user's organization memberships from database
     * - Adds organizationId to session for isolation enforcement
     * - Adds role for RBAC authorization
     *
     * @param session - The session object
     * @param user - The user object from database
     * @returns Enriched session with organizationId and role
     */
    async session({ session, user }) {
      if (session.user) {
        // Add user ID to session
        session.user.id = user.id;

        // Fetch user's organization memberships
        const memberships = await prisma.organizationMember.findMany({
          where: { userId: user.id },
          include: { organization: true },
          orderBy: { createdAt: 'asc' }, // Use first joined organization as primary
        });

        // Attach first organization (or null if none)
        // Future enhancement: Support organization switching
        const primaryMembership = memberships[0];
        if (primaryMembership) {
          session.user.organizationId = primaryMembership.organizationId;
          session.user.role = primaryMembership.role;
        }
      }

      return session;
    },
  },
});

/**
 * Export NextAuth handlers and functions
 * Using explicit type assertions to avoid @auth/core internal type leakage
 */
export const handlers = nextAuth.handlers;
export const auth: () => Promise<Session | null> = nextAuth.auth;
/** Sign in function - uses NextAuth's internal signIn */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const signIn = nextAuth.signIn as (
  provider?: string,
  options?: Record<string, unknown>,
  authorizationParams?: Record<string, unknown>
) => Promise<void>;
/** Sign out function - uses NextAuth's internal signOut */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const signOut = nextAuth.signOut as (options?: Record<string, unknown>) => Promise<void>;
