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
import Google from 'next-auth/providers/google';
import AzureAD from 'next-auth/providers/azure-ad';
import { prisma } from '@trato-hive/db';
import { authConfig } from './auth.config';

/**
 * NextAuth instance with database adapter
 * Uses AUTH_SECRET from environment (NextAuth v5 default)
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
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
     * Microsoft Azure AD Provider
     * Requires: AZURE_AD_CLIENT_ID, AZURE_AD_CLIENT_SECRET, AZURE_AD_TENANT_ID
     * Callback URL: {AUTH_URL}/api/auth/callback/azure-ad
     */
    AzureAD({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
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
