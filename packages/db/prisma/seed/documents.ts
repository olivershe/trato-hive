/**
 * Seed script: Documents
 * Creates 30 sample VDR documents with metadata
 */

import { PrismaClient, Deal, User, DocumentType, DocumentStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedDocuments(deals: Deal[], users: User[]) {
  console.log('📄 Seeding documents...');

  if (deals.length < 10 || users.length < 1) {
    throw new Error('Need at least 10 deals and 1 user to seed documents');
  }

  // Get the first user from each deal's organization to use as uploader
  const uploaderUser = users[0];

  const documentsData = [
    // Deal 0: CloudSync Acquisition (SOURCING)
    {
      name: 'CloudSync - Company Overview.pdf',
      type: DocumentType.PRESENTATION,
      status: DocumentStatus.INDEXED,
      dealId: deals[0].id,
      companyId: deals[0].companyId,
      organizationId: deals[0].organizationId,
      uploadedById: uploaderUser.id,
      fileSize: 2457600, // ~2.4 MB
      mimeType: 'application/pdf',
      fileUrl: 's3://trato-hive-docs/cloudsync-overview.pdf',
      parsedAt: new Date('2025-06-01'),
      indexedAt: new Date('2025-06-01'),
    },
    {
      name: 'CloudSync - Financial Statements 2024.xlsx',
      type: DocumentType.FINANCIAL_STATEMENT,
      status: DocumentStatus.INDEXED,
      dealId: deals[0].id,
      companyId: deals[0].companyId,
      organizationId: deals[0].organizationId,
      uploadedById: uploaderUser.id,
      fileSize: 1024000, // ~1 MB
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileUrl: 's3://trato-hive-docs/cloudsync-financials-2024.xlsx',
      parsedAt: new Date('2025-06-02'),
      indexedAt: new Date('2025-06-02'),
    },

    // Deal 3: DataVault Security (INITIAL_REVIEW)
    {
      name: 'DataVault - Confidential Information Memorandum.pdf',
      type: DocumentType.MEMORANDUM,
      status: DocumentStatus.INDEXED,
      dealId: deals[3].id,
      companyId: deals[3].companyId,
      organizationId: deals[3].organizationId,
      uploadedById: uploaderUser.id,
      fileSize: 5242880, // ~5 MB
      mimeType: 'application/pdf',
      fileUrl: 's3://trato-hive-docs/datavault-cim.pdf',
      parsedAt: new Date('2025-06-05'),
      indexedAt: new Date('2025-06-05'),
    },
    {
      name: 'DataVault - Customer Contracts.pdf',
      type: DocumentType.CONTRACT,
      status: DocumentStatus.INDEXED,
      dealId: deals[3].id,
      companyId: deals[3].companyId,
      organizationId: deals[3].organizationId,
      uploadedById: uploaderUser.id,
      fileSize: 3145728, // ~3 MB
      mimeType: 'application/pdf',
      fileUrl: 's3://trato-hive-docs/datavault-contracts.pdf',
      parsedAt: new Date('2025-06-06'),
      indexedAt: new Date('2025-06-06'),
    },
    {
      name: 'DataVault - IP Portfolio.pdf',
      type: DocumentType.LEGAL_DOCUMENT,
      status: DocumentStatus.INDEXED,
      dealId: deals[3].id,
      companyId: deals[3].companyId,
      organizationId: deals[3].organizationId,
      uploadedById: uploaderUser.id,
      fileSize: 1572864, // ~1.5 MB
      mimeType: 'application/pdf',
      fileUrl: 's3://trato-hive-docs/datavault-ip.pdf',
      parsedAt: new Date('2025-06-07'),
      indexedAt: new Date('2025-06-07'),
    },

    // Deal 5: CustomerOS (PRELIMINARY_DUE_DILIGENCE)
    {
      name: 'CustomerOS - Audited Financials 2023.pdf',
      type: DocumentType.FINANCIAL_STATEMENT,
      status: DocumentStatus.INDEXED,
      dealId: deals[5].id,
      companyId: deals[5].companyId,
      organizationId: deals[5].organizationId,
      uploadedById: uploaderUser.id,
      fileSize: 2097152, // ~2 MB
      mimeType: 'application/pdf',
      fileUrl: 's3://trato-hive-docs/customeros-audit-2023.pdf',
      parsedAt: new Date('2025-06-10'),
      indexedAt: new Date('2025-06-10'),
    },
    {
      name: 'CustomerOS - Revenue Model.xlsx',
      type: DocumentType.FINANCIAL_STATEMENT,
      status: DocumentStatus.INDEXED,
      dealId: deals[5].id,
      companyId: deals[5].companyId,
      organizationId: deals[5].organizationId,
      uploadedById: uploaderUser.id,
      fileSize: 819200, // ~800 KB
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileUrl: 's3://trato-hive-docs/customeros-revenue-model.xlsx',
      parsedAt: new Date('2025-06-11'),
      indexedAt: new Date('2025-06-11'),
    },
    {
      name: 'CustomerOS - Tech Stack Documentation.pdf',
      type: DocumentType.TECHNICAL_DOCUMENT,
      status: DocumentStatus.INDEXED,
      dealId: deals[5].id,
      companyId: deals[5].companyId,
      organizationId: deals[5].organizationId,
      uploadedById: uploaderUser.id,
      fileSize: 4194304, // ~4 MB
      mimeType: 'application/pdf',
      fileUrl: 's3://trato-hive-docs/customeros-tech-stack.pdf',
      parsedAt: new Date('2025-06-12'),
      indexedAt: new Date('2025-06-12'),
    },
    {
      name: 'CustomerOS - Employee Agreements.pdf',
      type: DocumentType.LEGAL_DOCUMENT,
      status: DocumentStatus.INDEXED,
      dealId: deals[5].id,
      companyId: deals[5].companyId,
      organizationId: deals[5].organizationId,
      uploadedById: uploaderUser.id,
      fileSize: 2621440, // ~2.5 MB
      mimeType: 'application/pdf',
      fileUrl: 's3://trato-hive-docs/customeros-employee-agreements.pdf',
      parsedAt: new Date('2025-06-13'),
      indexedAt: new Date('2025-06-13'),
    },

    // Deal 8: PaymentFlow (DEEP_DUE_DILIGENCE)
    {
      name: 'PaymentFlow - Quality of Earnings Report.pdf',
      type: DocumentType.FINANCIAL_STATEMENT,
      status: DocumentStatus.INDEXED,
      dealId: deals[8].id,
      companyId: deals[8].companyId,
      organizationId: deals[8].organizationId,
      uploadedById: uploaderUser.id,
      fileSize: 6291456, // ~6 MB
      mimeType: 'application/pdf',
      fileUrl: 's3://trato-hive-docs/paymentflow-qoe.pdf',
      parsedAt: new Date('2025-06-15'),
      indexedAt: new Date('2025-06-15'),
    },
    {
      name: 'PaymentFlow - Customer List.xlsx',
      type: DocumentType.OTHER,
      status: DocumentStatus.INDEXED,
      dealId: deals[8].id,
      companyId: deals[8].companyId,
      organizationId: deals[8].organizationId,
      uploadedById: uploaderUser.id,
      fileSize: 512000, // ~500 KB
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileUrl: 's3://trato-hive-docs/paymentflow-customers.xlsx',
      parsedAt: new Date('2025-06-16'),
      indexedAt: new Date('2025-06-16'),
    },
    {
      name: 'PaymentFlow - Regulatory Compliance Report.pdf',
      type: DocumentType.LEGAL_DOCUMENT,
      status: DocumentStatus.INDEXED,
      dealId: deals[8].id,
      companyId: deals[8].companyId,
      organizationId: deals[8].organizationId,
      uploadedById: uploaderUser.id,
      fileSize: 3670016, // ~3.5 MB
      mimeType: 'application/pdf',
      fileUrl: 's3://trato-hive-docs/paymentflow-compliance.pdf',
      parsedAt: new Date('2025-06-17'),
      indexedAt: new Date('2025-06-17'),
    },
    {
      name: 'PaymentFlow - API Documentation.pdf',
      type: DocumentType.TECHNICAL_DOCUMENT,
      status: DocumentStatus.INDEXED,
      dealId: deals[8].id,
      companyId: deals[8].companyId,
      organizationId: deals[8].organizationId,
      uploadedById: uploaderUser.id,
      fileSize: 2097152, // ~2 MB
      mimeType: 'application/pdf',
      fileUrl: 's3://trato-hive-docs/paymentflow-api-docs.pdf',
      parsedAt: new Date('2025-06-18'),
      indexedAt: new Date('2025-06-18'),
    },
    {
      name: 'PaymentFlow - Security Audit Report.pdf',
      type: DocumentType.TECHNICAL_DOCUMENT,
      status: DocumentStatus.INDEXED,
      dealId: deals[8].id,
      companyId: deals[8].companyId,
      organizationId: deals[8].organizationId,
      uploadedById: uploaderUser.id,
      fileSize: 4718592, // ~4.5 MB
      mimeType: 'application/pdf',
      fileUrl: 's3://trato-hive-docs/paymentflow-security-audit.pdf',
      parsedAt: new Date('2025-06-19'),
      indexedAt: new Date('2025-06-19'),
    },

    // Deal 10: CloudDocs Platform (NEGOTIATION)
    {
      name: 'CloudDocs - Draft Purchase Agreement.pdf',
      type: DocumentType.CONTRACT,
      status: DocumentStatus.INDEXED,
      dealId: deals[10].id,
      companyId: deals[10].companyId,
      organizationId: deals[10].organizationId,
      uploadedById: uploaderUser.id,
      fileSize: 5242880, // ~5 MB
      mimeType: 'application/pdf',
      fileUrl: 's3://trato-hive-docs/clouddocs-purchase-agreement.pdf',
      parsedAt: new Date('2025-06-20'),
      indexedAt: new Date('2025-06-20'),
    },
    {
      name: 'CloudDocs - Valuation Report.pdf',
      type: DocumentType.FINANCIAL_STATEMENT,
      status: DocumentStatus.INDEXED,
      dealId: deals[10].id,
      companyId: deals[10].companyId,
      organizationId: deals[10].organizationId,
      uploadedById: uploaderUser.id,
      fileSize: 3145728, // ~3 MB
      mimeType: 'application/pdf',
      fileUrl: 's3://trato-hive-docs/clouddocs-valuation.pdf',
      parsedAt: new Date('2025-06-21'),
      indexedAt: new Date('2025-06-21'),
    },
    {
      name: 'CloudDocs - Management Presentations.pdf',
      type: DocumentType.PRESENTATION,
      status: DocumentStatus.INDEXED,
      dealId: deals[10].id,
      companyId: deals[10].companyId,
      organizationId: deals[10].organizationId,
      uploadedById: uploaderUser.id,
      fileSize: 8388608, // ~8 MB
      mimeType: 'application/pdf',
      fileUrl: 's3://trato-hive-docs/clouddocs-mgmt-presentation.pdf',
      parsedAt: new Date('2025-06-22'),
      indexedAt: new Date('2025-06-22'),
    },

    // Deal 12: DevOps Central (CLOSING)
    {
      name: 'DevOps Central - Final Purchase Agreement.pdf',
      type: DocumentType.CONTRACT,
      status: DocumentStatus.INDEXED,
      dealId: deals[12].id,
      companyId: deals[12].companyId,
      organizationId: deals[12].organizationId,
      uploadedById: uploaderUser.id,
      fileSize: 6291456, // ~6 MB
      mimeType: 'application/pdf',
      fileUrl: 's3://trato-hive-docs/devops-final-purchase-agreement.pdf',
      parsedAt: new Date('2025-06-25'),
      indexedAt: new Date('2025-06-25'),
    },
    {
      name: 'DevOps Central - Closing Checklist.pdf',
      type: DocumentType.OTHER,
      status: DocumentStatus.INDEXED,
      dealId: deals[12].id,
      companyId: deals[12].companyId,
      organizationId: deals[12].organizationId,
      uploadedById: uploaderUser.id,
      fileSize: 524288, // ~500 KB
      mimeType: 'application/pdf',
      fileUrl: 's3://trato-hive-docs/devops-closing-checklist.pdf',
      parsedAt: new Date('2025-06-26'),
      indexedAt: new Date('2025-06-26'),
    },
    {
      name: 'DevOps Central - Wire Transfer Instructions.pdf',
      type: DocumentType.FINANCIAL_STATEMENT,
      status: DocumentStatus.INDEXED,
      dealId: deals[12].id,
      companyId: deals[12].companyId,
      organizationId: deals[12].organizationId,
      uploadedById: uploaderUser.id,
      fileSize: 262144, // ~250 KB
      mimeType: 'application/pdf',
      fileUrl: 's3://trato-hive-docs/devops-wire-instructions.pdf',
      parsedAt: new Date('2025-06-27'),
      indexedAt: new Date('2025-06-27'),
    },

    // Deal 14: AnalyticsHub Pro (CLOSED_WON)
    {
      name: 'AnalyticsHub - Executed Purchase Agreement.pdf',
      type: DocumentType.CONTRACT,
      status: DocumentStatus.INDEXED,
      dealId: deals[14].id,
      companyId: deals[14].companyId,
      organizationId: deals[14].organizationId,
      uploadedById: uploaderUser.id,
      fileSize: 7340032, // ~7 MB
      mimeType: 'application/pdf',
      fileUrl: 's3://trato-hive-docs/analyticshub-executed-agreement.pdf',
      parsedAt: new Date('2025-05-21'),
      indexedAt: new Date('2025-05-21'),
    },
    {
      name: 'AnalyticsHub - Closing Binder.pdf',
      type: DocumentType.OTHER,
      status: DocumentStatus.INDEXED,
      dealId: deals[14].id,
      companyId: deals[14].companyId,
      organizationId: deals[14].organizationId,
      uploadedById: uploaderUser.id,
      fileSize: 15728640, // ~15 MB
      mimeType: 'application/pdf',
      fileUrl: 's3://trato-hive-docs/analyticshub-closing-binder.pdf',
      parsedAt: new Date('2025-05-22'),
      indexedAt: new Date('2025-05-22'),
    },
    {
      name: 'AnalyticsHub - Final Financial Statements.xlsx',
      type: DocumentType.FINANCIAL_STATEMENT,
      status: DocumentStatus.INDEXED,
      dealId: deals[14].id,
      companyId: deals[14].companyId,
      organizationId: deals[14].organizationId,
      uploadedById: uploaderUser.id,
      fileSize: 1048576, // ~1 MB
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileUrl: 's3://trato-hive-docs/analyticshub-final-financials.xlsx',
      parsedAt: new Date('2025-05-23'),
      indexedAt: new Date('2025-05-23'),
    },

    // Additional documents for variety
    {
      name: 'LendingBridge - Risk Assessment.pdf',
      type: DocumentType.OTHER,
      status: DocumentStatus.INDEXED,
      dealId: deals[6].id,
      companyId: deals[6].companyId,
      organizationId: deals[6].organizationId,
      uploadedById: uploaderUser.id,
      fileSize: 2097152, // ~2 MB
      mimeType: 'application/pdf',
      fileUrl: 's3://trato-hive-docs/lendingbridge-risk.pdf',
      parsedAt: new Date('2025-06-08'),
      indexedAt: new Date('2025-06-08'),
    },
    {
      name: 'HealthTrack - HIPAA Compliance Audit.pdf',
      type: DocumentType.LEGAL_DOCUMENT,
      status: DocumentStatus.INDEXED,
      dealId: deals[9].id,
      companyId: deals[9].companyId,
      organizationId: deals[9].organizationId,
      uploadedById: uploaderUser.id,
      fileSize: 3145728, // ~3 MB
      mimeType: 'application/pdf',
      fileUrl: 's3://trato-hive-docs/healthtrack-hipaa.pdf',
      parsedAt: new Date('2025-06-14'),
      indexedAt: new Date('2025-06-14'),
    },
    {
      name: 'MarketingOS - Product Roadmap.pdf',
      type: DocumentType.PRESENTATION,
      status: DocumentStatus.INDEXED,
      dealId: deals[11].id,
      companyId: deals[11].companyId,
      organizationId: deals[11].organizationId,
      uploadedById: uploaderUser.id,
      fileSize: 4194304, // ~4 MB
      mimeType: 'application/pdf',
      fileUrl: 's3://trato-hive-docs/marketingos-roadmap.pdf',
      parsedAt: new Date('2025-06-23'),
      indexedAt: new Date('2025-06-23'),
    },
    {
      name: 'InsureTech - Actuarial Analysis.pdf',
      type: DocumentType.FINANCIAL_STATEMENT,
      status: DocumentStatus.INDEXED,
      dealId: deals[13].id,
      companyId: deals[13].companyId,
      organizationId: deals[13].organizationId,
      uploadedById: uploaderUser.id,
      fileSize: 5242880, // ~5 MB
      mimeType: 'application/pdf',
      fileUrl: 's3://trato-hive-docs/insuretech-actuarial.pdf',
      parsedAt: new Date('2025-06-24'),
      indexedAt: new Date('2025-06-24'),
    },
    {
      name: 'WealthWise - Investment Strategy.pdf',
      type: DocumentType.PRESENTATION,
      status: DocumentStatus.PROCESSING,
      dealId: deals[4].id,
      companyId: deals[4].companyId,
      organizationId: deals[4].organizationId,
      uploadedById: uploaderUser.id,
      fileSize: 3670016, // ~3.5 MB
      mimeType: 'application/pdf',
      fileUrl: 's3://trato-hive-docs/wealthwise-strategy.pdf',
      parsedAt: null,
      indexedAt: null,
    },
    {
      name: 'MedAI - Clinical Trial Results.pdf',
      type: DocumentType.TECHNICAL_DOCUMENT,
      status: DocumentStatus.PROCESSING,
      dealId: deals[7].id,
      companyId: deals[7].companyId,
      organizationId: deals[7].organizationId,
      uploadedById: uploaderUser.id,
      fileSize: 8388608, // ~8 MB
      mimeType: 'application/pdf',
      fileUrl: 's3://trato-hive-docs/medai-clinical-trials.pdf',
      parsedAt: null,
      indexedAt: null,
    },
  ];

  const createdDocuments = [];

  for (const docData of documentsData) {
    // Idempotent: Check if document already exists
    const existing = await prisma.document.findFirst({
      where: {
        name: docData.name,
        dealId: docData.dealId,
      },
    });

    if (existing) {
      console.log(`  ↓ Document "${docData.name}" already exists (${existing.id})`);
      createdDocuments.push(existing);
    } else {
      const document = await prisma.document.create({
        data: docData,
      });
      console.log(`  ✓ Created document "${document.name}" (${document.id})`);
      createdDocuments.push(document);
    }
  }

  return createdDocuments;
}
