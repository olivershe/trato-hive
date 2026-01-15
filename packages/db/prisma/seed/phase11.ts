/**
 * Seed script: Phase 11 Data
 * Creates DealCompany junction entries and CompanyWatch entries
 * Also demonstrates multi-company deals
 */

import { PrismaClient, Deal, Company, User, DealCompanyRole } from '@prisma/client';

const prisma = new PrismaClient();

interface Phase11Result {
  dealCompanies: number;
  companyWatches: number;
}

export async function seedPhase11(
  deals: Deal[],
  companies: Company[],
  users: User[]
): Promise<Phase11Result> {
  console.log('🔗 Seeding Phase 11 data (DealCompany, CompanyWatch)...');

  let dealCompaniesCreated = 0;
  let companyWatchesCreated = 0;

  // ==========================================================================
  // 1. Create DealCompany entries for existing deals
  // ==========================================================================
  console.log('  📊 Creating DealCompany junction entries...');

  for (const deal of deals) {
    if (!deal.companyId) continue;

    // Check if DealCompany already exists
    const existing = await prisma.dealCompany.findUnique({
      where: {
        dealId_companyId: {
          dealId: deal.id,
          companyId: deal.companyId,
        },
      },
    });

    if (!existing) {
      await prisma.dealCompany.create({
        data: {
          dealId: deal.id,
          companyId: deal.companyId,
          role: DealCompanyRole.PLATFORM, // Primary target company
        },
      });
      dealCompaniesCreated++;
      console.log(`    ✓ DealCompany: ${deal.name} ↔ PLATFORM`);
    }
  }

  // ==========================================================================
  // 2. Add additional companies to some deals (multi-company examples)
  // ==========================================================================
  console.log('  🏢 Adding multi-company deal examples...');

  // Find specific deals to add secondary companies
  const paymentFlowDeal = deals.find(d => d.name === 'PaymentFlow Acquisition');
  const cloudDocsDeal = deals.find(d => d.name === 'CloudDocs Platform Acquisition');
  const devOpsDeal = deals.find(d => d.name === 'DevOps Central Acquisition');

  // Add add-on/advisor companies to PaymentFlow deal
  if (paymentFlowDeal && companies.length > 5) {
    const addOnCompany = companies.find(c => c.id !== paymentFlowDeal.companyId && c.industry === 'Fintech');
    if (addOnCompany) {
      const exists = await prisma.dealCompany.findUnique({
        where: {
          dealId_companyId: {
            dealId: paymentFlowDeal.id,
            companyId: addOnCompany.id,
          },
        },
      });
      if (!exists) {
        await prisma.dealCompany.create({
          data: {
            dealId: paymentFlowDeal.id,
            companyId: addOnCompany.id,
            role: DealCompanyRole.ADD_ON,
          },
        });
        dealCompaniesCreated++;
        console.log(`    ✓ DealCompany: ${paymentFlowDeal.name} ↔ ${addOnCompany.name} (ADD_ON)`);
      }
    }
  }

  // Add advisor company to CloudDocs deal
  if (cloudDocsDeal && companies.length > 10) {
    const advisorCompany = companies.find(
      c => c.id !== cloudDocsDeal.companyId && c.industry === 'Professional Services'
    );
    if (advisorCompany) {
      const exists = await prisma.dealCompany.findUnique({
        where: {
          dealId_companyId: {
            dealId: cloudDocsDeal.id,
            companyId: advisorCompany.id,
          },
        },
      });
      if (!exists) {
        await prisma.dealCompany.create({
          data: {
            dealId: cloudDocsDeal.id,
            companyId: advisorCompany.id,
            role: DealCompanyRole.ADVISOR,
          },
        });
        dealCompaniesCreated++;
        console.log(`    ✓ DealCompany: ${cloudDocsDeal.name} ↔ ${advisorCompany.name} (ADVISOR)`);
      }
    }
  }

  // Add buyer company to DevOps deal (simulating a buyer in the transaction)
  if (devOpsDeal && companies.length > 15) {
    const buyerCompany = companies.find(
      c => c.id !== devOpsDeal.companyId && c.industry === 'Technology'
    );
    if (buyerCompany) {
      const exists = await prisma.dealCompany.findUnique({
        where: {
          dealId_companyId: {
            dealId: devOpsDeal.id,
            companyId: buyerCompany.id,
          },
        },
      });
      if (!exists) {
        await prisma.dealCompany.create({
          data: {
            dealId: devOpsDeal.id,
            companyId: buyerCompany.id,
            role: DealCompanyRole.BUYER,
          },
        });
        dealCompaniesCreated++;
        console.log(`    ✓ DealCompany: ${devOpsDeal.name} ↔ ${buyerCompany.name} (BUYER)`);
      }
    }
  }

  // ==========================================================================
  // 3. Create CompanyWatch entries
  // ==========================================================================
  console.log('  👁️ Creating CompanyWatch entries...');

  // Get users to create watches for
  const watchingUsers = users.slice(0, Math.min(3, users.length));

  // Create watch entries for companies that don't have deals (prospects)
  const companiesWithDeals = new Set(deals.map(d => d.companyId).filter(Boolean));
  const companiesWithoutDeals = companies.filter(c => !companiesWithDeals.has(c.id));

  // Each user watches some companies
  for (const user of watchingUsers) {
    // Watch 2-3 companies per user
    const companiesToWatch = companiesWithoutDeals
      .filter(c => c.organizationId === user.id.split('_')[0] || true) // simplified org check
      .slice(0, 3);

    for (let i = 0; i < companiesToWatch.length; i++) {
      const company = companiesToWatch[i];

      const existing = await prisma.companyWatch.findUnique({
        where: {
          companyId_userId: {
            companyId: company.id,
            userId: user.id,
          },
        },
      });

      if (!existing) {
        const watchData = getWatchData(company, i);
        await prisma.companyWatch.create({
          data: {
            companyId: company.id,
            userId: user.id,
            notes: watchData.notes,
            tags: watchData.tags,
            priority: watchData.priority,
          },
        });
        companyWatchesCreated++;
        console.log(`    ✓ CompanyWatch: ${user.name || user.email} watching ${company.name}`);
      }
    }
  }

  // Also create watches for some companies that ARE in deals (for additional tracking)
  const hotCompanies = companies.filter(c => companiesWithDeals.has(c.id)).slice(0, 2);
  for (const company of hotCompanies) {
    for (const user of watchingUsers.slice(0, 1)) {
      const existing = await prisma.companyWatch.findUnique({
        where: {
          companyId_userId: {
            companyId: company.id,
            userId: user.id,
          },
        },
      });

      if (!existing) {
        await prisma.companyWatch.create({
          data: {
            companyId: company.id,
            userId: user.id,
            notes: 'Hot prospect - active in deal pipeline',
            tags: ['hot-lead', 'deal-active', 'priority'],
            priority: 2, // High priority
          },
        });
        companyWatchesCreated++;
        console.log(`    ✓ CompanyWatch: ${user.name || user.email} watching ${company.name} (HIGH priority)`);
      }
    }
  }

  console.log(`  ✓ Created ${dealCompaniesCreated} DealCompany entries`);
  console.log(`  ✓ Created ${companyWatchesCreated} CompanyWatch entries`);

  return {
    dealCompanies: dealCompaniesCreated,
    companyWatches: companyWatchesCreated,
  };
}

/**
 * Generate realistic watch data based on company and index
 */
function getWatchData(company: Company, index: number): { notes: string; tags: string[]; priority: number } {
  const watchNotes = [
    `Monitoring ${company.name} for potential acquisition opportunity. Strong growth indicators.`,
    `Tracking competitive landscape - ${company.name} expanding into our target sectors.`,
    `Interested in ${company.name}'s technology stack and talent pool. Follow up Q3.`,
  ];

  const tagSets = [
    ['acquisition-target', 'high-growth', company.industry?.toLowerCase() || 'tech'],
    ['competitor-watch', 'market-intel', 'strategic'],
    ['talent-acquisition', 'tech-stack', 'follow-up-q3'],
  ];

  const priorities = [1, 0, 1]; // medium, low, medium

  return {
    notes: watchNotes[index % watchNotes.length],
    tags: tagSets[index % tagSets.length],
    priority: priorities[index % priorities.length],
  };
}
