import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from './constants';

@Injectable()
export class InvoiceRemindersScheduler implements OnModuleInit {
  private readonly logger = new Logger(InvoiceRemindersScheduler.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.INVOICE_REMINDERS) private readonly queue: Queue,
  ) {}

  async onModuleInit() {
    // Remove any existing repeatable jobs to avoid duplicates
    const existing = await this.queue.getRepeatableJobs();
    for (const job of existing) {
      await this.queue.removeRepeatableByKey(job.key);
    }

    // Run daily at 8:00 AM UTC
    await this.queue.add(
      'process-invoice-reminders',
      {},
      {
        repeat: { pattern: '0 8 * * *' },
        removeOnComplete: 10,
        removeOnFail: 50,
      },
    );

    this.logger.log('Invoice reminders cron registered (daily 8 AM UTC)');
  }
}
