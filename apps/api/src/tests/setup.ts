/**
 * Test Setup
 *
 * Mock factories and utilities for testing.
 */
import { vi } from 'vitest';
import type { Deal, DealStage, DealType, OrganizationRole, FactType } from '@trato-hive/db';

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
  doc2: 'clqe567890123nopqrstuvwxyz',
  fact: 'clq9012345678ijklmnopqrstu',
  fact2: 'clqf678901234opqrstuvwxyza',
  fact3: 'clqg789012345pqrstuvwxyzab',
  database: 'clqa123456789jklmnopqrstuv',
  database2: 'clqb234567890klmnopqrstuvw',
  entry: 'clqc345678901lmnopqrstuvwx',
  entry2: 'clqd456789012mnopqrstuvwxy',
  column: 'col_task_12345',
  column2: 'col_status_6789',
  column3: 'col_amount_1234',
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

// Database schema type for testing
interface DatabaseSchema {
  columns: Array<{
    id: string;
    name: string;
    type: string;
    options?: string[];
    width?: number;
  }>;
}

// Mock database type
interface MockDatabase {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  schema: DatabaseSchema;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

// Mock database entry type
interface MockDatabaseEntry {
  id: string;
  databaseId: string;
  properties: Record<string, unknown>;
  suggestedBy: string | null;
  factIds: string[];
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create a mock database for testing
 */
export function createMockDatabase(overrides?: Partial<MockDatabase>): MockDatabase {
  return {
    id: TEST_IDS.database,
    organizationId: TEST_IDS.org,
    name: 'Test Database',
    description: 'A test database',
    schema: {
      columns: [
        { id: TEST_IDS.column, name: 'Task', type: 'TEXT' },
        { id: TEST_IDS.column2, name: 'Status', type: 'SELECT', options: ['To Do', 'In Progress', 'Done'] },
      ],
    },
    createdById: TEST_IDS.user,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create a mock database entry for testing
 */
export function createMockDatabaseEntry(overrides?: Partial<MockDatabaseEntry>): MockDatabaseEntry {
  return {
    id: TEST_IDS.entry,
    databaseId: TEST_IDS.database,
    properties: {
      [TEST_IDS.column]: 'Test Task',
      [TEST_IDS.column2]: 'To Do',
    },
    suggestedBy: null,
    factIds: [],
    createdById: TEST_IDS.user,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// Mock fact type
interface MockFact {
  id: string;
  documentId: string | null;
  companyId: string | null;
  type: FactType;
  subject: string;
  predicate: string;
  object: string;
  confidence: number;
  sourceChunkId: string | null;
  sourceText: string | null;
  extractedBy: string;
  createdAt: Date;
  updatedAt: Date;
  document?: { id: string; name: string } | null;
}

/**
 * Create a mock fact for testing
 */
export function createMockFact(overrides?: Partial<MockFact>): MockFact {
  return {
    id: TEST_IDS.fact,
    documentId: TEST_IDS.doc,
    companyId: null,
    type: 'FINANCIAL_METRIC' as FactType,
    subject: 'Annual Revenue',
    predicate: 'is',
    object: '$10,000,000',
    confidence: 0.95,
    sourceChunkId: null,
    sourceText: 'The company reported annual revenue of $10,000,000.',
    extractedBy: 'claude-sonnet-4',
    createdAt: new Date(),
    updatedAt: new Date(),
    document: { id: TEST_IDS.doc, name: 'Financial Report.pdf' },
    ...overrides,
  };
}

// Mock document type
interface MockDocument {
  id: string;
  organizationId: string;
  companyId: string | null;
  dealId: string | null;
  uploadedById: string;
  name: string;
  type: string;
  status: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create a mock document for testing
 */
export function createMockDocument(overrides?: Partial<MockDocument>): MockDocument {
  return {
    id: TEST_IDS.doc,
    organizationId: TEST_IDS.org,
    companyId: null,
    dealId: TEST_IDS.deal,
    uploadedById: TEST_IDS.user,
    name: 'Financial Report.pdf',
    type: 'FINANCIAL',
    status: 'PROCESSED',
    fileSize: 1024000,
    mimeType: 'application/pdf',
    fileUrl: 'https://storage.example.com/docs/financial-report.pdf',
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
      findUnique: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
    },
    block: {
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    fact: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    company: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    document: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    activity: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    database: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    databaseEntry: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
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
