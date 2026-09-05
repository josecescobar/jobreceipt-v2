import { InjectQueue, OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job, Queue } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { RECEIPT_OCR_DLQ_QUEUE, RECEIPT_OCR_QUEUE } from '../queue/queue.constants';
import { QueueMetrics } from '../queue/queue.metrics';
import { ReceiptOcrPipelineService } from './receipt-ocr.pipeline.service';

interface ReceiptOcrJob {
  receiptId: string;
}

@Injectable()
@Processor(RECEIPT_OCR_QUEUE)
export class ReceiptOcrProcessor extends WorkerHost {
  private readonly logger = new Logger(ReceiptOcrProcessor.name);

  constructor(
    private readonly pipeline: ReceiptOcrPipelineService,
    private readonly metrics: QueueMetrics,
    @InjectQueue(RECEIPT_OCR_DLQ_QUEUE) private readonly dlqQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<ReceiptOcrJob>): Promise<unknown> {
    const startedAt = Date.now();

    try {
      const result = await this.pipeline.process(job.data.receiptId);
      this.metrics.ocrJobsProcessed.labels('success').inc();
      this.metrics.ocrDurationMs.observe(Date.now() - startedAt);
      return result;
    } catch (error) {
      this.metrics.ocrJobsProcessed.labels('failed').inc();
      this.metrics.ocrDurationMs.observe(Date.now() - startedAt);
      throw error;
    }
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<ReceiptOcrJob> | undefined, error: Error): Promise<void> {
    this.logger.error(`OCR job failed for receipt ${job?.data?.receiptId ?? 'unknown'}`, error.stack);

    if (!job) {
      return;
    }

    await this.dlqQueue.add('receipt-ocr-failed', {
      receiptId: job.data.receiptId,
      error: error.message,
      failedAt: new Date().toISOString(),
      attemptsMade: job.attemptsMade,
    });
  }
}
