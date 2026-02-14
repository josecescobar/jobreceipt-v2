import { PrismaClient } from '@prisma/client';
import { DEFAULT_COST_CODES } from '@jobreceipt/shared';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create a demo organization for development
  const demoUser = await prisma.user.upsert({
    where: { clerkId: 'demo_clerk_id' },
    update: {},
    create: {
      clerkId: 'demo_clerk_id',
      email: 'demo@jobreceipt.com',
      name: 'Demo Contractor',
      role: 'OWNER',
    },
  });

  const demoOrg = await prisma.organization.upsert({
    where: { slug: 'demo-contracting' },
    update: {},
    create: {
      name: 'Demo Contracting LLC',
      slug: 'demo-contracting',
      ownerId: demoUser.id,
      plan: 'PRO',
    },
  });

  // Add demo user as org member
  await prisma.organizationMember.upsert({
    where: {
      userId_organizationId: {
        userId: demoUser.id,
        organizationId: demoOrg.id,
      },
    },
    update: {},
    create: {
      userId: demoUser.id,
      organizationId: demoOrg.id,
      role: 'OWNER',
      acceptedAt: new Date(),
    },
  });

  // Seed default cost codes for the demo org
  for (const costCode of DEFAULT_COST_CODES) {
    await prisma.costCode.upsert({
      where: {
        organizationId_code: {
          organizationId: demoOrg.id,
          code: costCode.code,
        },
      },
      update: {},
      create: {
        organizationId: demoOrg.id,
        code: costCode.code,
        name: costCode.name,
        category: costCode.category,
      },
    });
  }

  console.log(`Seeded ${DEFAULT_COST_CODES.length} cost codes for demo org`);

  // Create a sample active job
  await prisma.job.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      organizationId: demoOrg.id,
      name: 'Smith Kitchen Remodel',
      customerName: 'John Smith',
      customerAddress: '123 Main St, Anytown, WV 25401',
      customerLat: 39.456,
      customerLng: -77.964,
      status: 'ACTIVE',
      budgetTotal: 2500000, // $25,000
      budgetMaterials: 1500000, // $15,000
      budgetLabor: 800000, // $8,000
      startDate: new Date('2025-01-15'),
      notes: 'Full kitchen renovation including cabinets, countertops, and flooring',
    },
  });

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
