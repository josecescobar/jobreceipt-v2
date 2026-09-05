import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { RECEIPT_OCR_QUEUE } from './queue.constants';
import { QueueMetrics } from './queue.metrics';

@Injectable()
export class QueueHealthService {
  constructor(
    @InjectQueue(RECEIPT_OCR_QUEUE) private readonly queue: Queue,
    private readonly metrics: QueueMetrics,
  ) {}

  async getHealth(): Promise<{ redis: 'up' | 'down'; backlog: number }> {
    try {
      const counts = await this.queue.getJobCounts();
      const backlog = (counts.waiting ?? 0) + (counts.delayed ?? 0) + (counts.active ?? 0);
      this.metrics.backlogGauge.set(backlog);
      return { redis: 'up', backlog };
    } catch {
      return { redis: 'down', backlog: 0 };
    }
  }
}
