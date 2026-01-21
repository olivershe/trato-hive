/**
 * DealsDatabaseService Unit Tests
 *
 * Tests for the org-level Deals Database service.
 * Phase 12: Deals Database Architecture Migration
 *
 * TASK-142: Unit Tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TRPCError } from '@trpc/server'
import { DealsDatabaseService } from './dealsDatabase.service'
import {
  createMockPrisma,
  createMockDatabase,
  createMockDatabaseEntry,
  resetMocks,
  TEST_IDS,
} from '../tests/setup'
import { DEALS_DATABASE_SCHEMA, DEALS_DATABASE_NAME } from '@trato-hive/shared'

describe('DealsDatabaseService', () => {
  let service: DealsDatabaseService
  let mockPrisma: ReturnType<typeof createMockPrisma>

  beforeEach(() => {
    resetMocks()
    mockPrisma = createMockPrisma()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    service = new DealsDatabaseService(mockPrisma as any)
  })

  // ===========================================================================
  // getOrCreateDealsDatabase Tests
  // ===========================================================================

  describe('getOrCreateDealsDatabase', () => {
    it('should return existing Deals Database if found', async () => {
      const existingDb = {
        ...createMockDatabase({
          name: DEALS_DATABASE_NAME,
          isOrgLevel: true,
        }),
        isOrgLevel: true,
        pageId: TEST_IDS.page,
      }
      mockPrisma.database.findFirst.mockResolvedValue(existingDb)

      const result = await service.getOrCreateDealsDatabase(TEST_IDS.org, TEST_IDS.user)

      expect(result.id).toBe(existingDb.id)
      expect(result.name).toBe(DEALS_DATABASE_NAME)
      expect(result.isOrgLevel).toBe(true)
      expect(mockPrisma.$transaction).not.toHaveBeenCalled()
    })

    it('should create new Deals Database if not found', async () => {
      mockPrisma.database.findFirst.mockResolvedValue(null)

      const mockPage = { id: TEST_IDS.page, organizationId: TEST_IDS.org, title: DEALS_DATABASE_NAME }
      const mockDatabase = {
        id: TEST_IDS.database,
        organizationId: TEST_IDS.org,
        name: DEALS_DATABASE_NAME,
        description: 'Organization deals pipeline powered by Notion-style database',
        schema: DEALS_DATABASE_SCHEMA,
        isOrgLevel: true,
        pageId: TEST_IDS.page,
        createdById: TEST_IDS.user,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const pageCreate = vi.fn().mockResolvedValue(mockPage)
      const databaseCreate = vi.fn().mockResolvedValue(mockDatabase)

      mockPrisma.$transaction.mockImplementation(async (fn) => {
        const tx = {
          page: { create: pageCreate },
          database: { create: databaseCreate },
        }
        return fn(tx)
      })

      const result = await service.getOrCreateDealsDatabase(TEST_IDS.org, TEST_IDS.user)

      expect(result.name).toBe(DEALS_DATABASE_NAME)
      expect(result.isOrgLevel).toBe(true)
      expect(pageCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: TEST_IDS.org,
          title: DEALS_DATABASE_NAME,
          icon: '📊',
          isDatabase: true,
        }),
      })
      expect(databaseCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: DEALS_DATABASE_NAME,
          organizationId: TEST_IDS.org,
          isOrgLevel: true,
          createdById: TEST_IDS.user,
        }),
      })
    })
  })

  // ===========================================================================
  // getDealsDatabase Tests
  // ===========================================================================

  describe('getDealsDatabase', () => {
    it('should return Deals Database if found', async () => {
      const existingDb = {
        ...createMockDatabase({
          name: DEALS_DATABASE_NAME,
          isOrgLevel: true,
        }),
        isOrgLevel: true,
        pageId: TEST_IDS.page,
      }
      mockPrisma.database.findFirst.mockResolvedValue(existingDb)

      const result = await service.getDealsDatabase(TEST_IDS.org)

      expect(result).not.toBeNull()
      expect(result?.name).toBe(DEALS_DATABASE_NAME)
      expect(mockPrisma.database.findFirst).toHaveBeenCalledWith({
        where: {
          organizationId: TEST_IDS.org,
          isOrgLevel: true,
          name: DEALS_DATABASE_NAME,
        },
      })
    })

    it('should return null if Deals Database not found', async () => {
      mockPrisma.database.findFirst.mockResolvedValue(null)

      const result = await service.getDealsDatabase(TEST_IDS.org)

      expect(result).toBeNull()
    })
  })

  // ===========================================================================
  // createDealEntry Tests
  // ===========================================================================

  describe('createDealEntry', () => {
    it('should create entry with properties', async () => {
      const mockDealsDb = {
        ...createMockDatabase({ name: DEALS_DATABASE_NAME }),
        isOrgLevel: true,
        pageId: TEST_IDS.page,
        schema: DEALS_DATABASE_SCHEMA,
      }
      const mockPage = { id: 'clqnewpage12345678901234', title: 'New Deal' }
      const mockEntry = {
        ...createMockDatabaseEntry(),
        properties: { name: 'New Deal', stage: 'SOURCING' },
      }

      mockPrisma.database.findFirst.mockResolvedValue(mockDealsDb)

      const pageCreate = vi.fn().mockResolvedValue(mockPage)
      const entryCreate = vi.fn().mockResolvedValue(mockEntry)

      mockPrisma.$transaction.mockImplementation(async (fn) => {
        const tx = {
          page: { create: pageCreate },
          databaseEntry: { create: entryCreate },
        }
        return fn(tx)
      })

      const result = await service.createDealEntry(
        { properties: { name: 'New Deal', stage: 'SOURCING' } },
        TEST_IDS.org,
        TEST_IDS.user
      )

      expect(result.properties.name).toBe('New Deal')
      expect(result.properties.stage).toBe('SOURCING')
      expect(entryCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          databaseId: mockDealsDb.id,
          createdById: TEST_IDS.user,
        }),
      })
    })
  })

  // ===========================================================================
  // updateDealEntry Tests
  // ===========================================================================

  describe('updateDealEntry', () => {
    it('should update entry properties', async () => {
      const existingEntry = {
        ...createMockDatabaseEntry(),
        properties: { name: 'Old Name', stage: 'SOURCING' },
        database: createMockDatabase({ organizationId: TEST_IDS.org }),
        pageId: TEST_IDS.page,
      }
      const updatedEntry = {
        ...existingEntry,
        properties: { name: 'Updated Name', stage: 'INITIAL_REVIEW' },
      }

      mockPrisma.databaseEntry.findUnique.mockResolvedValue(existingEntry)
      mockPrisma.databaseEntry.update.mockResolvedValue(updatedEntry)
      mockPrisma.page.update.mockResolvedValue({})

      const result = await service.updateDealEntry(
        TEST_IDS.entry,
        { name: 'Updated Name', stage: 'INITIAL_REVIEW' },
        TEST_IDS.org
      )

      expect(result.properties.name).toBe('Updated Name')
      expect(result.properties.stage).toBe('INITIAL_REVIEW')
      expect(mockPrisma.page.update).toHaveBeenCalledWith({
        where: { id: TEST_IDS.page },
        data: { title: 'Updated Name' },
      })
    })

    it('should throw NOT_FOUND for non-existent entry', async () => {
      mockPrisma.databaseEntry.findUnique.mockResolvedValue(null)

      await expect(
        service.updateDealEntry(TEST_IDS.entry, { name: 'Test' }, TEST_IDS.org)
      ).rejects.toThrow(TRPCError)
      await expect(
        service.updateDealEntry(TEST_IDS.entry, { name: 'Test' }, TEST_IDS.org)
      ).rejects.toMatchObject({ code: 'NOT_FOUND' })
    })

    it('should throw NOT_FOUND for entry in different org', async () => {
      const entryInDifferentOrg = {
        ...createMockDatabaseEntry(),
        database: createMockDatabase({ organizationId: 'clqdifferentorg123456789012' }),
      }
      mockPrisma.databaseEntry.findUnique.mockResolvedValue(entryInDifferentOrg)

      await expect(
        service.updateDealEntry(TEST_IDS.entry, { name: 'Test' }, TEST_IDS.org)
      ).rejects.toMatchObject({ code: 'NOT_FOUND' })
    })
  })

  // ===========================================================================
  // getEntryById Tests
  // ===========================================================================

  describe('getEntryById', () => {
    it('should return entry with schema if belongs to org', async () => {
      const mockEntry = {
        ...createMockDatabaseEntry(),
        database: {
          ...createMockDatabase({ organizationId: TEST_IDS.org }),
          schema: DEALS_DATABASE_SCHEMA,
        },
        page: { id: TEST_IDS.page, title: 'Test Deal' },
        deal: { id: TEST_IDS.deal, name: 'Test Deal', organizationId: TEST_IDS.org },
      }
      mockPrisma.databaseEntry.findUnique.mockResolvedValue(mockEntry)

      const result = await service.getEntryById(TEST_IDS.entry, TEST_IDS.org)

      expect(result.id).toBe(TEST_IDS.entry)
      expect(result.schema).toBeDefined()
      expect(result.deal?.id).toBe(TEST_IDS.deal)
    })

    it('should throw NOT_FOUND for non-existent entry', async () => {
      mockPrisma.databaseEntry.findUnique.mockResolvedValue(null)

      await expect(service.getEntryById(TEST_IDS.entry, TEST_IDS.org)).rejects.toMatchObject({
        code: 'NOT_FOUND',
      })
    })

    it('should throw NOT_FOUND for entry in different org', async () => {
      const entryInDifferentOrg = {
        ...createMockDatabaseEntry(),
        database: createMockDatabase({ organizationId: 'clqdifferentorg123456789012' }),
      }
      mockPrisma.databaseEntry.findUnique.mockResolvedValue(entryInDifferentOrg)

      await expect(service.getEntryById(TEST_IDS.entry, TEST_IDS.org)).rejects.toMatchObject({
        code: 'NOT_FOUND',
      })
    })
  })

  // ===========================================================================
  // listDeals Tests
  // ===========================================================================

  describe('listDeals', () => {
    it('should return empty list if no Deals Database exists', async () => {
      mockPrisma.database.findFirst.mockResolvedValue(null)

      const result = await service.listDeals(TEST_IDS.org)

      expect(result.items).toHaveLength(0)
      expect(result.pagination.total).toBe(0)
    })

    it('should return paginated deal entries', async () => {
      const mockDealsDb = {
        ...createMockDatabase({ name: DEALS_DATABASE_NAME }),
        isOrgLevel: true,
        pageId: TEST_IDS.page,
      }
      const mockEntries = [
        { ...createMockDatabaseEntry(), deal: { id: TEST_IDS.deal, name: 'Deal 1', organizationId: TEST_IDS.org } },
        { ...createMockDatabaseEntry({ id: TEST_IDS.entry2 }), deal: { id: TEST_IDS.deal2, name: 'Deal 2', organizationId: TEST_IDS.org } },
      ]

      mockPrisma.database.findFirst.mockResolvedValue(mockDealsDb)
      mockPrisma.databaseEntry.findMany.mockResolvedValue(mockEntries)
      mockPrisma.databaseEntry.count.mockResolvedValue(2)

      const result = await service.listDeals(TEST_IDS.org, { page: 1, pageSize: 10 })

      expect(result.items).toHaveLength(2)
      expect(result.pagination.total).toBe(2)
      expect(result.pagination.totalPages).toBe(1)
    })

    it('should apply pagination correctly', async () => {
      const mockDealsDb = {
        ...createMockDatabase({ name: DEALS_DATABASE_NAME }),
        isOrgLevel: true,
        pageId: TEST_IDS.page,
      }

      mockPrisma.database.findFirst.mockResolvedValue(mockDealsDb)
      mockPrisma.databaseEntry.findMany.mockResolvedValue([])
      mockPrisma.databaseEntry.count.mockResolvedValue(25)

      const result = await service.listDeals(TEST_IDS.org, { page: 2, pageSize: 10 })

      expect(mockPrisma.databaseEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      )
      expect(result.pagination.totalPages).toBe(3)
    })
  })

  // ===========================================================================
  // getSchema Tests
  // ===========================================================================

  describe('getSchema', () => {
    it('should return database schema if exists', async () => {
      const customSchema = {
        columns: [
          { id: 'name', name: 'Name', type: 'TEXT', width: 200 },
          { id: 'custom', name: 'Custom Field', type: 'TEXT', width: 150 },
        ],
      }
      const mockDealsDb = {
        ...createMockDatabase({ name: DEALS_DATABASE_NAME }),
        isOrgLevel: true,
        pageId: TEST_IDS.page,
        schema: customSchema,
      }
      mockPrisma.database.findFirst.mockResolvedValue(mockDealsDb)

      const result = await service.getSchema(TEST_IDS.org)

      expect(result.columns).toHaveLength(2)
      expect(result.columns[1].name).toBe('Custom Field')
    })

    it('should return default schema if no database exists', async () => {
      mockPrisma.database.findFirst.mockResolvedValue(null)

      const result = await service.getSchema(TEST_IDS.org)

      expect(result).toEqual(DEALS_DATABASE_SCHEMA)
    })
  })

  // ===========================================================================
  // Static Method Tests
  // ===========================================================================

  describe('mapDealToProperties', () => {
    it('should map deal fields to properties format', () => {
      const deal = {
        name: 'Test Deal',
        stage: 'SOURCING',
        type: 'ACQUISITION',
        priority: 'HIGH',
        value: 1000000,
        probability: 75,
        source: 'Referral',
        expectedCloseDate: new Date('2026-06-15'),
        leadPartnerId: TEST_IDS.user,
      }

      const result = DealsDatabaseService.mapDealToProperties(deal)

      expect(result.name).toBe('Test Deal')
      expect(result.stage).toBe('SOURCING')
      expect(result.type).toBe('ACQUISITION')
      expect(result.priority).toBe('HIGH')
      expect(result.value).toBe(1000000)
      expect(result.probability).toBe(75)
      expect(result.source).toBe('Referral')
      expect(result.expectedCloseDate).toBe('2026-06-15T00:00:00.000Z')
      expect(result.leadPartner).toBe(TEST_IDS.user)
    })

    it('should handle null and undefined values', () => {
      const deal = {
        name: 'Minimal Deal',
        stage: 'SOURCING',
      }

      const result = DealsDatabaseService.mapDealToProperties(deal)

      expect(result.name).toBe('Minimal Deal')
      expect(result.stage).toBe('SOURCING')
      expect(result.priority).toBe('NONE')
      expect(result.value).toBeUndefined()
      expect(result.expectedCloseDate).toBeNull()
    })

    it('should parse string value to number', () => {
      const deal = {
        name: 'Test Deal',
        stage: 'SOURCING',
        value: '500000.50',
      }

      const result = DealsDatabaseService.mapDealToProperties(deal)

      expect(result.value).toBe(500000.5)
    })
  })

  describe('mapPropertiesToDealUpdate', () => {
    it('should map properties back to deal update format', () => {
      const properties = {
        name: 'Updated Deal',
        stage: 'DEEP_DUE_DILIGENCE',
        value: 2000000,
        expectedCloseDate: '2026-12-31T00:00:00.000Z',
        leadPartner: TEST_IDS.user,
      }

      const result = DealsDatabaseService.mapPropertiesToDealUpdate(properties)

      expect(result.name).toBe('Updated Deal')
      expect(result.stage).toBe('DEEP_DUE_DILIGENCE')
      expect(result.value).toBe(2000000)
      expect(result.expectedCloseDate).toEqual(new Date('2026-12-31T00:00:00.000Z'))
      expect(result.leadPartnerId).toBe(TEST_IDS.user)
    })

    it('should only include defined properties', () => {
      const properties = {
        name: 'Only Name',
      }

      const result = DealsDatabaseService.mapPropertiesToDealUpdate(properties)

      expect(result.name).toBe('Only Name')
      expect(result.stage).toBeUndefined()
      expect(result.value).toBeUndefined()
    })

    it('should handle null expectedCloseDate', () => {
      const properties = {
        name: 'Test',
        expectedCloseDate: null,
      }

      const result = DealsDatabaseService.mapPropertiesToDealUpdate(properties)

      expect(result.expectedCloseDate).toBeNull()
    })
  })
})
