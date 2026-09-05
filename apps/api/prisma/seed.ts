import { PrismaClient, CostCodeCategory, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const user = await prisma.user.upsert({
    where: { clerkId: 'seed_clerk_owner' },
    create: {
      clerkId: 'seed_clerk_owner',
      email: 'owner@jobreceipt.local',
      name: 'Owner User',
      role: UserRole.OWNER,
    },
    update: {},
  });

  const org = await prisma.organization.upsert({
    where: { slug: 'real-elite-contracting' },
    create: {
      name: 'Real Elite Contracting',
      slug: 'real-elite-contracting',
      ownerId: user.id,
      members: {
        create: {
          userId: user.id,
          role: UserRole.OWNER,
          acceptedAt: new Date(),
        },
      },
    },
    update: {},
  });

  await prisma.job.createMany({
    data: [
      {
        organizationId: org.id,
        name: 'Smith Roof Replacement',
        customerName: 'John Smith',
        status: 'ACTIVE',
        budgetTotalCents: 2500000,
        budgetMaterialsCents: 1400000,
        budgetLaborCents: 800000,
      },
      {
        organizationId: org.id,
        name: 'Miller Deck Remodel',
        customerName: 'Sarah Miller',
        status: 'ACTIVE',
        budgetTotalCents: 1800000,
        budgetMaterialsCents: 900000,
        budgetLaborCents: 700000,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.costCode.createMany({
    data: [
      {
        organizationId: org.id,
        code: '06-11-00',
        name: 'Wood Framing',
        category: CostCodeCategory.MATERIALS,
      },
      {
        organizationId: org.id,
        code: '09-90-00',
        name: 'Painting',
        category: CostCodeCategory.LABOR,
      },
      {
        organizationId: org.id,
        code: '01-52-00',
        name: 'Safety Equipment',
        category: CostCodeCategory.OVERHEAD,
      },
    ],
    skipDuplicates: true,
  });

  console.log('Seed completed');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
