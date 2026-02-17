import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Mileage (e2e)', () => {
  let app: INestApplication;

  const mockTrip = {
    id: 'trip-1',
    organizationId: 'org-1',
    jobId: 'job-1',
    userId: 'user-1',
    startLat: 34.0522,
    startLng: -118.2437,
    endLat: 34.0195,
    endLng: -118.4912,
    distanceMiles: 12.5,
    irsRate: 70,
    totalDeduction: 875,
    date: new Date(),
    purpose: 'Site visit',
    createdAt: new Date(),
    updatedAt: new Date(),
    job: { id: 'job-1', name: 'Smith Remodel' },
    user: { id: 'user-1', name: 'John', email: 'john@test.com' },
  };

  const mockPrisma = {
    user: {
      findUnique: jest.fn().mockResolvedValue({ id: 'user-1', clerkId: 'clerk_123' }),
    },
    organizationMember: {
      findUnique: jest.fn().mockResolvedValue({ userId: 'user-1', organizationId: 'org-1', role: 'OWNER' }),
    },
    mileageTrip: {
      create: jest.fn().mockResolvedValue(mockTrip),
      findMany: jest.fn().mockResolvedValue([mockTrip]),
      findFirst: jest.fn().mockResolvedValue(mockTrip),
      update: jest.fn().mockResolvedValue({ ...mockTrip, distanceMiles: 15.0, totalDeduction: 1050 }),
      delete: jest.fn().mockResolvedValue(mockTrip),
      count: jest.fn().mockResolvedValue(1),
      aggregate: jest.fn().mockResolvedValue({
        _sum: { distanceMiles: 12.5, totalDeduction: 875 },
      }),
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

  describe('Authentication', () => {
    it('should require authentication for mileage endpoints', async () => {
      return request(app.getHttpServer())
        .get('/api/mileage')
        .expect(401);
    });

    it('should require authentication to create a trip', async () => {
      return request(app.getHttpServer())
        .post('/api/mileage')
        .send({
          jobId: 'job-1',
          startLat: 34.0522,
          startLng: -118.2437,
          endLat: 34.0195,
          endLng: -118.4912,
          distanceMiles: 12.5,
          date: '2025-06-15',
        })
        .expect(401);
    });

    it('should require authentication to get summary', async () => {
      return request(app.getHttpServer())
        .get('/api/mileage/summary')
        .expect(401);
    });
  });
});
