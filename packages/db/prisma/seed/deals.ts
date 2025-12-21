/**
 * Seed script: Deals
 * Creates 15 deals across all pipeline stages
 */

import { PrismaClient, Company, DealStage, DealType } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedDeals(companies: Company[]) {
  console.log('💼 Seeding deals...');

  if (companies.length < 15) {
    throw new Error('Need at least 15 companies to seed deals');
  }

  const dealsData = [
    // SOURCING (3 deals)
    {
      name: 'CloudSync Acquisition',
      companyId: companies[0].id, // CloudSync Technologies
      organizationId: companies[0].organizationId,
      type: DealType.ACQUISITION,
      stage: DealStage.SOURCING,
      value: 85000000,
      currency: 'USD',
      probability: 20,
      description: 'Potential acquisition of enterprise data sync platform',
      expectedCloseDate: new Date('2025-09-30'),
    },
    {
      name: 'WorkFlow AI Investment',
      companyId: companies[2].id, // WorkFlow AI
      organizationId: companies[2].organizationId,
      type: DealType.INVESTMENT,
      stage: DealStage.SOURCING,
      value: 15000000,
      currency: 'USD',
      probability: 15,
      description: 'Series B investment opportunity',
      expectedCloseDate: new Date('2025-08-15'),
    },
    {
      name: 'SalesBoost CRM Partnership',
      companyId: companies[6].id, // SalesBoost CRM
      organizationId: companies[6].organizationId,
      type: DealType.PARTNERSHIP,
      stage: DealStage.SOURCING,
      value: 5000000,
      currency: 'USD',
      probability: 10,
      description: 'Strategic partnership and minority stake',
      expectedCloseDate: null,
    },

    // INITIAL_REVIEW (2 deals)
    {
      name: 'DataVault Security Acquisition',
      companyId: companies[1].id, // DataVault Security
      organizationId: companies[1].organizationId,
      type: DealType.ACQUISITION,
      stage: DealStage.INITIAL_REVIEW,
      value: 120000000,
      currency: 'USD',
      probability: 35,
      description: 'Cybersecurity platform acquisition',
      expectedCloseDate: new Date('2025-10-31'),
    },
    {
      name: 'WealthWise Investment',
      companyId: companies[10].id, // WealthWise
      organizationId: companies[10].organizationId,
      type: DealType.INVESTMENT,
      stage: DealStage.INITIAL_REVIEW,
      value: 12000000,
      currency: 'USD',
      probability: 30,
      description: 'Series A investment in robo-advisor platform',
      expectedCloseDate: new Date('2025-07-20'),
    },

    // PRELIMINARY_DUE_DILIGENCE (3 deals)
    {
      name: 'CustomerOS Platform Acquisition',
      companyId: companies[4].id, // CustomerOS
      organizationId: companies[4].organizationId,
      type: DealType.ACQUISITION,
      stage: DealStage.PRELIMINARY_DUE_DILIGENCE,
      value: 95000000,
      currency: 'USD',
      probability: 50,
      description: 'Customer success platform acquisition',
      expectedCloseDate: new Date('2025-09-15'),
    },
    {
      name: 'LendingBridge Investment',
      companyId: companies[9].id, // LendingBridge
      organizationId: companies[9].organizationId,
      type: DealType.INVESTMENT,
      stage: DealStage.PRELIMINARY_DUE_DILIGENCE,
      value: 25000000,
      currency: 'USD',
      probability: 45,
      description: 'Growth equity investment in digital lending',
      expectedCloseDate: new Date('2025-08-30'),
    },
    {
      name: 'MedAI Diagnostics Partnership',
      companyId: companies[14].id, // MedAI Diagnostics
      organizationId: companies[14].organizationId,
      type: DealType.PARTNERSHIP,
      stage: DealStage.PRELIMINARY_DUE_DILIGENCE,
      value: 18000000,
      currency: 'USD',
      probability: 40,
      description: 'Strategic investment in medical AI',
      expectedCloseDate: new Date('2025-10-01'),
    },

    // DEEP_DUE_DILIGENCE (2 deals)
    {
      name: 'PaymentFlow Acquisition',
      companyId: companies[8].id, // PaymentFlow
      organizationId: companies[8].organizationId,
      type: DealType.ACQUISITION,
      stage: DealStage.DEEP_DUE_DILIGENCE,
      value: 210000000,
      currency: 'USD',
      probability: 65,
      description: 'Major B2B payments platform acquisition',
      expectedCloseDate: new Date('2025-11-30'),
    },
    {
      name: 'HealthTrack Systems Investment',
      companyId: companies[13].id, // HealthTrack Systems
      organizationId: companies[13].organizationId,
      type: DealType.INVESTMENT,
      stage: DealStage.DEEP_DUE_DILIGENCE,
      value: 35000000,
      currency: 'USD',
      probability: 70,
      description: 'Growth investment in patient engagement platform',
      expectedCloseDate: new Date('2025-09-30'),
    },

    // NEGOTIATION (2 deals)
    {
      name: 'CloudDocs Platform Acquisition',
      companyId: companies[7].id, // CloudDocs Platform
      organizationId: companies[7].organizationId,
      type: DealType.ACQUISITION,
      stage: DealStage.NEGOTIATION,
      value: 175000000,
      currency: 'USD',
      probability: 80,
      description: 'Document management platform acquisition',
      expectedCloseDate: new Date('2025-07-31'),
    },
    {
      name: 'MarketingOS Investment',
      companyId: companies[18].id, // MarketingOS
      organizationId: companies[18].organizationId,
      type: DealType.INVESTMENT,
      stage: DealStage.NEGOTIATION,
      value: 28000000,
      currency: 'USD',
      probability: 85,
      description: 'Series C investment in marketing automation',
      expectedCloseDate: new Date('2025-08-15'),
    },

    // CLOSING (2 deals)
    {
      name: 'DevOps Central Acquisition',
      companyId: companies[5].id, // DevOps Central
      organizationId: companies[5].organizationId,
      type: DealType.ACQUISITION,
      stage: DealStage.CLOSING,
      value: 145000000,
      currency: 'USD',
      probability: 95,
      description: 'DevOps platform acquisition - final documents',
      expectedCloseDate: new Date('2025-06-30'),
    },
    {
      name: 'InsureTech Pro Investment',
      companyId: companies[11].id, // InsureTech Pro
      organizationId: companies[11].organizationId,
      type: DealType.INVESTMENT,
      stage: DealStage.CLOSING,
      value: 32000000,
      currency: 'USD',
      probability: 90,
      description: 'Growth investment in insurtech - final signatures',
      expectedCloseDate: new Date('2025-07-15'),
    },

    // CLOSED_WON (1 deal)
    {
      name: 'AnalyticsHub Pro Acquisition',
      companyId: companies[3].id, // AnalyticsHub Pro
      organizationId: companies[3].organizationId,
      type: DealType.ACQUISITION,
      stage: DealStage.CLOSED_WON,
      value: 98000000,
      currency: 'USD',
      probability: 100,
      description: 'Business intelligence platform - successfully closed',
      expectedCloseDate: new Date('2025-05-15'),
      actualCloseDate: new Date('2025-05-20'),
    },
  ];

  const createdDeals = [];

  for (const dealData of dealsData) {
    // Idempotent: Check if deal already exists
    const existing = await prisma.deal.findFirst({
      where: {
        name: dealData.name,
        organizationId: dealData.organizationId,
      },
    });

    if (existing) {
      console.log(`  ↓ Deal "${dealData.name}" already exists (${existing.id})`);
      createdDeals.push(existing);
    } else {
      const deal = await prisma.deal.create({
        data: dealData,
      });
      console.log(`  ✓ Created deal "${deal.name}" (${deal.id}) - ${deal.stage}`);
      createdDeals.push(deal);
    }
  }

  return createdDeals;
}
