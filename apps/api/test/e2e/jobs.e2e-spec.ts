import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Jobs (e2e)', () => {
  let app: INestApplication;

  const mockJobs = [
    {
      id: 'job-1',
      organizationId: 'org-1',
      name: 'Smith Kitchen Remodel',
      customerName: 'John Smith',
      status: 'ACTIVE',
      budgetTotal: 2500000,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockPrisma = {
    user: {
      findUnique: jest.fn().mockResolvedValue({ id: 'user-1', clerkId: 'clerk_123' }),
    },
    organizationMember: {
      findUnique: jest.fn().mockResolvedValue({ userId: 'user-1', organizationId: 'org-1', role: 'OWNER' }),
    },
    job: {
      create: jest.fn().mockResolvedValue(mockJobs[0]),
      findMany: jest.fn().mockResolvedValue(mockJobs),
      findFirst: jest.fn().mockResolvedValue(mockJobs[0]),
      update: jest.fn().mockResolvedValue({ ...mockJobs[0], name: 'Updated Job' }),
      count: jest.fn().mockResolvedValue(1),
    },
    expense: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Job CRUD operations', () => {
    it('should require authentication for job endpoints', async () => {
      return request(app.getHttpServer())
        .get('/api/jobs')
        .expect(401);
    });
  });
});
