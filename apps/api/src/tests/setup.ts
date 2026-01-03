/**
 * Test Setup
 *
 * Mock factories and utilities for testing.
 */
import { vi } from 'vitest';
import type { Deal, DealStage, DealType, OrganizationRole } from '@trato-hive/db';

// Session type matching what's used in tRPC context
type Session = {
  user: {
    id: string;
    email: string;
    name: string;
    organizationId: string;
    role: OrganizationRole;
  };
  expires: string;
};

// Valid CUIDs for testing (generated with cuid())
export const TEST_IDS = {
  user: 'clq1234567890abcdefghijklm',
  org: 'clq2345678901bcdefghijklmn',
  deal: 'clq3456789012cdefghijklmno',
  deal2: 'clq4567890123defghijklmnop',
  company: 'clq5678901234efghijklmnopq',
  page: 'clq6789012345fghijklmnopqr',
  block: 'clq7890123456ghijklmnopqrs',
  doc: 'clq8901234567hijklmnopqrst',
  fact: 'clq9012345678ijklmnopqrstu',
} as const;

/**
 * Create a mock session for testing
 */
export function createMockSession(overrides?: Partial<Session>): Session {
  return {
    user: {
      id: TEST_IDS.user,
      email: 'test@example.com',
      name: 'Test User',
      organizationId: TEST_IDS.org,
      role: 'MEMBER' as OrganizationRole,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  } as Session;
}

/**
 * Create a mock deal for testing
 */
export function createMockDeal(overrides?: Partial<Deal>): Deal {
  return {
    id: TEST_IDS.deal,
    organizationId: TEST_IDS.org,
    companyId: null,
    name: 'Test Deal',
    type: 'ACQUISITION' as DealType,
    stage: 'SOURCING' as DealStage,
    value: null,
    currency: 'USD',
    probability: null,
    expectedCloseDate: null,
    actualCloseDate: null,
    description: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create a mock Prisma client
 */
export function createMockPrisma() {
  return {
    deal: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    page: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    block: {
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    fact: {
      findMany: vi.fn(),
    },
    company: {
      findUnique: vi.fn(),
    },
    activity: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn((fn: (tx: unknown) => Promise<unknown>) => fn(createMockPrisma())),
  };
}

/**
 * Reset all mocks between tests
 */
export function resetMocks() {
  vi.clearAllMocks();
}
