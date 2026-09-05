import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueueHealthService } from '../queue/queue-health.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queueHealth: QueueHealthService,
  ) {}

  async health(): Promise<{
    status: 'ok' | 'degraded';
    database: 'up' | 'down';
    redis: 'up' | 'down';
    backlog: number;
    timestamp: string;
  }> {
    let database: 'up' | 'down' = 'up';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      database = 'down';
    }

    const queue = await this.queueHealth.getHealth();
    const status = database === 'up' && queue.redis === 'up' ? 'ok' : 'degraded';

    return {
      status,
      database,
      redis: queue.redis,
      backlog: queue.backlog,
      timestamp: new Date().toISOString(),
    };
  }
}
