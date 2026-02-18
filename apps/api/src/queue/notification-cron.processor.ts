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
    await this.checkEstimateExpirations();
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

  private async checkEstimateExpirations(): Promise<void> {
    try {
      this.logger.log('Checking for expiring estimates');

      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      const expiringEstimates = await this.prisma.estimate.findMany({
        where: {
          status: 'SENT',
          expiresAt: {
            not: null,
            gt: now,
            lte: threeDaysFromNow,
          },
        },
        select: {
          id: true,
          estimateNumber: true,
          expiresAt: true,
          createdById: true,
          job: { select: { name: true } },
        },
      });

      if (expiringEstimates.length === 0) {
        this.logger.log('No expiring estimates found');
        return;
      }

      this.logger.log(`Found ${expiringEstimates.length} expiring estimate(s)`);

      for (const estimate of expiringEstimates) {
        const daysUntilExpiry = Math.ceil(
          (new Date(estimate.expiresAt!).getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
        );

        try {
          this.notificationService.sendPushNotification(
            estimate.createdById,
            'Estimate Expiring',
            `${estimate.estimateNumber} for ${estimate.job.name} expires in ${daysUntilExpiry} day(s)`,
            { screen: 'estimate', estimateId: estimate.id },
            'review_reminder',
          );
        } catch (err) {
          this.logger.error(
            `Failed to send expiration reminder for estimate ${estimate.id}: ${err}`,
          );
        }
      }
    } catch (err) {
      this.logger.error(`Failed to check estimate expirations: ${err}`);
    }
  }
}
