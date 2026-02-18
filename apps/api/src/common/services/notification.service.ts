import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type NotificationType =
  | 'receipt_processed'
  | 'budget_alert'
  | 'expense_approval'
  | 'review_reminder'
  | 'recurring_expense'
  | 'invoice_reminder'
  | 'new_message'
  | 'margin_alert'
  | 'change_order';

const TYPE_TO_PREF_KEY: Record<NotificationType, string> = {
  receipt_processed: 'receiptProcessed',
  budget_alert: 'budgetAlerts',
  expense_approval: 'expenseApproval',
  review_reminder: 'reviewReminders',
  recurring_expense: 'recurringExpenses',
  invoice_reminder: 'invoiceReminders',
  new_message: 'messages',
  margin_alert: 'marginAlerts',
  change_order: 'changeOrders',
};

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private prisma: PrismaService) {}

  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
    type?: NotificationType,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { pushToken: true, notificationPrefs: true },
    });

    if (!user?.pushToken) {
      this.logger.debug(`No push token for user ${userId}, skipping notification`);
      return;
    }

    // Check user's notification preferences
    if (type && user.notificationPrefs) {
      const prefs = user.notificationPrefs as Record<string, boolean>;
      const prefKey = TYPE_TO_PREF_KEY[type];
      if (prefKey && prefs[prefKey] === false) {
        this.logger.debug(`User ${userId} has disabled ${type} notifications, skipping`);
        return;
      }
    }

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: user.pushToken,
          title,
          body,
          data,
          sound: 'default',
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        this.logger.error(`Expo push failed: ${response.status} ${text}`);
      } else {
        this.logger.log(`Push notification sent to user ${userId}: "${title}"`);
      }
    } catch (error) {
      this.logger.error(`Failed to send push notification to user ${userId}`, error);
    }
  }
}
