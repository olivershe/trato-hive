/**
 * Type Tests - Validate TypeScript type definitions
 * Note: These are compile-time tests to ensure types are properly structured
 */

import { describe, it, expect } from 'vitest'
import type {
  User,
  Organization,
  OrganizationMember,
  UserWithOrganizations,
  OrganizationWithMembers,
  Company,
  CompanyWithDeals,
  CompanyWithFacts,
  Deal,
  DealWithCompany,
  DealWithDocuments,
  DealWithFacts,
  Deal360,
  Document,
  DocumentChunk,
  DocumentWithChunks,
  DocumentWithFacts,
  Fact,
  FactWithSources,
  Activity,
  ActivityWithUser,
  ApiResponse,
  PaginatedResponse,
} from '../src/types/index'

import {
  OrganizationRole,
  CompanyStatus,
  DealStage,
  DealType,
  DocumentType,
  DocumentStatus,
  FactType,
  ActivityType,
  ErrorCode,
  AppError,
} from '../src/types/index'

describe('User Types', () => {
  it('should have correct User interface shape', () => {
    const user: User = {
      id: 'cm1user123',
      email: 'test@example.com',
      emailVerified: new Date(),
      name: 'Test User',
      image: 'https://example.com/avatar.jpg',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    expect(user.id).toBeDefined()
    expect(user.email).toBeDefined()
  })

  it('should have correct Organization interface shape', () => {
    const org: Organization = {
      id: 'cm1org123',
      name: 'Test Firm',
      slug: 'test-firm',
      description: 'A test PE firm',
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    expect(org.id).toBeDefined()
    expect(org.slug).toBeDefined()
  })

  it('should have OrganizationRole enum', () => {
    expect(OrganizationRole.OWNER).toBe('OWNER')
    expect(OrganizationRole.ADMIN).toBe('ADMIN')
    expect(OrganizationRole.MEMBER).toBe('MEMBER')
    expect(OrganizationRole.VIEWER).toBe('VIEWER')
  })

  it('should support UserWithOrganizations extended type', () => {
    const userWithOrgs: UserWithOrganizations = {
      id: 'cm1user123',
      email: 'test@example.com',
      emailVerified: null,
      name: 'Test User',
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      organizations: [
        {
          id: 'cm1member123',
          organizationId: 'cm1org123',
          userId: 'cm1user123',
          role: OrganizationRole.ADMIN,
          createdAt: new Date(),
          updatedAt: new Date(),
          organization: {
            id: 'cm1org123',
            name: 'Test Firm',
            slug: 'test-firm',
            description: null,
            image: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ],
    }

    expect(userWithOrgs.organizations).toHaveLength(1)
    expect(userWithOrgs.organizations[0].role).toBe(OrganizationRole.ADMIN)
  })
})

describe('Company Types', () => {
  it('should have CompanyStatus enum', () => {
    expect(CompanyStatus.PROSPECT).toBe('PROSPECT')
    expect(CompanyStatus.RESEARCHING).toBe('RESEARCHING')
    expect(CompanyStatus.ENGAGED).toBe('ENGAGED')
    expect(CompanyStatus.PIPELINE).toBe('PIPELINE')
    expect(CompanyStatus.ARCHIVED).toBe('ARCHIVED')
  })

  it('should have correct Company interface shape', () => {
    const company: Company = {
      id: 'cm1company123',
      organizationId: 'cm1org123',
      name: 'Target Corp',
      domain: 'target.com',
      description: 'A target company',
      industry: 'Technology',
      sector: 'SaaS',
      founded: 2020,
      employees: 50,
      revenue: 10000000,
      location: 'San Francisco, CA',
      website: 'https://target.com',
      linkedin: 'https://linkedin.com/company/target',
      status: CompanyStatus.PROSPECT,
      aiSummary: 'AI-generated summary',
      aiScore: 0.85,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    expect(company.name).toBe('Target Corp')
    expect(company.status).toBe(CompanyStatus.PROSPECT)
  })
})

describe('Deal Types', () => {
  it('should have DealStage enum', () => {
    expect(DealStage.SOURCING).toBe('SOURCING')
    expect(DealStage.INITIAL_REVIEW).toBe('INITIAL_REVIEW')
    expect(DealStage.PRELIMINARY_DUE_DILIGENCE).toBe('PRELIMINARY_DUE_DILIGENCE')
    expect(DealStage.DEEP_DUE_DILIGENCE).toBe('DEEP_DUE_DILIGENCE')
    expect(DealStage.NEGOTIATION).toBe('NEGOTIATION')
    expect(DealStage.CLOSING).toBe('CLOSING')
    expect(DealStage.CLOSED_WON).toBe('CLOSED_WON')
    expect(DealStage.CLOSED_LOST).toBe('CLOSED_LOST')
  })

  it('should have DealType enum', () => {
    expect(DealType.ACQUISITION).toBe('ACQUISITION')
    expect(DealType.INVESTMENT).toBe('INVESTMENT')
    expect(DealType.PARTNERSHIP).toBe('PARTNERSHIP')
    expect(DealType.OTHER).toBe('OTHER')
  })

  it('should have correct Deal interface shape', () => {
    const deal: Deal = {
      id: 'cm1deal123',
      organizationId: 'cm1org123',
      companyId: 'cm1company123',
      name: 'Project Sky',
      type: DealType.ACQUISITION,
      stage: DealStage.SOURCING,
      value: 25000000,
      currency: 'USD',
      probability: 60,
      expectedCloseDate: new Date('2025-12-31'),
      actualCloseDate: null,
      description: 'Strategic acquisition',
      notes: 'Promising target',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    expect(deal.name).toBe('Project Sky')
    expect(deal.type).toBe(DealType.ACQUISITION)
    expect(deal.stage).toBe(DealStage.SOURCING)
  })
})

describe('Document Types', () => {
  it('should have DocumentType enum', () => {
    expect(DocumentType.FINANCIAL_STATEMENT).toBe('FINANCIAL_STATEMENT')
    expect(DocumentType.CONTRACT).toBe('CONTRACT')
    expect(DocumentType.PRESENTATION).toBe('PRESENTATION')
    expect(DocumentType.MEMORANDUM).toBe('MEMORANDUM')
    expect(DocumentType.LEGAL_DOCUMENT).toBe('LEGAL_DOCUMENT')
    expect(DocumentType.TECHNICAL_DOCUMENT).toBe('TECHNICAL_DOCUMENT')
    expect(DocumentType.OTHER).toBe('OTHER')
  })

  it('should have DocumentStatus enum', () => {
    expect(DocumentStatus.UPLOADING).toBe('UPLOADING')
    expect(DocumentStatus.PROCESSING).toBe('PROCESSING')
    expect(DocumentStatus.PARSED).toBe('PARSED')
    expect(DocumentStatus.INDEXED).toBe('INDEXED')
    expect(DocumentStatus.FAILED).toBe('FAILED')
  })

  it('should have correct Document interface shape', () => {
    const doc: Document = {
      id: 'cm1doc123',
      organizationId: 'cm1org123',
      companyId: 'cm1company123',
      dealId: 'cm1deal123',
      uploadedById: 'cm1user123',
      name: 'Financial Statements Q4 2024.pdf',
      type: DocumentType.FINANCIAL_STATEMENT,
      status: DocumentStatus.INDEXED,
      fileSize: 1024000,
      mimeType: 'application/pdf',
      fileUrl: 's3://bucket/path/to/file.pdf',
      parsedAt: new Date(),
      indexedAt: new Date(),
      errorMessage: null,
      reductoJobId: 'job123',
      reductoData: { pages: 10 },
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    expect(doc.name).toBe('Financial Statements Q4 2024.pdf')
    expect(doc.status).toBe(DocumentStatus.INDEXED)
  })
})

describe('Fact Types', () => {
  it('should have FactType enum', () => {
    expect(FactType.FINANCIAL_METRIC).toBe('FINANCIAL_METRIC')
    expect(FactType.KEY_PERSON).toBe('KEY_PERSON')
    expect(FactType.PRODUCT).toBe('PRODUCT')
    expect(FactType.CUSTOMER).toBe('CUSTOMER')
    expect(FactType.RISK).toBe('RISK')
    expect(FactType.OPPORTUNITY).toBe('OPPORTUNITY')
    expect(FactType.OTHER).toBe('OTHER')
  })

  it('should have correct Fact interface shape', () => {
    const fact: Fact = {
      id: 'cm1fact123',
      documentId: 'cm1doc123',
      companyId: 'cm1company123',
      type: FactType.FINANCIAL_METRIC,
      subject: 'Revenue',
      predicate: 'equals',
      object: '$10M ARR',
      confidence: 0.95,
      sourceChunkId: 'cm1chunk123',
      sourceText: 'The company achieved $10M in annual recurring revenue.',
      extractedBy: 'claude-sonnet-4.5',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    expect(fact.type).toBe(FactType.FINANCIAL_METRIC)
    expect(fact.confidence).toBe(0.95)
  })
})

describe('Activity Types', () => {
  it('should have ActivityType enum', () => {
    expect(ActivityType.DOCUMENT_UPLOADED).toBe('DOCUMENT_UPLOADED')
    expect(ActivityType.DOCUMENT_PROCESSED).toBe('DOCUMENT_PROCESSED')
    expect(ActivityType.DEAL_CREATED).toBe('DEAL_CREATED')
    expect(ActivityType.DEAL_STAGE_CHANGED).toBe('DEAL_STAGE_CHANGED')
    expect(ActivityType.COMPANY_ADDED).toBe('COMPANY_ADDED')
    expect(ActivityType.AI_QUERY).toBe('AI_QUERY')
    expect(ActivityType.USER_ACTION).toBe('USER_ACTION')
  })

  it('should have correct Activity interface shape', () => {
    const activity: Activity = {
      id: 'cm1activity123',
      userId: 'cm1user123',
      dealId: 'cm1deal123',
      type: ActivityType.DEAL_CREATED,
      description: 'Created deal "Project Sky"',
      metadata: { dealName: 'Project Sky' },
      createdAt: new Date(),
    }

    expect(activity.type).toBe(ActivityType.DEAL_CREATED)
    expect(activity.description).toBeDefined()
  })
})

describe('API Types', () => {
  it('should have ErrorCode enum', () => {
    expect(ErrorCode.UNAUTHORIZED).toBe('UNAUTHORIZED')
    expect(ErrorCode.FORBIDDEN).toBe('FORBIDDEN')
    expect(ErrorCode.NOT_FOUND).toBe('NOT_FOUND')
    expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR')
    expect(ErrorCode.INTERNAL_ERROR).toBe('INTERNAL_ERROR')
    expect(ErrorCode.RATE_LIMIT_EXCEEDED).toBe('RATE_LIMIT_EXCEEDED')
    expect(ErrorCode.CONFLICT).toBe('CONFLICT')
    expect(ErrorCode.BAD_REQUEST).toBe('BAD_REQUEST')
    expect(ErrorCode.SERVICE_UNAVAILABLE).toBe('SERVICE_UNAVAILABLE')
  })

  it('should have correct ApiResponse interface shape', () => {
    const successResponse: ApiResponse<Deal> = {
      success: true,
      data: {
        id: 'cm1deal123',
        organizationId: 'cm1org123',
        companyId: null,
        name: 'Project Sky',
        type: DealType.ACQUISITION,
        stage: DealStage.SOURCING,
        value: null,
        currency: 'USD',
        probability: null,
        expectedCloseDate: null,
        actualCloseDate: null,
        description: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }

    expect(successResponse.success).toBe(true)
    expect(successResponse.data).toBeDefined()

    const errorResponse: ApiResponse = {
      success: false,
      error: {
        code: ErrorCode.NOT_FOUND,
        message: 'Deal not found',
        details: { dealId: 'cm1deal123' },
      },
    }

    expect(errorResponse.success).toBe(false)
    expect(errorResponse.error?.code).toBe(ErrorCode.NOT_FOUND)
  })

  it('should have correct PaginatedResponse interface shape', () => {
    const paginatedDeals: PaginatedResponse<Deal> = {
      items: [],
      pagination: {
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 0,
      },
    }

    expect(paginatedDeals.items).toEqual([])
    expect(paginatedDeals.pagination.page).toBe(1)
  })

  it('should have AppError class', () => {
    const error = new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid input', { field: 'email' })

    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('AppError')
    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR)
    expect(error.message).toBe('Invalid input')
    expect(error.details).toEqual({ field: 'email' })
  })
})
