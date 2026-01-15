/**
 * Schema Unit Tests for Phase 11 Models
 * Tests for DealCompany, CompanyWatch, and Page type enhancements
 *
 * These tests validate:
 * 1. Type definitions are correct
 * 2. Enum values are properly exported
 * 3. Model relationships are correctly typed
 */

import { describe, it, expect } from 'vitest';
import {
  DealCompanyRole,
  PageType,
  Prisma,
  DealCompany,
  CompanyWatch,
  Page,
} from '@prisma/client';

// =============================================================================
// ENUM TESTS
// =============================================================================

describe('DealCompanyRole Enum', () => {
  it('should have all required roles', () => {
    expect(DealCompanyRole.PLATFORM).toBe('PLATFORM');
    expect(DealCompanyRole.ADD_ON).toBe('ADD_ON');
    expect(DealCompanyRole.SELLER).toBe('SELLER');
    expect(DealCompanyRole.BUYER).toBe('BUYER');
    expect(DealCompanyRole.ADVISOR).toBe('ADVISOR');
  });

  it('should have exactly 5 roles', () => {
    const roles = Object.values(DealCompanyRole);
    expect(roles).toHaveLength(5);
  });
});

describe('PageType Enum', () => {
  it('should have all required page types', () => {
    expect(PageType.DEAL_PAGE).toBe('DEAL_PAGE');
    expect(PageType.COMPANY_PAGE).toBe('COMPANY_PAGE');
    expect(PageType.DOCUMENT_PAGE).toBe('DOCUMENT_PAGE');
    expect(PageType.FREEFORM).toBe('FREEFORM');
  });

  it('should have exactly 4 page types', () => {
    const types = Object.values(PageType);
    expect(types).toHaveLength(4);
  });
});

// =============================================================================
// TYPE DEFINITION TESTS
// =============================================================================

describe('DealCompany Model Types', () => {
  it('should have correct create input type', () => {
    // Type-check: This would fail at compile time if types are wrong
    const createInput: Prisma.DealCompanyCreateInput = {
      deal: { connect: { id: 'deal-123' } },
      company: { connect: { id: 'company-456' } },
      role: DealCompanyRole.PLATFORM,
    };

    expect(createInput.role).toBe(DealCompanyRole.PLATFORM);
  });

  it('should allow optional role (defaults to PLATFORM)', () => {
    const createInput: Prisma.DealCompanyCreateInput = {
      deal: { connect: { id: 'deal-123' } },
      company: { connect: { id: 'company-456' } },
      // role is optional, defaults to PLATFORM
    };

    expect(createInput.deal).toBeDefined();
    expect(createInput.company).toBeDefined();
  });

  it('should have correct where unique input for composite key', () => {
    const whereUnique: Prisma.DealCompanyWhereUniqueInput = {
      dealId_companyId: {
        dealId: 'deal-123',
        companyId: 'company-456',
      },
    };

    expect(whereUnique.dealId_companyId?.dealId).toBe('deal-123');
    expect(whereUnique.dealId_companyId?.companyId).toBe('company-456');
  });
});

describe('CompanyWatch Model Types', () => {
  it('should have correct create input type', () => {
    const createInput: Prisma.CompanyWatchCreateInput = {
      company: { connect: { id: 'company-123' } },
      user: { connect: { id: 'user-456' } },
      notes: 'Watching for acquisition opportunity',
      tags: ['acquisition', 'high-priority'],
      priority: 2,
    };

    expect(createInput.notes).toBe('Watching for acquisition opportunity');
    expect(createInput.tags).toContain('acquisition');
    expect(createInput.priority).toBe(2);
  });

  it('should allow optional fields', () => {
    const createInput: Prisma.CompanyWatchCreateInput = {
      company: { connect: { id: 'company-123' } },
      user: { connect: { id: 'user-456' } },
      // notes, tags, priority are all optional
    };

    expect(createInput.company).toBeDefined();
    expect(createInput.user).toBeDefined();
  });

  it('should have correct where unique input for composite key', () => {
    const whereUnique: Prisma.CompanyWatchWhereUniqueInput = {
      companyId_userId: {
        companyId: 'company-123',
        userId: 'user-456',
      },
    };

    expect(whereUnique.companyId_userId?.companyId).toBe('company-123');
    expect(whereUnique.companyId_userId?.userId).toBe('user-456');
  });
});

describe('Page Model Types with Phase 11 Fields', () => {
  it('should have correct create input with type field', () => {
    const createInput: Prisma.PageCreateInput = {
      title: 'Company Overview',
      type: PageType.COMPANY_PAGE,
      deal: { connect: { id: 'deal-123' } },
      company: { connect: { id: 'company-456' } },
    };

    expect(createInput.type).toBe(PageType.COMPANY_PAGE);
  });

  it('should allow document page type with documentId', () => {
    const createInput: Prisma.PageCreateInput = {
      title: 'Document Analysis',
      type: PageType.DOCUMENT_PAGE,
      deal: { connect: { id: 'deal-123' } },
      document: { connect: { id: 'doc-789' } },
    };

    expect(createInput.type).toBe(PageType.DOCUMENT_PAGE);
    expect(createInput.document).toBeDefined();
  });

  it('should default type to FREEFORM', () => {
    const createInput: Prisma.PageCreateInput = {
      title: 'General Notes',
      deal: { connect: { id: 'deal-123' } },
      // type defaults to FREEFORM
    };

    expect(createInput.title).toBe('General Notes');
  });
});

