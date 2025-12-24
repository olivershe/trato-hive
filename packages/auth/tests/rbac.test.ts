/**
 * RBAC Utilities Test Suite
 *
 * Tests all role-based access control functions:
 * - isAuthenticated
 * - hasRole
 * - hasAnyRole
 * - hasMinimumRole (role hierarchy)
 * - canAccessOrganization (multi-tenancy)
 * - canEditBlock (Block Protocol stub)
 * - getUserRole
 * - getUserOrganizationId
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { OrganizationRole } from '@trato-hive/db';
import {
  isAuthenticated,
  hasRole,
  hasAnyRole,
  hasMinimumRole,
  canAccessOrganization,
  canEditBlock,
  getUserRole,
  getUserOrganizationId,
} from '../src/utils';
import { createMockSession, resetMocks } from './setup';

describe('RBAC Utilities', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('isAuthenticated', () => {
    it('should return true for valid session', () => {
      const session = createMockSession();
      expect(isAuthenticated(session)).toBe(true);
    });

    it('should return false for null session', () => {
      expect(isAuthenticated(null)).toBe(false);
    });

    it('should return false for session without user', () => {
      const session = createMockSession();
      // @ts-expect-error - Testing edge case
      session.user = null;
      expect(isAuthenticated(session)).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('should return true for matching role', () => {
      const session = createMockSession({
        user: {
          ...createMockSession().user,
          role: OrganizationRole.ADMIN,
        },
      });

      expect(hasRole(session, OrganizationRole.ADMIN)).toBe(true);
    });

    it('should return false for non-matching role', () => {
      const session = createMockSession({
        user: {
          ...createMockSession().user,
          role: OrganizationRole.MEMBER,
        },
      });

      expect(hasRole(session, OrganizationRole.ADMIN)).toBe(false);
    });

    it('should return false for null session', () => {
      expect(hasRole(null, OrganizationRole.ADMIN)).toBe(false);
    });

    it('should return false for session without role', () => {
      const session = createMockSession({
        user: {
          ...createMockSession().user,
          role: undefined,
        },
      });

      expect(hasRole(session, OrganizationRole.ADMIN)).toBe(false);
    });

    it('should work with all role types', () => {
      const roles = [
        OrganizationRole.OWNER,
        OrganizationRole.ADMIN,
        OrganizationRole.MEMBER,
        OrganizationRole.VIEWER,
      ];

      roles.forEach((role) => {
        const session = createMockSession({
          user: { ...createMockSession().user, role },
        });
        expect(hasRole(session, role)).toBe(true);
      });
    });
  });

  describe('hasAnyRole', () => {
    it('should return true if user has any of the specified roles', () => {
      const session = createMockSession({
        user: {
          ...createMockSession().user,
          role: OrganizationRole.ADMIN,
        },
      });

      expect(
        hasAnyRole(session, [OrganizationRole.OWNER, OrganizationRole.ADMIN])
      ).toBe(true);
    });

    it('should return false if user has none of the specified roles', () => {
      const session = createMockSession({
        user: {
          ...createMockSession().user,
          role: OrganizationRole.VIEWER,
        },
      });

      expect(
        hasAnyRole(session, [OrganizationRole.OWNER, OrganizationRole.ADMIN])
      ).toBe(false);
    });

    it('should return false for null session', () => {
      expect(
        hasAnyRole(null, [OrganizationRole.OWNER, OrganizationRole.ADMIN])
      ).toBe(false);
    });

    it('should return false for empty roles array', () => {
      const session = createMockSession();
      expect(hasAnyRole(session, [])).toBe(false);
    });
  });

  describe('hasMinimumRole (role hierarchy)', () => {
    it('should respect role hierarchy: OWNER > ADMIN > MEMBER > VIEWER', () => {
      const ownerSession = createMockSession({
        user: {
          ...createMockSession().user,
          role: OrganizationRole.OWNER,
        },
      });
      const adminSession = createMockSession({
        user: {
          ...createMockSession().user,
          role: OrganizationRole.ADMIN,
        },
      });
      const memberSession = createMockSession({
        user: {
          ...createMockSession().user,
          role: OrganizationRole.MEMBER,
        },
      });
      const viewerSession = createMockSession({
        user: {
          ...createMockSession().user,
          role: OrganizationRole.VIEWER,
        },
      });

      // OWNER can access all levels
      expect(hasMinimumRole(ownerSession, OrganizationRole.OWNER)).toBe(true);
      expect(hasMinimumRole(ownerSession, OrganizationRole.ADMIN)).toBe(true);
      expect(hasMinimumRole(ownerSession, OrganizationRole.MEMBER)).toBe(true);
      expect(hasMinimumRole(ownerSession, OrganizationRole.VIEWER)).toBe(true);

      // ADMIN can access ADMIN, MEMBER, VIEWER (not OWNER)
      expect(hasMinimumRole(adminSession, OrganizationRole.OWNER)).toBe(false);
      expect(hasMinimumRole(adminSession, OrganizationRole.ADMIN)).toBe(true);
      expect(hasMinimumRole(adminSession, OrganizationRole.MEMBER)).toBe(true);
      expect(hasMinimumRole(adminSession, OrganizationRole.VIEWER)).toBe(true);

      // MEMBER can access MEMBER, VIEWER (not OWNER, ADMIN)
      expect(hasMinimumRole(memberSession, OrganizationRole.OWNER)).toBe(false);
      expect(hasMinimumRole(memberSession, OrganizationRole.ADMIN)).toBe(false);
      expect(hasMinimumRole(memberSession, OrganizationRole.MEMBER)).toBe(true);
      expect(hasMinimumRole(memberSession, OrganizationRole.VIEWER)).toBe(true);

      // VIEWER can only access VIEWER
      expect(hasMinimumRole(viewerSession, OrganizationRole.OWNER)).toBe(false);
      expect(hasMinimumRole(viewerSession, OrganizationRole.ADMIN)).toBe(false);
      expect(hasMinimumRole(viewerSession, OrganizationRole.MEMBER)).toBe(false);
      expect(hasMinimumRole(viewerSession, OrganizationRole.VIEWER)).toBe(true);
    });

    it('should return false for null session', () => {
      expect(hasMinimumRole(null, OrganizationRole.MEMBER)).toBe(false);
    });

    it('should return false for session without role', () => {
      const session = createMockSession({
        user: {
          ...createMockSession().user,
          role: undefined,
        },
      });

      expect(hasMinimumRole(session, OrganizationRole.MEMBER)).toBe(false);
    });
  });

  describe('canAccessOrganization (multi-tenancy)', () => {
    it('should allow access to own organization', () => {
      const session = createMockSession({
        user: {
          ...createMockSession().user,
          organizationId: 'org-123',
        },
      });

      expect(canAccessOrganization(session, 'org-123')).toBe(true);
    });

    it('should deny access to different organization', () => {
      const session = createMockSession({
        user: {
          ...createMockSession().user,
          organizationId: 'org-123',
        },
      });

      expect(canAccessOrganization(session, 'org-456')).toBe(false);
    });

    it('should return false for null session', () => {
      expect(canAccessOrganization(null, 'org-123')).toBe(false);
    });

    it('should return false for session without organizationId', () => {
      const session = createMockSession({
        user: {
          ...createMockSession().user,
          organizationId: undefined,
        },
      });

      expect(canAccessOrganization(session, 'org-123')).toBe(false);
    });

    it('should enforce strict equality (no substring matching)', () => {
      const session = createMockSession({
        user: {
          ...createMockSession().user,
          organizationId: 'org-123',
        },
      });

      expect(canAccessOrganization(session, 'org-1')).toBe(false);
      expect(canAccessOrganization(session, 'org-12')).toBe(false);
      expect(canAccessOrganization(session, 'org-1234')).toBe(false);
    });
  });

  describe('canEditBlock (Block Protocol stub)', () => {
    it('should deny VIEWER role from editing', () => {
      const session = createMockSession({
        user: {
          ...createMockSession().user,
          role: OrganizationRole.VIEWER,
        },
      });

      expect(canEditBlock(session, 'DealHeaderBlock')).toBe(false);
      expect(canEditBlock(session, 'CitationBlock')).toBe(false);
      expect(canEditBlock(session, 'AnyBlockType')).toBe(false);
    });

    it('should allow MEMBER role to edit', () => {
      const session = createMockSession({
        user: {
          ...createMockSession().user,
          role: OrganizationRole.MEMBER,
        },
      });

      expect(canEditBlock(session, 'DealHeaderBlock')).toBe(true);
    });

    it('should allow ADMIN role to edit', () => {
      const session = createMockSession({
        user: {
          ...createMockSession().user,
          role: OrganizationRole.ADMIN,
        },
      });

      expect(canEditBlock(session, 'DealHeaderBlock')).toBe(true);
    });

    it('should allow OWNER role to edit', () => {
      const session = createMockSession({
        user: {
          ...createMockSession().user,
          role: OrganizationRole.OWNER,
        },
      });

      expect(canEditBlock(session, 'DealHeaderBlock')).toBe(true);
    });

    it('should return false for null session', () => {
      expect(canEditBlock(null, 'DealHeaderBlock')).toBe(false);
    });

    it('should return false for unauthenticated session', () => {
      const session = createMockSession();
      // @ts-expect-error - Testing edge case
      session.user = null;

      expect(canEditBlock(session, 'DealHeaderBlock')).toBe(false);
    });
  });

  describe('getUserRole', () => {
    it('should return user role from session', () => {
      const session = createMockSession({
        user: {
          ...createMockSession().user,
          role: OrganizationRole.ADMIN,
        },
      });

      expect(getUserRole(session)).toBe(OrganizationRole.ADMIN);
    });

    it('should return null for null session', () => {
      expect(getUserRole(null)).toBeNull();
    });

    it('should return null for session without role', () => {
      const session = createMockSession({
        user: {
          ...createMockSession().user,
          role: undefined,
        },
      });

      expect(getUserRole(session)).toBeNull();
    });
  });

  describe('getUserOrganizationId', () => {
    it('should return organizationId from session', () => {
      const session = createMockSession({
        user: {
          ...createMockSession().user,
          organizationId: 'org-456',
        },
      });

      expect(getUserOrganizationId(session)).toBe('org-456');
    });

    it('should return null for null session', () => {
      expect(getUserOrganizationId(null)).toBeNull();
    });

    it('should return null for session without organizationId', () => {
      const session = createMockSession({
        user: {
          ...createMockSession().user,
          organizationId: undefined,
        },
      });

      expect(getUserOrganizationId(session)).toBeNull();
    });
  });
});
