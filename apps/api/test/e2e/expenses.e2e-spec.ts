import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Expenses (e2e)', () => {
  let app: INestApplication;

  const mockPrisma = {
    user: {
      findUnique: jest.fn().mockResolvedValue({ id: 'user-1', clerkId: 'clerk_123' }),
    },
    organizationMember: {
      findUnique: jest.fn().mockResolvedValue({ userId: 'user-1', organizationId: 'org-1', role: 'OWNER' }),
    },
    expense: {
      create: jest.fn().mockResolvedValue({
        id: 'expense-1',
        organizationId: 'org-1',
        jobId: 'job-1',
        amount: 15000,
        description: 'Lumber for framing',
        date: new Date(),
      }),
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
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

  describe('Expense CRUD', () => {
    it('should require authentication', async () => {
      return request(app.getHttpServer())
        .get('/api/expenses')
        .expect(401);
    });
  });
});