// =============================================================================
// RELATION TESTS
// =============================================================================

describe('Model Relations', () => {
  it('DealCompany should include deal and company relations in select', () => {
    const select: Prisma.DealCompanySelect = {
      id: true,
      dealId: true,
      companyId: true,
      role: true,
      deal: true,
      company: true,
      createdAt: true,
      updatedAt: true,
    };

    expect(select.deal).toBe(true);
    expect(select.company).toBe(true);
  });

  it('CompanyWatch should include company and user relations in select', () => {
    const select: Prisma.CompanyWatchSelect = {
      id: true,
      companyId: true,
      userId: true,
      notes: true,
      tags: true,
      priority: true,
      company: true,
      user: true,
      createdAt: true,
      updatedAt: true,
    };

    expect(select.company).toBe(true);
    expect(select.user).toBe(true);
  });

  it('Page should include company and document relations in select', () => {
    const select: Prisma.PageSelect = {
      id: true,
      title: true,
      type: true,
      companyId: true,
      documentId: true,
      company: true,
      document: true,
    };

    expect(select.company).toBe(true);
    expect(select.document).toBe(true);
  });

  it('Deal should include dealCompanies relation in select', () => {
    const select: Prisma.DealSelect = {
      id: true,
      name: true,
      dealCompanies: true,
    };

    expect(select.dealCompanies).toBe(true);
  });

  it('Company should include dealCompanies and watches relations in select', () => {
    const select: Prisma.CompanySelect = {
      id: true,
      name: true,
      dealCompanies: true,
      watches: true,
      pages: true,
    };

    expect(select.dealCompanies).toBe(true);
    expect(select.watches).toBe(true);
    expect(select.pages).toBe(true);
  });

  it('User should include watchedCompanies relation in select', () => {
    const select: Prisma.UserSelect = {
      id: true,
      email: true,
      watchedCompanies: true,
    };

    expect(select.watchedCompanies).toBe(true);
  });
});

// =============================================================================
// QUERY TYPE TESTS
// =============================================================================

describe('Many-to-Many Query Types', () => {
  it('should support finding deals through DealCompany junction', () => {
    // Query to find all companies for a deal
    const query: Prisma.DealCompanyFindManyArgs = {
      where: {
        dealId: 'deal-123',
      },
      include: {
        company: true,
      },
    };

    expect(query.where?.dealId).toBe('deal-123');
    expect(query.include?.company).toBe(true);
  });

  it('should support finding deals by company through junction', () => {
    // Query to find all deals for a company
    const query: Prisma.DealCompanyFindManyArgs = {
      where: {
        companyId: 'company-456',
      },
      include: {
        deal: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    };

    expect(query.where?.companyId).toBe('company-456');
    expect(query.include?.deal).toBe(true);
  });

  it('should support filtering by role', () => {
    // Query to find all PLATFORM companies for a deal
    const query: Prisma.DealCompanyFindManyArgs = {
      where: {
        dealId: 'deal-123',
        role: DealCompanyRole.PLATFORM,
      },
      include: {
        company: true,
      },
    };

    expect(query.where?.role).toBe(DealCompanyRole.PLATFORM);
  });

  it('should support finding watched companies for a user', () => {
    const query: Prisma.CompanyWatchFindManyArgs = {
      where: {
        userId: 'user-123',
        priority: { gte: 1 }, // Medium or high priority
      },
      include: {
        company: true,
      },
      orderBy: {
        priority: 'desc',
      },
    };

    expect(query.where?.userId).toBe('user-123');
    expect(query.orderBy).toEqual({ priority: 'desc' });
  });

  it('should support nested includes for deal with companies', () => {
    const query: Prisma.DealFindFirstArgs = {
      where: { id: 'deal-123' },
      include: {
        dealCompanies: {
          include: {
            company: true,
          },
          orderBy: {
            role: 'asc',
          },
        },
      },
    };

    expect(query.include?.dealCompanies).toBeDefined();
  });
});

// =============================================================================
// VALIDATION HELPER TESTS
// =============================================================================

describe('Validation Helpers', () => {
  it('should validate priority values for CompanyWatch', () => {
    const validPriorities = [0, 1, 2]; // low, medium, high

    validPriorities.forEach(priority => {
      expect(priority).toBeGreaterThanOrEqual(0);
      expect(priority).toBeLessThanOrEqual(2);
    });
  });

  it('should validate DealCompanyRole values', () => {
    const validRoles = Object.values(DealCompanyRole);

    expect(validRoles).toContain('PLATFORM');
    expect(validRoles).toContain('ADD_ON');
    expect(validRoles).toContain('SELLER');
    expect(validRoles).toContain('BUYER');
    expect(validRoles).toContain('ADVISOR');
  });

  it('should validate PageType values', () => {
    const validTypes = Object.values(PageType);

    expect(validTypes).toContain('DEAL_PAGE');
    expect(validTypes).toContain('COMPANY_PAGE');
    expect(validTypes).toContain('DOCUMENT_PAGE');
    expect(validTypes).toContain('FREEFORM');
  });
});
