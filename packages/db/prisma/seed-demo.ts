/**
 * Demo Data Seed Script
 *
 * Creates demo organization, user, and sample data for development.
 * Run with: npx tsx packages/db/prisma/seed-demo.ts
 *
 * IDs are hardcoded to match the demo session in apps/api/src/trpc/context.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEMO_USER_ID = 'demo-user-id';
const DEMO_ORG_ID = 'demo-org-id';

async function main() {
  console.log('🌱 Seeding demo data...');

  // 1. Create demo user
  const user = await prisma.user.upsert({
    where: { id: DEMO_USER_ID },
    update: {},
    create: {
      id: DEMO_USER_ID,
      email: 'demo@tratohive.com',
      name: 'Demo User',
      emailVerified: new Date(),
    },
  });
  console.log('✅ Demo user created:', user.email);

  // 2. Create demo organization
  const org = await prisma.organization.upsert({
    where: { id: DEMO_ORG_ID },
    update: {},
    create: {
      id: DEMO_ORG_ID,
      name: 'Demo Organization',
      slug: 'demo-org',
      description: 'Demo organization for development and testing',
    },
  });
  console.log('✅ Demo organization created:', org.name);

  // 3. Link user to organization as ADMIN
  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: DEMO_ORG_ID,
        userId: DEMO_USER_ID,
      },
    },
    update: { role: 'ADMIN' },
    create: {
      organizationId: DEMO_ORG_ID,
      userId: DEMO_USER_ID,
      role: 'ADMIN',
    },
  });
  console.log('✅ User linked to organization as ADMIN');

  // 4. Create sample companies
  const companies = await Promise.all([
    prisma.company.upsert({
      where: { id: 'demo-company-1' },
      update: {},
      create: {
        id: 'demo-company-1',
        organizationId: DEMO_ORG_ID,
        name: 'TechCorp Industries',
        industry: 'Technology',
        sector: 'Enterprise Software',
        employees: 250,
        revenue: 45000000,
        location: 'San Francisco, CA',
        description: 'Leading provider of enterprise automation solutions',
        status: 'PIPELINE',
      },
    }),
    prisma.company.upsert({
      where: { id: 'demo-company-2' },
      update: {},
      create: {
        id: 'demo-company-2',
        organizationId: DEMO_ORG_ID,
        name: 'HealthPlus Medical',
        industry: 'Healthcare',
        sector: 'Medical Devices',
        employees: 150,
        revenue: 28000000,
        location: 'Boston, MA',
        description: 'Innovative medical device manufacturer',
        status: 'RESEARCHING',
      },
    }),
    prisma.company.upsert({
      where: { id: 'demo-company-3' },
      update: {},
      create: {
        id: 'demo-company-3',
        organizationId: DEMO_ORG_ID,
        name: 'GreenEnergy Solutions',
        industry: 'Energy',
        sector: 'Renewable Energy',
        employees: 80,
        revenue: 12000000,
        location: 'Austin, TX',
        description: 'Solar and wind energy infrastructure provider',
        status: 'PROSPECT',
      },
    }),
  ]);
  console.log(`✅ ${companies.length} sample companies created`);

  // 5. Create sample deals
  const deals = await Promise.all([
    prisma.deal.upsert({
      where: { id: 'demo-deal-1' },
      update: {},
      create: {
        id: 'demo-deal-1',
        organizationId: DEMO_ORG_ID,
        companyId: 'demo-company-1',
        name: 'TechCorp Acquisition',
        type: 'ACQUISITION',
        stage: 'DEEP_DUE_DILIGENCE',
        value: 75000000,
        probability: 70,
        expectedCloseDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        description: 'Strategic acquisition to expand enterprise software portfolio',
      },
    }),
    prisma.deal.upsert({
      where: { id: 'demo-deal-2' },
      update: {},
      create: {
        id: 'demo-deal-2',
        organizationId: DEMO_ORG_ID,
        companyId: 'demo-company-2',
        name: 'HealthPlus Investment',
        type: 'INVESTMENT',
        stage: 'PRELIMINARY_DUE_DILIGENCE',
        value: 15000000,
        probability: 50,
        expectedCloseDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
        description: 'Series B investment in medical devices',
      },
    }),
    prisma.deal.upsert({
      where: { id: 'demo-deal-3' },
      update: {},
      create: {
        id: 'demo-deal-3',
        organizationId: DEMO_ORG_ID,
        companyId: 'demo-company-3',
        name: 'GreenEnergy Partnership',
        type: 'PARTNERSHIP',
        stage: 'SOURCING',
        value: 5000000,
        probability: 30,
        expectedCloseDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        description: 'Joint venture for renewable energy projects',
      },
    }),
    prisma.deal.upsert({
      where: { id: 'demo-deal-4' },
      update: {},
      create: {
        id: 'demo-deal-4',
        organizationId: DEMO_ORG_ID,
        name: 'DataAnalytics Corp',
        type: 'ACQUISITION',
        stage: 'NEGOTIATION',
        value: 120000000,
        probability: 85,
        expectedCloseDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        description: 'Late-stage acquisition in big data analytics',
      },
    }),
  ]);
  console.log(`✅ ${deals.length} sample deals created`);

  // 6. Create sample activities
  await prisma.activity.createMany({
    data: [
      {
        dealId: 'demo-deal-1',
        userId: DEMO_USER_ID,
        type: 'DEAL_STAGE_CHANGED',
        description: 'Deal moved to Deep Due Diligence - Progressed from Preliminary DD after initial document review',
        status: 'ACTIVE',
      },
      {
        dealId: 'demo-deal-4',
        userId: DEMO_USER_ID,
        type: 'USER_ACTION',
        description: 'Valuation updated - Deal value updated to $120M based on latest financials',
        status: 'ACTIVE',
      },
      {
        dealId: 'demo-deal-2',
        userId: DEMO_USER_ID,
        type: 'DOCUMENT_UPLOADED',
        description: 'New documents uploaded - 3 financial documents added to data room',
        status: 'READ',
      },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Sample activities created');

  console.log('\n🎉 Demo data seeding complete!');
  console.log('   User: demo@tratohive.com');
  console.log('   Organization: Demo Organization');
  console.log(`   Companies: ${companies.length}`);
  console.log(`   Deals: ${deals.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding demo data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
