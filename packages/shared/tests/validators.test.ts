import { describe, it, expect } from 'vitest'
import {
  createDealSchema,
  updateDealSchema,
  createUserSchema,
  loginSchema,
  createCompanySchema,
  createOrganizationSchema,
  uploadDocumentSchema,
  emailSchema,
  paginationSchema,
} from '../src/validators/index'
import { DealType, DealStage } from '../src/types/deal'
import { CompanyStatus } from '../src/types/company'
import { DocumentType } from '../src/types/document'

describe('Validators', () => {
  describe('Deal Validators', () => {
    it('should validate valid deal input', () => {
      const validDeal = {
        name: 'Project Alpha',
        organizationId: 'clh1234567890abcdefghijkl',
        type: DealType.ACQUISITION,
        stage: DealStage.SOURCING,
        currency: 'USD',
      }
      const result = createDealSchema.safeParse(validDeal)
      expect(result.success).toBe(true)
    })

    it('should fail with invalid definition', () => {
      const invalidDeal = {
        name: '',
        organizationId: 'invalid-id',
        type: 'INVALID_TYPE',
      }
      const result = createDealSchema.safeParse(invalidDeal)
      expect(result.success).toBe(false)
    })

    it('should validate update deal input with ID', () => {
      const updateData = {
        id: 'clh1234567890abcdefghijkl',
        name: 'Project Beta',
      }
      const result = updateDealSchema.safeParse(updateData)
      expect(result.success).toBe(true)
    })
  })

  describe('User Validators', () => {
    it('should validate valid user creation', () => {
      const user = {
        email: 'test@example.com',
        name: 'Test User',
      }
      const result = createUserSchema.safeParse(user)
      expect(result.success).toBe(true)
    })

    it('should validate login input', () => {
      const login = {
        email: 'test@example.com',
        password: 'password123',
      }
      const result = loginSchema.safeParse(login)
      expect(result.success).toBe(true)
    })

    it('should fail weak password', () => {
      const login = {
        email: 'test@example.com',
        password: '123',
      }
      const result = loginSchema.safeParse(login)
      expect(result.success).toBe(false)
    })

    it('should validate valid organization creation', () => {
      const org = {
        name: 'Test Org',
        slug: 'test-org',
      }
      const result = createOrganizationSchema.safeParse(org)
      expect(result.success).toBe(true)
    })
  })

  describe('Company Validators', () => {
    it('should validate valid company input', () => {
      const company = {
        name: 'Target Inc',
        organizationId: 'clh1234567890abcdefghijkl',
        status: CompanyStatus.PROSPECT,
      }
      const result = createCompanySchema.safeParse(company)
      expect(result.success).toBe(true)
    })

    it('should fail invalid url', () => {
      const company = {
        name: 'Target Inc',
        organizationId: 'clh1234567890abcdefghijkl',
        website: 'not-a-url',
      }
      const result = createCompanySchema.safeParse(company)
      expect(result.success).toBe(false)
    })
  })

  describe('Document Validators', () => {
    it('should validate upload input', () => {
      const doc = {
        organizationId: 'clh1234567890abcdefghijkl',
        name: 'Financials.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        type: DocumentType.FINANCIAL_STATEMENT,
      }
      const result = uploadDocumentSchema.safeParse(doc)
      expect(result.success).toBe(true)
    })
  })

  describe('Common Validators', () => {
    it('should validate email', () => {
      expect(emailSchema.safeParse('test@example.com').success).toBe(true)
      expect(emailSchema.safeParse('invalid').success).toBe(false)
    })

    it('should validate pagination defaults', () => {
      const result = paginationSchema.safeParse({})
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.pageSize).toBe(20)
      } else {
        throw new Error('Pagination defaults failed')
      }
    })
  })
})
