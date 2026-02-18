import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from './constants';

@Injectable()
export class RecurringExpensesScheduler implements OnModuleInit {
  private readonly logger = new Logger(RecurringExpensesScheduler.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.RECURRING_EXPENSES) private readonly queue: Queue,
  ) {}

  async onModuleInit() {
    // Remove any existing repeatable jobs to avoid duplicates
    const existing = await this.queue.getRepeatableJobs();
    for (const job of existing) {
      await this.queue.removeRepeatableByKey(job.key);
    }

    // Run daily at 6:00 AM UTC
    await this.queue.add(
      'process-recurring',
      {},
      {
        repeat: { pattern: '0 6 * * *' },
        removeOnComplete: 10,
        removeOnFail: 50,
      },
    );

    this.logger.log('Recurring expenses cron registered (daily 6 AM UTC)');
  }
}
