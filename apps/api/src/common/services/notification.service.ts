import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private prisma: PrismaService) {}

  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { pushToken: true },
    });

    if (!user?.pushToken) {
      this.logger.debug(`No push token for user ${userId}, skipping notification`);
      return;
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
