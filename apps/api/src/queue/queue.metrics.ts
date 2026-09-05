import { Injectable } from '@nestjs/common';
import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

@Injectable()
export class QueueMetrics {
  private readonly registry = new Registry();

  readonly ocrJobsProcessed = new Counter({
    name: 'ocr_jobs_processed_total',
    help: 'Total OCR jobs processed',
    labelNames: ['status'],
    registers: [this.registry],
  });

  readonly ocrDurationMs = new Histogram({
    name: 'ocr_duration_ms',
    help: 'OCR processing duration in milliseconds',
    buckets: [100, 300, 500, 1000, 2000, 3000, 5000, 8000],
    registers: [this.registry],
  });

  readonly autoAssignCount = new Counter({
    name: 'ocr_auto_assign_total',
    help: 'Total auto-assigned receipts',
    registers: [this.registry],
  });

  readonly backlogGauge = new Gauge({
    name: 'ocr_queue_backlog',
    help: 'Current OCR queue backlog size',
    registers: [this.registry],
  });

  constructor() {
    collectDefaultMetrics({ register: this.registry });
  }

  async metrics(): Promise<string> {
    return this.registry.metrics();
  }
}
