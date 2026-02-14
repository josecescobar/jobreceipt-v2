import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        user: {
          upsert: jest.fn().mockResolvedValue({
            id: 'user-1',
            clerkId: 'clerk_123',
            email: 'test@example.com',
            name: 'Test User',
          }),
          update: jest.fn().mockResolvedValue({
            id: 'user-1',
            clerkId: 'clerk_123',
            email: 'updated@example.com',
          }),
          delete: jest.fn().mockResolvedValue({ id: 'user-1' }),
        },
        $connect: jest.fn(),
        $disconnect: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/auth/webhook', () => {
    it('should reject requests without svix headers', async () => {
      return request(app.getHttpServer())
        .post('/api/auth/webhook')
        .send({ type: 'user.created', data: {} })
        .expect(400);
    });
  });
});
