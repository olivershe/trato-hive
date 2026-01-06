/**
 * Databases Router Integration Tests
 *
 * Tests the full tRPC router using createCaller pattern.
 * Covers Database CRUD, Column management, and Entry operations.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { appRouter } from '../trpc/router';
import {
  createMockDatabase,
  createMockDatabaseEntry,
  createMockPrisma,
  createMockSession,
  resetMocks,
  TEST_IDS,
} from '../tests/setup';

// Type for test context
type TestContext = {
  session: ReturnType<typeof createMockSession> | null;
  db: ReturnType<typeof createMockPrisma>;
  organizationId?: string;
};

describe('Databases Router Integration', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    resetMocks();
    mockPrisma = createMockPrisma();
  });

  function createCaller(session = createMockSession()) {
    const ctx: TestContext = {
      session,
      db: mockPrisma,
      organizationId: session?.user?.organizationId || undefined,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return appRouter.createCaller(ctx as any);
  }

  // ===========================================================================
  // Database CRUD Tests
  // ===========================================================================

  describe('database.list', () => {
    it('should list databases for organization', async () => {
      const mockDatabases = [
        { ...createMockDatabase(), _count: { entries: 5 } },
        { ...createMockDatabase({ id: TEST_IDS.database2, name: 'Second DB' }), _count: { entries: 3 } },
      ];
      mockPrisma.database.findMany.mockResolvedValue(mockDatabases);
      mockPrisma.database.count.mockResolvedValue(2);

      const caller = createCaller();
      const result = await caller.database.list({ page: 1, pageSize: 20 });

      expect(result.items).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('should filter by search term', async () => {
      mockPrisma.database.findMany.mockResolvedValue([]);
      mockPrisma.database.count.mockResolvedValue(0);

      const caller = createCaller();
      await caller.database.list({ page: 1, pageSize: 20, search: 'tracker' });

      expect(mockPrisma.database.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: 'tracker', mode: 'insensitive' },
          }),
        })
      );
    });

    it('should paginate results correctly', async () => {
      mockPrisma.database.findMany.mockResolvedValue([]);
      mockPrisma.database.count.mockResolvedValue(50);

      const caller = createCaller();
      const result = await caller.database.list({ page: 2, pageSize: 10 });

      expect(mockPrisma.database.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
      expect(result.pagination.totalPages).toBe(5);
    });
  });

  describe('database.getById', () => {
    it('should return database with entries if belongs to organization', async () => {
      const mockDatabase = {
        ...createMockDatabase(),
        entries: [createMockDatabaseEntry()],
      };
      mockPrisma.database.findUnique.mockResolvedValue(mockDatabase);

      const caller = createCaller();
      const result = await caller.database.getById({ id: TEST_IDS.database });

      expect(result.id).toBe(TEST_IDS.database);
      expect(result.entries).toHaveLength(1);
    });

    it('should throw NOT_FOUND if database does not exist', async () => {
      mockPrisma.database.findUnique.mockResolvedValue(null);

      const caller = createCaller();
      await expect(caller.database.getById({ id: TEST_IDS.database })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('should throw NOT_FOUND if database belongs to different org', async () => {
      mockPrisma.database.findUnique.mockResolvedValue(
        createMockDatabase({ organizationId: 'clqdifferentorg123456789012' })
      );

      const caller = createCaller();
      await expect(caller.database.getById({ id: TEST_IDS.database })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });
  });

  describe('database.create', () => {
    it('should create database with organizationId from context', async () => {
      const mockDatabase = createMockDatabase();
      mockPrisma.database.create.mockResolvedValue(mockDatabase);
      mockPrisma.activity.create.mockResolvedValue({});

      const caller = createCaller();
      const result = await caller.database.create({
        name: 'New Database',
        schema: {
          columns: [
            { name: 'Name', type: 'TEXT' },
            { name: 'Status', type: 'SELECT', options: ['Active', 'Inactive'] },
          ],
        },
      });

      expect(result.id).toBe(TEST_IDS.database);
      expect(mockPrisma.database.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'New Database',
            organizationId: TEST_IDS.org,
            createdById: TEST_IDS.user,
          }),
        })
      );
      // Activity log should be called
      expect(mockPrisma.activity.create).toHaveBeenCalled();
    });

    it('should generate column IDs if not provided', async () => {
      const mockDatabase = createMockDatabase();
      mockPrisma.database.create.mockResolvedValue(mockDatabase);
      mockPrisma.activity.create.mockResolvedValue({});

      const caller = createCaller();
      await caller.database.create({
        name: 'Test DB',
        schema: {
          columns: [{ name: 'Task', type: 'TEXT' }],
        },
      });

      expect(mockPrisma.database.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            schema: expect.objectContaining({
              columns: expect.arrayContaining([
                expect.objectContaining({
                  id: expect.any(String),
                  name: 'Task',
                  type: 'TEXT',
                }),
              ]),
            }),
          }),
        })
      );
    });
  });

  describe('database.update', () => {
    it('should update database metadata', async () => {
      const existingDb = { ...createMockDatabase(), entries: [] };
      const updatedDb = createMockDatabase({ name: 'Updated Name', description: 'New desc' });

      mockPrisma.database.findUnique.mockResolvedValue(existingDb);
      mockPrisma.database.update.mockResolvedValue(updatedDb);

      const caller = createCaller();
      const result = await caller.database.update({
        id: TEST_IDS.database,
        name: 'Updated Name',
        description: 'New desc',
      });

      expect(result.name).toBe('Updated Name');
    });
  });

  describe('database.delete', () => {
    it('should delete database and log activity', async () => {
      const mockDatabase = { ...createMockDatabase(), entries: [] };
      mockPrisma.database.findUnique.mockResolvedValue(mockDatabase);
      mockPrisma.database.delete.mockResolvedValue(mockDatabase);
      mockPrisma.activity.create.mockResolvedValue({});

      const caller = createCaller();
      const result = await caller.database.delete({ id: TEST_IDS.database });

      expect(result.success).toBe(true);
      expect(mockPrisma.database.delete).toHaveBeenCalledWith({
        where: { id: TEST_IDS.database },
      });
      expect(mockPrisma.activity.create).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Column Management Tests
  // ===========================================================================

  describe('database.addColumn', () => {
    it('should add column to database schema', async () => {
      const existingDb = { ...createMockDatabase(), entries: [] };
      const updatedDb = createMockDatabase({
        schema: {
          columns: [
            { id: TEST_IDS.column, name: 'Task', type: 'TEXT' },
            { id: TEST_IDS.column2, name: 'Status', type: 'SELECT', options: ['To Do', 'Done'] },
            { id: 'new_col_id', name: 'Priority', type: 'SELECT', options: ['Low', 'High'] },
          ],
        },
      });

      mockPrisma.database.findUnique.mockResolvedValue(existingDb);
      mockPrisma.database.update.mockResolvedValue(updatedDb);

      const caller = createCaller();
      const result = await caller.database.addColumn({
        databaseId: TEST_IDS.database,
        column: { name: 'Priority', type: 'SELECT', options: ['Low', 'High'] },
      });

      expect(result.schema.columns).toHaveLength(3);
    });

    it('should add column at specific position', async () => {
      const existingDb = { ...createMockDatabase(), entries: [] };
      mockPrisma.database.findUnique.mockResolvedValue(existingDb);
      mockPrisma.database.update.mockResolvedValue(existingDb);

      const caller = createCaller();
      await caller.database.addColumn({
        databaseId: TEST_IDS.database,
        column: { name: 'New Col', type: 'TEXT' },
        position: 1,
      });

      expect(mockPrisma.database.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            schema: expect.objectContaining({
              columns: expect.arrayContaining([
                expect.objectContaining({ name: 'Task' }),
                expect.objectContaining({ name: 'New Col' }),
                expect.objectContaining({ name: 'Status' }),
              ]),
            }),
          }),
        })
      );
    });
  });

  describe('database.updateColumn', () => {
    it('should update column properties', async () => {
      const existingDb = { ...createMockDatabase(), entries: [] };
      mockPrisma.database.findUnique.mockResolvedValue(existingDb);
      mockPrisma.database.update.mockResolvedValue(existingDb);

      const caller = createCaller();
      await caller.database.updateColumn({
        databaseId: TEST_IDS.database,
        columnId: TEST_IDS.column,
        updates: { name: 'Renamed Task', width: 200 },
      });

      expect(mockPrisma.database.update).toHaveBeenCalled();
    });

    it('should throw NOT_FOUND for non-existent column', async () => {
      const existingDb = { ...createMockDatabase(), entries: [] };
      mockPrisma.database.findUnique.mockResolvedValue(existingDb);

      const caller = createCaller();
      await expect(
        caller.database.updateColumn({
          databaseId: TEST_IDS.database,
          columnId: 'non_existent_col',
          updates: { name: 'Test' },
        })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });
  });

  describe('database.deleteColumn', () => {
    it('should delete column from schema', async () => {
      const existingDb = { ...createMockDatabase(), entries: [] };
      const updatedDb = createMockDatabase({
        schema: {
          columns: [{ id: TEST_IDS.column, name: 'Task', type: 'TEXT' }],
        },
      });

      mockPrisma.database.findUnique.mockResolvedValue(existingDb);
      mockPrisma.database.update.mockResolvedValue(updatedDb);

      const caller = createCaller();
      const result = await caller.database.deleteColumn({
        databaseId: TEST_IDS.database,
        columnId: TEST_IDS.column2,
      });

      expect(result.schema.columns).toHaveLength(1);
    });

    it('should prevent deleting last column', async () => {
      const singleColumnDb = {
        ...createMockDatabase({
          schema: { columns: [{ id: TEST_IDS.column, name: 'Task', type: 'TEXT' }] },
        }),
        entries: [],
      };
      mockPrisma.database.findUnique.mockResolvedValue(singleColumnDb);

      const caller = createCaller();
      await expect(
        caller.database.deleteColumn({
          databaseId: TEST_IDS.database,
          columnId: TEST_IDS.column,
        })
      ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
      });
    });
  });

  // ===========================================================================
  // Entry CRUD Tests
  // ===========================================================================

  describe('database.createEntry', () => {
    it('should create entry with properties', async () => {
      const existingDb = { ...createMockDatabase(), entries: [] };
      const mockEntry = createMockDatabaseEntry();

      mockPrisma.database.findUnique.mockResolvedValue(existingDb);
      mockPrisma.databaseEntry.create.mockResolvedValue(mockEntry);

      const caller = createCaller();
      const result = await caller.database.createEntry({
        databaseId: TEST_IDS.database,
        properties: {
          [TEST_IDS.column]: 'New Task',
          [TEST_IDS.column2]: 'To Do',
        },
      });

      expect(result.id).toBe(TEST_IDS.entry);
      expect(mockPrisma.databaseEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            databaseId: TEST_IDS.database,
            createdById: TEST_IDS.user,
          }),
        })
      );
    });

    it('should create entry with AI suggestion metadata', async () => {
      const existingDb = { ...createMockDatabase(), entries: [] };
      const mockEntry = createMockDatabaseEntry({
        suggestedBy: 'document-agent',
        factIds: [TEST_IDS.fact],
      });

      mockPrisma.database.findUnique.mockResolvedValue(existingDb);
      mockPrisma.databaseEntry.create.mockResolvedValue(mockEntry);

      const caller = createCaller();
      const result = await caller.database.createEntry({
        databaseId: TEST_IDS.database,
        properties: { [TEST_IDS.column]: 'Extracted Data' },
        suggestedBy: 'document-agent',
        factIds: [TEST_IDS.fact],
      });

      expect(result.suggestedBy).toBe('document-agent');
      expect(result.factIds).toContain(TEST_IDS.fact);
    });
  });

  describe('database.updateEntry', () => {
    it('should update entry properties', async () => {
      const mockEntry = {
        ...createMockDatabaseEntry(),
        database: createMockDatabase(),
      };
      const updatedEntry = createMockDatabaseEntry({
        properties: { [TEST_IDS.column]: 'Updated Task' },
      });

      mockPrisma.databaseEntry.findUnique.mockResolvedValue(mockEntry);
      mockPrisma.databaseEntry.update.mockResolvedValue(updatedEntry);

      const caller = createCaller();
      const result = await caller.database.updateEntry({
        id: TEST_IDS.entry,
        properties: { [TEST_IDS.column]: 'Updated Task' },
      });

      expect(result.properties[TEST_IDS.column]).toBe('Updated Task');
    });

    it('should throw NOT_FOUND for entry in different org', async () => {
      const entryInDifferentOrg = {
        ...createMockDatabaseEntry(),
        database: createMockDatabase({ organizationId: 'clqdifferentorg123456789012' }),
      };
      mockPrisma.databaseEntry.findUnique.mockResolvedValue(entryInDifferentOrg);

      const caller = createCaller();
      await expect(
        caller.database.updateEntry({
          id: TEST_IDS.entry,
          properties: {},
        })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });
  });

  describe('database.updateCell', () => {
    it('should update single cell value', async () => {
      const mockEntry = {
        ...createMockDatabaseEntry(),
        database: createMockDatabase(),
      };
      const updatedEntry = createMockDatabaseEntry({
        properties: {
          [TEST_IDS.column]: 'Test Task',
          [TEST_IDS.column2]: 'Done',
        },
      });

      mockPrisma.databaseEntry.findUnique.mockResolvedValue(mockEntry);
      mockPrisma.databaseEntry.update.mockResolvedValue(updatedEntry);

      const caller = createCaller();
      const result = await caller.database.updateCell({
        entryId: TEST_IDS.entry,
        columnId: TEST_IDS.column2,
        value: 'Done',
      });

      expect(result.properties[TEST_IDS.column2]).toBe('Done');
    });
  });

  describe('database.deleteEntry', () => {
    it('should delete entry', async () => {
      const mockEntry = {
        ...createMockDatabaseEntry(),
        database: createMockDatabase(),
      };
      mockPrisma.databaseEntry.findUnique.mockResolvedValue(mockEntry);
      mockPrisma.databaseEntry.delete.mockResolvedValue(mockEntry);

      const caller = createCaller();
      const result = await caller.database.deleteEntry({ id: TEST_IDS.entry });

      expect(result.success).toBe(true);
      expect(mockPrisma.databaseEntry.delete).toHaveBeenCalledWith({
        where: { id: TEST_IDS.entry },
      });
    });
  });

  describe('database.duplicateEntry', () => {
    it('should duplicate entry with same properties', async () => {
      const originalEntry = {
        ...createMockDatabaseEntry(),
        database: createMockDatabase(),
      };
      const duplicatedEntry = createMockDatabaseEntry({ id: TEST_IDS.entry2 });

      mockPrisma.databaseEntry.findUnique.mockResolvedValue(originalEntry);
      mockPrisma.databaseEntry.create.mockResolvedValue(duplicatedEntry);

      const caller = createCaller();
      const result = await caller.database.duplicateEntry({ id: TEST_IDS.entry });

      expect(result.id).toBe(TEST_IDS.entry2);
      expect(mockPrisma.databaseEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            databaseId: originalEntry.databaseId,
            properties: originalEntry.properties,
            createdById: TEST_IDS.user,
          }),
        })
      );
    });
  });

  // ===========================================================================
  // Multi-tenancy Tests
  // ===========================================================================

  describe('Multi-tenancy enforcement', () => {
    it('should reject requests without session (UNAUTHORIZED)', async () => {
      const ctx: TestContext = {
        session: null,
        db: mockPrisma,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const caller = appRouter.createCaller(ctx as any);

      await expect(caller.database.list({ page: 1 })).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });

    it('should reject requests without organization (FORBIDDEN)', async () => {
      const sessionWithoutOrg = createMockSession();
      (sessionWithoutOrg.user as { organizationId?: string }).organizationId = undefined;

      const ctx: TestContext = {
        session: sessionWithoutOrg,
        db: mockPrisma,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const caller = appRouter.createCaller(ctx as any);

      await expect(caller.database.list({ page: 1 })).rejects.toMatchObject({
        code: 'FORBIDDEN',
      });
    });
  });
});
