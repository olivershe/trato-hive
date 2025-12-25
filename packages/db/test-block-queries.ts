/**
 * Test script: Block Protocol Queries
 * Demonstrates recursive block queries
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testBlockQueries() {
  console.log('🧪 Testing Block Protocol Queries\n');

  // Query 1: Get a page with all its blocks (including children)
  console.log('1️⃣  Fetching page with full block tree...');
  const page = await prisma.page.findFirst({
    where: { dealId: { not: null } },
    include: {
      deal: true,
      blocks: {
        include: {
          children: {
            include: {
              children: true, // Can nest further if needed
            },
          },
          creator: {
            select: { name: true, email: true },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
  });

  if (page) {
    console.log(`\n   ✓ Page: "${page.title}"`);
    console.log(`   ✓ Deal: ${page.deal?.name}`);
    console.log(`   ✓ Total Blocks: ${page.blocks.length}\n`);

    // Display block tree
    const rootBlocks = page.blocks.filter((b) => !b.parentId);
    console.log(`   📦 Block Tree Structure:\n`);

    for (const rootBlock of rootBlocks) {
      const text = (rootBlock.properties as any).text || '';
      console.log(`   ├─ [${rootBlock.type}] "${text}"`);

      for (const child of rootBlock.children) {
        const childText = (child.properties as any).text || '';
        console.log(`   │  └─ [${child.type}] "${childText}"`);
      }
    }
  }

  // Query 2: Get all blocks for a specific deal
  console.log('\n\n2️⃣  Fetching all blocks for a deal...');
  const dealWithBlocks = await prisma.deal.findFirst({
    where: {
      page: { isNot: null },
    },
    include: {
      page: {
        include: {
          blocks: {
            orderBy: [{ parentId: 'asc' }, { order: 'asc' }],
          },
        },
      },
    },
  });

  if (dealWithBlocks?.page) {
    console.log(`\n   ✓ Deal: "${dealWithBlocks.name}"`);
    console.log(`   ✓ Page ID: ${dealWithBlocks.page.id}`);
    console.log(`   ✓ Total Blocks: ${dealWithBlocks.page.blocks.length}`);
    console.log(`   ✓ Root Blocks: ${dealWithBlocks.page.blocks.filter((b) => !b.parentId).length}`);
    console.log(`   ✓ Child Blocks: ${dealWithBlocks.page.blocks.filter((b) => b.parentId).length}`);
  }

  // Query 3: Find blocks by type
  console.log('\n\n3️⃣  Querying blocks by type...');
  const headingBlocks = await prisma.block.findMany({
    where: { type: 'heading' },
    include: {
      page: {
        include: {
          deal: true,
        },
      },
      children: true,
    },
    take: 3,
  });

  console.log(`\n   ✓ Found ${headingBlocks.length} heading blocks:`);
  for (const block of headingBlocks) {
    const text = (block.properties as any).text || '';
    const level = (block.properties as any).level || '?';
    console.log(`   • H${level}: "${text}" (Deal: ${block.page.deal?.name || 'N/A'}) - ${block.children.length} children`);
  }

  // Query 4: Test polymorphism (Pages can belong to Deals or Companies)
  console.log('\n\n4️⃣  Testing polymorphic relations...');
  const allPages = await prisma.page.findMany({
    include: {
      deal: { select: { name: true } },
      company: { select: { name: true } },
    },
  });

  console.log(`\n   ✓ Total Pages: ${allPages.length}`);
  console.log(`   ✓ Deal Pages: ${allPages.filter((p) => p.dealId).length}`);
  console.log(`   ✓ Company Pages: ${allPages.filter((p) => p.companyId).length}`);

  console.log('\n\n✅ All Block Protocol queries successful!\n');
}

testBlockQueries()
  .catch((error) => {
    console.error('❌ Query test failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
