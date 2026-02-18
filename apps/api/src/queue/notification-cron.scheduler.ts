import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from './constants';

@Injectable()
export class NotificationCronScheduler implements OnModuleInit {
  private readonly logger = new Logger(NotificationCronScheduler.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.NOTIFICATION_CRON) private readonly queue: Queue,
  ) {}

  async onModuleInit() {
    // Remove any existing repeatable jobs to avoid duplicates
    const existing = await this.queue.getRepeatableJobs();
    for (const job of existing) {
      await this.queue.removeRepeatableByKey(job.key);
    }

    // Run daily at 9:00 AM UTC
    await this.queue.add(
      'send-reminders',
      {},
      {
        repeat: { pattern: '0 9 * * *' },
        removeOnComplete: 10,
        removeOnFail: 50,
      },
    );

    this.logger.log('Notification cron registered (daily 9 AM UTC)');
  }
}
