/**
 * Main Seed Script
 * Orchestrates all seed scripts in correct dependency order
 * Idempotent: Safe to run multiple times
 */

import { PrismaClient } from '@prisma/client';
import { seedFirms } from './seed/firms';
import { seedUsers } from './seed/users';
import { seedCompanies } from './seed/companies';
import { seedDeals } from './seed/deals';
import { seedDocuments } from './seed/documents';
import { seedFacts } from './seed/facts';
import { seedPages } from './seed/pages';
import { seedPhase11 } from './seed/phase11';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  try {
    // Step 1: Seed Organizations (PE Firms)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const firms = await seedFirms();
    console.log(`✓ Organizations: ${firms.length} firms ready\n`);

    // Step 2: Seed Users & Organization Members
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const users = await seedUsers(firms);
    console.log(`✓ Users: ${users.length} users ready\n`);

    // Step 3: Seed Companies
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const companies = await seedCompanies(firms);
    console.log(`✓ Companies: ${companies.length} companies ready\n`);

    // Step 4: Seed Deals
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const deals = await seedDeals(companies);
    console.log(`✓ Deals: ${deals.length} deals ready\n`);

    // Step 5: Seed Documents
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const documents = await seedDocuments(deals, users);
    console.log(`✓ Documents: ${documents.length} documents ready\n`);

    // Step 6: Seed Facts
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const facts = await seedFacts(documents);
    console.log(`✓ Facts: ${facts.length} facts ready\n`);

    // Step 7: Seed Pages & Blocks
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const { pages, blocks } = await seedPages(deals, users);
    console.log(`✓ Pages & Blocks: ${pages.length} pages, ${blocks.length} blocks ready\n`);

    // Step 8: Seed Phase 11 Data (DealCompany, CompanyWatch)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const phase11 = await seedPhase11(deals, companies, users);
    console.log(`✓ Phase 11: ${phase11.dealCompanies} deal-company links, ${phase11.companyWatches} company watches ready\n`);

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Database seed completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   • ${firms.length} Organizations (PE Firms)`);
    console.log(`   • ${users.length} Users (OWNER, ADMIN, MEMBER, VIEWER)`);
    console.log(`   • ${companies.length} Companies (SaaS, Fintech, Healthcare, etc.)`);
    console.log(`   • ${deals.length} Deals (across all pipeline stages)`);
    console.log(`   • ${phase11.dealCompanies} DealCompany links (many-to-many with roles)`);
    console.log(`   • ${phase11.companyWatches} CompanyWatch entries (user watch lists)`);
    console.log(`   • ${documents.length} Documents (VDR documents with metadata)`);
    console.log(`   • ${facts.length} Facts (verifiable facts with citations)`);
    console.log(`   • ${pages.length} Pages (Block Protocol foundation)`);
    console.log(`   • ${blocks.length} Blocks (hierarchical content structure)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Sample queries to verify data
    console.log('📋 Sample Data Verification:');

    const sampleDeal = await prisma.deal.findFirst({
      where: { stage: 'DEEP_DUE_DILIGENCE' },
      include: {
        company: true,
        organization: true,
        documents: true,
      },
    });

    if (sampleDeal) {
      console.log(`\n   Deal: "${sampleDeal.name}"`);
      console.log(`   Company: ${sampleDeal.company?.name || 'N/A'}`);
      console.log(`   Organization: ${sampleDeal.organization.name}`);
      console.log(`   Stage: ${sampleDeal.stage}`);
      console.log(`   Value: $${sampleDeal.value?.toNumber().toLocaleString() || 'N/A'}`);
      console.log(`   Documents: ${sampleDeal.documents.length} attached`);
    }

    const sampleFact = await prisma.fact.findFirst({
      where: { type: 'FINANCIAL_METRIC' },
      include: {
        document: true,
        company: true,
      },
    });

    if (sampleFact) {
      console.log(`\n   Fact: ${sampleFact.subject} - ${sampleFact.predicate}`);
      console.log(`   Object: ${sampleFact.object}`);
      console.log(`   Confidence: ${(sampleFact.confidence * 100).toFixed(0)}%`);
      console.log(`   Source: ${sampleFact.document?.name || 'N/A'}`);
      console.log(`   Extracted by: ${sampleFact.extractedBy}`);
    }

    const samplePage = await prisma.page.findFirst({
      where: { dealId: { not: null } },
      include: {
        deal: true,
        blocks: {
          include: {
            children: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (samplePage) {
      console.log(`\n   Page: "${samplePage.title}"`);
      console.log(`   Deal: ${samplePage.deal?.name || 'N/A'}`);
      console.log(`   Root Blocks: ${samplePage.blocks.filter(b => !b.parentId).length}`);
      console.log(`   Total Blocks: ${samplePage.blocks.length}`);
      const rootBlocks = samplePage.blocks.filter(b => !b.parentId);
      if (rootBlocks.length > 0) {
        console.log(`   First Block: ${rootBlocks[0].type} - "${(rootBlocks[0].properties as any).text}"`);
        console.log(`   Children: ${rootBlocks[0].children.length} child blocks`);
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Seed script completed. You can now:');
    console.log('   1. Run "pnpm --filter @trato-hive/db db:studio" to explore data');
    console.log('   2. Visit http://localhost:5555 in your browser');
    console.log('   3. Re-run this script anytime (idempotent - safe)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
