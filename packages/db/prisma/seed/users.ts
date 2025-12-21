/**
 * Seed script: Users & Organization Members
 * Creates 10 users with different roles across the 3 PE firms
 */

import { PrismaClient, Organization, OrganizationRole } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedUsers(firms: Organization[]) {
  console.log('👥 Seeding users and organization members...');

  if (firms.length < 3) {
    throw new Error('Need at least 3 firms to seed users');
  }

  const [acme, summit, peak] = firms;

  const usersData = [
    // Acme Capital Partners (3 users)
    {
      email: 'sarah.chen@acmecapital.com',
      name: 'Sarah Chen',
      organizationId: acme.id,
      role: OrganizationRole.OWNER,
    },
    {
      email: 'james.wilson@acmecapital.com',
      name: 'James Wilson',
      organizationId: acme.id,
      role: OrganizationRole.ADMIN,
    },
    {
      email: 'maria.garcia@acmecapital.com',
      name: 'Maria Garcia',
      organizationId: acme.id,
      role: OrganizationRole.MEMBER,
    },

    // Summit Ventures (4 users)
    {
      email: 'robert.taylor@summitvc.com',
      name: 'Robert Taylor',
      organizationId: summit.id,
      role: OrganizationRole.OWNER,
    },
    {
      email: 'emily.brown@summitvc.com',
      name: 'Emily Brown',
      organizationId: summit.id,
      role: OrganizationRole.ADMIN,
    },
    {
      email: 'david.kim@summitvc.com',
      name: 'David Kim',
      organizationId: summit.id,
      role: OrganizationRole.MEMBER,
    },
    {
      email: 'lisa.anderson@summitvc.com',
      name: 'Lisa Anderson',
      organizationId: summit.id,
      role: OrganizationRole.VIEWER,
    },

    // Peak Equity Group (3 users)
    {
      email: 'michael.johnson@peakequity.com',
      name: 'Michael Johnson',
      organizationId: peak.id,
      role: OrganizationRole.OWNER,
    },
    {
      email: 'jennifer.lee@peakequity.com',
      name: 'Jennifer Lee',
      organizationId: peak.id,
      role: OrganizationRole.MEMBER,
    },
    {
      email: 'alex.martinez@peakequity.com',
      name: 'Alex Martinez',
      organizationId: peak.id,
      role: OrganizationRole.VIEWER,
    },
  ];

  const createdUsers = [];

  for (const userData of usersData) {
    // Idempotent: Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: userData.email },
      include: { organizations: true },
    });

    if (existing) {
      console.log(`  ↓ User "${userData.name}" already exists (${existing.id})`);
      createdUsers.push(existing);
    } else {
      // Create user
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          emailVerified: new Date(),
        },
      });

      // Create organization membership
      await prisma.organizationMember.create({
        data: {
          userId: user.id,
          organizationId: userData.organizationId,
          role: userData.role,
        },
      });

      console.log(`  ✓ Created user "${user.name}" (${user.id}) - ${userData.role}`);
      createdUsers.push(user);
    }
  }

  return createdUsers;
}
