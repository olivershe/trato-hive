/**
 * Test Setup and Mock Factories
 *
 * Provides utilities for testing auth package:
 * - createMockSession: Factory for creating mock NextAuth sessions
 * - mockPrisma: Mocked Prisma client
 * - mockAuth: Mocked auth() function
 *
 * @see https://vitest.dev/guide/mocking.html
 */
import { vi } from 'vitest';
import type { Session } from 'next-auth';
import { OrganizationRole } from '@trato-hive/db';

/**
 * Mock session factory
 *
 * Creates a mock NextAuth session with default values.
 * Override any fields by passing them in the overrides parameter.
 *
 * @param overrides - Optional session fields to override
 * @returns Mock session object
 *
 * @example
 * ```typescript
 * const session = createMockSession({
 *   user: { ...createMockSession().user, role: OrganizationRole.ADMIN },
 * });
 * ```
 */
export function createMockSession(overrides?: Partial<Session>): Session {
  const defaultSession: Session = {
    user: {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      organizationId: 'org-123',
      role: OrganizationRole.MEMBER,
    },
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };

  return {
    ...defaultSession,
    ...overrides,
    user: {
      ...defaultSession.user,
      ...overrides?.user,
    },
  };
}

/**
 * Mock Prisma client
 *
 * Provides mocked Prisma methods for testing.
 * Use vi.fn() for each method to spy on calls and mock return values.
 *
 * @example
 * ```typescript
 * mockPrisma.user.findUnique.mockResolvedValue({
 *   id: 'user-123',
 *   email: 'test@example.com',
 * });
 * ```
 */
export const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  organizationMember: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  organization: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  account: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  session: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

/**
 * Mock auth() function
 *
 * Use this to mock the NextAuth auth() helper in tests.
 * Set the return value using mockResolvedValue() or mockReturnValue().
 *
 * @example
 * ```typescript
 * mockAuth.mockResolvedValue(createMockSession());
 * ```
 */
export const mockAuth = vi.fn();

/**
 * Reset all mocks
 *
 * Call this in beforeEach() to ensure clean state between tests.
 *
 * @example
 * ```typescript
 * import { resetMocks } from './setup';
 *
 * beforeEach(() => {
 *   resetMocks();
 * });
 * ```
 */
export function resetMocks() {
  vi.clearAllMocks();
  mockAuth.mockReset();

  // Reset all Prisma mocks
  Object.values(mockPrisma).forEach((model) => {
    Object.values(model).forEach((method) => {
      if (typeof method === 'function' && 'mockReset' in method) {
        (method as ReturnType<typeof vi.fn>).mockReset();
      }
    });
  });
}
