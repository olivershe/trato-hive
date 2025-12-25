/**
 * Seed script: Pages & Blocks
 * Creates sample Pages with hierarchical Blocks for Deals
 * Demonstrates the Block Protocol foundation
 */

import { PrismaClient, Deal, User } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedPages(deals: Deal[], users: User[]) {
  console.log('📄 Seeding pages and blocks...');

  if (deals.length === 0) {
    throw new Error('Need at least 1 deal to seed pages');
  }

  if (users.length === 0) {
    throw new Error('Need at least 1 user to seed pages');
  }

  // Get first user as the creator for all blocks
  const creator = users[0];

  // Select a few representative deals to create pages for
  const dealsWithPages = deals.slice(0, 5);

  const createdPages = [];
  const createdBlocks = [];

  for (const deal of dealsWithPages) {
    // Check if page already exists for this deal
    const existingPage = await prisma.page.findFirst({
      where: { dealId: deal.id },
    });

    let page;
    if (existingPage) {
      console.log(`  ↓ Page for "${deal.name}" already exists (${existingPage.id})`);
      page = existingPage;
      createdPages.push(existingPage);
    } else {
      page = await prisma.page.create({
        data: {
          title: `${deal.name} - Deal Overview`,
          dealId: deal.id,
        },
      });
      console.log(`  ✓ Created page for "${deal.name}" (${page.id})`);
      createdPages.push(page);
    }

    // Check if blocks already exist for this page
    const existingBlocks = await prisma.block.findMany({
      where: { pageId: page.id },
    });

    if (existingBlocks.length > 0) {
      console.log(`    ↓ Blocks already exist for page (${existingBlocks.length} blocks)`);
      createdBlocks.push(...existingBlocks);
      continue;
    }

    // Create a hierarchical block structure for this deal page
    // Structure:
    //   - Heading 1: "Deal Overview"
    //     - Paragraph: Summary text
    //   - Heading 2: "Key Highlights"
    //     - Paragraph: Highlights 1
    //     - Paragraph: Highlights 2
    //   - Heading 2: "Next Steps"
    //     - Paragraph: Action items

    // Root Block 1: Heading "Deal Overview"
    const overviewHeading = await prisma.block.create({
      data: {
        type: 'heading',
        properties: {
          text: 'Deal Overview',
          level: 1,
        },
        order: 0,
        pageId: page.id,
        createdBy: creator.id,
      },
    });
    createdBlocks.push(overviewHeading);

    // Child Block: Overview Paragraph
    const overviewParagraph = await prisma.block.create({
      data: {
        type: 'paragraph',
        properties: {
          text: `This deal represents a ${deal.type.toLowerCase()} opportunity for ${deal.name}. Current stage: ${deal.stage.replace(/_/g, ' ')}. Expected value: $${deal.value?.toNumber().toLocaleString() || 'TBD'}.`,
        },
        order: 0,
        pageId: page.id,
        parentId: overviewHeading.id,
        createdBy: creator.id,
      },
    });
    createdBlocks.push(overviewParagraph);

    // Root Block 2: Heading "Key Highlights"
    const highlightsHeading = await prisma.block.create({
      data: {
        type: 'heading',
        properties: {
          text: 'Key Highlights',
          level: 2,
        },
        order: 1,
        pageId: page.id,
        createdBy: creator.id,
      },
    });
    createdBlocks.push(highlightsHeading);

    // Child Blocks: Highlight Paragraphs
    const highlight1 = await prisma.block.create({
      data: {
        type: 'paragraph',
        properties: {
          text: 'Strong market position with proven revenue growth trajectory.',
        },
        order: 0,
        pageId: page.id,
        parentId: highlightsHeading.id,
        createdBy: creator.id,
      },
    });
    createdBlocks.push(highlight1);

    const highlight2 = await prisma.block.create({
      data: {
        type: 'paragraph',
        properties: {
          text: 'Experienced management team with successful exit history.',
        },
        order: 1,
        pageId: page.id,
        parentId: highlightsHeading.id,
        createdBy: creator.id,
      },
    });
    createdBlocks.push(highlight2);

    // Root Block 3: Heading "Next Steps"
    const nextStepsHeading = await prisma.block.create({
      data: {
        type: 'heading',
        properties: {
          text: 'Next Steps',
          level: 2,
        },
        order: 2,
        pageId: page.id,
        createdBy: creator.id,
      },
    });
    createdBlocks.push(nextStepsHeading);

    // Child Block: Next Steps Paragraph
    const nextStepsParagraph = await prisma.block.create({
      data: {
        type: 'paragraph',
        properties: {
          text: deal.probability && deal.probability > 50
            ? 'Complete final due diligence and prepare IC materials for approval.'
            : 'Schedule management meetings and request preliminary financial documents.',
        },
        order: 0,
        pageId: page.id,
        parentId: nextStepsHeading.id,
        createdBy: creator.id,
      },
    });
    createdBlocks.push(nextStepsParagraph);

    console.log(`    ✓ Created 7 blocks in hierarchical structure`);
  }

  return { pages: createdPages, blocks: createdBlocks };
}
