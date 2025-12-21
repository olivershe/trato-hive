/**
 * Seed script: Organizations (PE Firms)
 * Creates 3 sample PE firms with realistic data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedFirms() {
  console.log('🏢 Seeding organizations (PE firms)...');

  const firms = [
    {
      name: 'Acme Capital Partners',
      slug: 'acme-capital',
      description: 'Growth equity firm focused on B2B SaaS and fintech companies',
      image: null,
    },
    {
      name: 'Summit Ventures',
      slug: 'summit-ventures',
      description: 'Mid-market PE firm specializing in healthcare and technology',
      image: null,
    },
    {
      name: 'Peak Equity Group',
      slug: 'peak-equity',
      description: 'Early-stage venture capital fund investing in enterprise software',
      image: null,
    },
  ];

  const createdFirms = [];

  for (const firmData of firms) {
    // Idempotent: Check if firm already exists
    const existing = await prisma.organization.findUnique({
      where: { slug: firmData.slug },
    });

    if (existing) {
      console.log(`  ↓ Organization "${firmData.name}" already exists (${existing.id})`);
      createdFirms.push(existing);
    } else {
      const firm = await prisma.organization.create({
        data: firmData,
      });
      console.log(`  ✓ Created organization "${firm.name}" (${firm.id})`);
      createdFirms.push(firm);
    }
  }

  return createdFirms;
}
