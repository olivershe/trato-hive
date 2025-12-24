/**
 * Authentication and Authorization Utility Functions
 *
 * This module provides RBAC (Role-Based Access Control) utilities for Trato Hive.
 * All functions are pure, type-safe, and designed for simplicity (no external RBAC libraries).
 *
 * Role Hierarchy: OWNER > ADMIN > MEMBER > VIEWER
 *
 * @see packages/auth/CLAUDE.md for usage patterns
 */
import type { Session } from 'next-auth';
import { OrganizationRole } from '@trato-hive/db';

/**
 * Organization role hierarchy for comparison
 * Higher number = higher privilege level
 */
const ROLE_HIERARCHY: Record<OrganizationRole, number> = {
  [OrganizationRole.OWNER]: 4,
  [OrganizationRole.ADMIN]: 3,
  [OrganizationRole.MEMBER]: 2,
  [OrganizationRole.VIEWER]: 1,
};

/**
 * Check if user is authenticated
 *
 * @param session - NextAuth session
 * @returns true if user is authenticated
 *
 * @example
 * ```typescript
 * if (!isAuthenticated(session)) {
 *   redirect('/auth/signin');
 * }
 * ```
 */
export function isAuthenticated(session: Session | null): boolean {
  return !!session?.user;
}

/**
 * Check if user has a specific role
 *
 * @param session - NextAuth session
 * @param role - Role to check (OWNER, ADMIN, MEMBER, VIEWER)
 * @returns true if user has the exact role specified
 *
 * @example
 * ```typescript
 * if (hasRole(session, OrganizationRole.ADMIN)) {
 *   // User is an admin
 * }
 * ```
 */
export function hasRole(
  session: Session | null,
  role: OrganizationRole
): boolean {
  if (!session?.user?.role) return false;
  return session.user.role === role;
}

/**
 * Check if user has any of multiple roles
 *
 * @param session - NextAuth session
 * @param roles - Array of roles to check
 * @returns true if user has at least one of the specified roles
 *
 * @example
 * ```typescript
 * if (hasAnyRole(session, [OrganizationRole.OWNER, OrganizationRole.ADMIN])) {
 *   // User is owner or admin
 * }
 * ```
 */
export function hasAnyRole(
  session: Session | null,
  roles: OrganizationRole[]
): boolean {
  if (!session?.user?.role) return false;
  return roles.includes(session.user.role);
}

/**
 * Check if user is at least a certain role level
 *
 * Role hierarchy: OWNER (4) > ADMIN (3) > MEMBER (2) > VIEWER (1)
 *
 * @param session - NextAuth session
 * @param minRole - Minimum required role
 * @returns true if user's role is equal to or higher than minRole
 *
 * @example
 * ```typescript
 * if (hasMinimumRole(session, OrganizationRole.MEMBER)) {
 *   // User is MEMBER, ADMIN, or OWNER (can create/edit)
 * }
 *
 * if (hasMinimumRole(session, OrganizationRole.ADMIN)) {
 *   // User is ADMIN or OWNER (can manage settings)
 * }
 * ```
 */
export function hasMinimumRole(
  session: Session | null,
  minRole: OrganizationRole
): boolean {
  if (!session?.user?.role) return false;

  const userLevel = ROLE_HIERARCHY[session.user.role];
  const requiredLevel = ROLE_HIERARCHY[minRole];

  return userLevel >= requiredLevel;
}

/**
 * "Golden Rule" - Check if user can access a specific organization
 *
 * This is the CRITICAL multi-tenancy enforcement function.
 * ALL queries that access organization-specific data MUST use this check.
 *
 * @param session - NextAuth session
 * @param organizationId - Organization ID to check
 * @returns true if user belongs to the organization
 *
 * @example
 * ```typescript
 * const deal = await prisma.deal.findUnique({ where: { id } });
 *
 * if (!canAccessOrganization(session, deal.organizationId)) {
 *   throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot access deal from different organization' });
 * }
 * ```
 */
export function canAccessOrganization(
  session: Session | null,
  organizationId: string
): boolean {
  if (!session?.user?.organizationId) return false;
  return session.user.organizationId === organizationId;
}

/**
 * Block Protocol stub - Check if user can edit a specific block type
 *
 * This is a PLACEHOLDER for future Block Protocol integration (Phase 6.4).
 * Current implementation: Simple role-based check (VIEWER cannot edit)
 *
 * Future Enhancement:
 * - Integrate with Block Protocol entity permissions
 * - Support granular permissions per block type
 * - Support block-level ownership and sharing
 *
 * @param session - NextAuth session
 * @param blockType - Block type to check (e.g., "DealHeaderBlock", "CitationBlock")
 * @returns true if user can edit the block type
 *
 * @example
 * ```typescript
 * if (!canEditBlock(session, 'DealHeaderBlock')) {
 *   throw new Error('Insufficient permissions to edit this block');
 * }
 * ```
 */
export function canEditBlock(
  session: Session | null,
  _blockType: string // Underscore prefix: parameter reserved for future use
): boolean {
  // Phase 6.3 stub - Role-based access only
  // VIEWER role cannot edit any blocks
  if (session?.user?.role === OrganizationRole.VIEWER) {
    return false;
  }

  // All other roles (MEMBER, ADMIN, OWNER) can edit for now
  // Future: Check blockType-specific permissions from Block Protocol
  return isAuthenticated(session);
}

/**
 * Helper: Get user's role from session
 *
 * @param session - NextAuth session
 * @returns User's role or null if not authenticated
 */
export function getUserRole(session: Session | null): OrganizationRole | null {
  return session?.user?.role ?? null;
}

/**
 * Helper: Get user's organization ID from session
 *
 * @param session - NextAuth session
 * @returns User's organization ID or null if not authenticated
 */
export function getUserOrganizationId(session: Session | null): string | null {
  return session?.user?.organizationId ?? null;
}
