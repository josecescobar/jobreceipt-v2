import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../common/services/notification.service';
import { AnalyticsService } from '../modules/analytics/analytics.service';
import { QUEUE_NAMES } from './constants';

@Processor(QUEUE_NAMES.NOTIFICATION_CRON)
export class NotificationCronProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationCronProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly analyticsService: AnalyticsService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Running notification cron job ${job.id}`);
    await this.sendReceiptReviewReminders();
    await this.checkMarginAlerts();
  }

  private async checkMarginAlerts(): Promise<void> {
    try {
      this.logger.log('Running daily margin alert checks');
      await this.analyticsService.checkAllMarginAlerts();
      this.logger.log('Daily margin alert checks complete');
    } catch (err) {
      this.logger.error(`Failed to run margin alert checks: ${err}`);
    }
  }

  private async sendReceiptReviewReminders(): Promise<void> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Find receipts in REVIEW status that were processed more than 24 hours ago
    const pendingReceipts = await this.prisma.receipt.findMany({
      where: {
        status: 'REVIEW',
        processedAt: { lte: oneDayAgo },
      },
      select: {
        uploadedById: true,
      },
    });

    if (pendingReceipts.length === 0) {
      this.logger.log('No pending review reminders to send');
      return;
    }

    // Group by user
    const userCounts = new Map<string, number>();
    for (const receipt of pendingReceipts) {
      const count = userCounts.get(receipt.uploadedById) || 0;
      userCounts.set(receipt.uploadedById, count + 1);
    }

    this.logger.log(`Sending review reminders to ${userCounts.size} users`);

    for (const [userId, count] of userCounts) {
      try {
        await this.notificationService.sendPushNotification(
          userId,
          'Receipts Need Review',
          `You have ${count} receipt${count !== 1 ? 's' : ''} waiting for review`,
          { screen: 'receipts' },
          'review_reminder',
        );
      } catch (err) {
        this.logger.error(`Failed to send review reminder to user ${userId}: ${err}`);
      }
    }
  }
}
