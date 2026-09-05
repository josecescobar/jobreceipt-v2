import { Test, type TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { HealthController } from '../src/health/health.controller';
import { HealthService } from '../src/health/health.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { QueueHealthService } from '../src/queue/queue-health.service';
import { QueueMetrics } from '../src/queue/queue.metrics';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        HealthService,
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
          },
        },
        {
          provide: QueueHealthService,
          useValue: {
            getHealth: jest.fn().mockResolvedValue({ redis: 'up', backlog: 0 }),
          },
        },
        {
          provide: QueueMetrics,
          useValue: {
            metrics: jest.fn().mockResolvedValue(''),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('/health (GET)', async () => {
    await request(app.getHttpServer()).get('/health').expect(200);
  });
});
