import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { RECEIPT_OCR_DLQ_QUEUE, RECEIPT_OCR_QUEUE } from './queue.constants';
import { QueueHealthService } from './queue-health.service';
import { QueueMetrics } from './queue.metrics';

@Module({
  imports: [
    BullModule.registerQueue(
      {
        name: RECEIPT_OCR_QUEUE,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: true,
          removeOnFail: 500,
        },
      },
      {
        name: RECEIPT_OCR_DLQ_QUEUE,
      },
    ),
  ],
  providers: [QueueHealthService, QueueMetrics],
  exports: [BullModule, QueueHealthService, QueueMetrics],
})
export class QueueModule {}
