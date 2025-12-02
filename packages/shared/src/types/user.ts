/**
 * User & Organization Types
 * Based on Prisma schema: packages/db/prisma/schema.prisma
 */

/**
 * User - Core authentication user model
 */
export interface User {
  id: string
  email: string
  emailVerified: Date | null
  name: string | null
  image: string | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Organization - Multi-tenancy root entity
 */
export interface Organization {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  createdAt: Date
  updatedAt: Date
}

/**
 * OrganizationRole - RBAC roles within an organization
 */
export const OrganizationRole = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
  VIEWER: 'VIEWER',
} as const

export type OrganizationRoleValue = (typeof OrganizationRole)[keyof typeof OrganizationRole]

/**
 * OrganizationMember - User-Organization mapping with role
 */
export interface OrganizationMember {
  id: string
  organizationId: string
  userId: string
  role: OrganizationRoleValue
  createdAt: Date
  updatedAt: Date
}

/**
 * User with their organization memberships
 * Used for: Auth context, user profile display
 */
export interface UserWithOrganizations extends User {
  organizations: Array<
    OrganizationMember & {
      organization: Organization
    }
  >
}

/**
 * Organization with all members
 * Used for: Organization settings page, member management
 */
export interface OrganizationWithMembers extends Organization {
  members: Array<
    OrganizationMember & {
      user: User
    }
  >
}
