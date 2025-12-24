/**
 * NextAuth.js Type Extensions
 *
 * Extends the default NextAuth session types to include:
 * - user.id: User ID from database
 * - user.organizationId: Primary organization ID (multi-tenancy)
 * - user.role: User's role in the organization (RBAC)
 *
 * These extensions enable:
 * 1. Multi-tenant isolation via organizationId filtering
 * 2. Role-based access control via hasRole, hasMinimumRole utilities
 * 3. Type-safe session access throughout the application
 */
import type { DefaultSession } from 'next-auth';
import type { OrganizationRole } from '@trato-hive/db';

/**
 * Module augmentation for NextAuth types
 * Extends the Session interface with organization and role data
 */
declare module 'next-auth' {
  /**
   * Extended session with multi-tenancy and RBAC support
   */
  interface Session {
    user: {
      /** User ID from database */
      id: string;
      /** Primary organization ID for multi-tenant isolation */
      organizationId?: string;
      /** User's role in the organization (OWNER, ADMIN, MEMBER, VIEWER) */
      role?: OrganizationRole;
    } & DefaultSession['user'];
  }
}
