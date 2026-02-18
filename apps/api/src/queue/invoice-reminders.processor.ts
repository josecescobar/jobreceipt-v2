import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../common/services/notification.service';
import { QUEUE_NAMES } from './constants';

const MILESTONES = [7, 14, 30] as const;

@Processor(QUEUE_NAMES.INVOICE_REMINDERS)
export class InvoiceRemindersProcessor extends WorkerHost {
  private readonly logger = new Logger(InvoiceRemindersProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing invoice reminders job ${job.id}`);

    const now = new Date();

    // Find all organizations with overdue invoices
    const overdueInvoices = await this.prisma.invoice.findMany({
      where: {
        status: { in: ['SENT', 'PARTIALLY_PAID'] },
        dueDate: { not: null, lt: now },
      },
      include: {
        organization: { select: { ownerId: true } },
        reminders: { select: { type: true } },
      },
    });

    let sentCount = 0;

    for (const invoice of overdueInvoices) {
      const daysOverdue = Math.floor(
        (now.getTime() - new Date(invoice.dueDate!).getTime()) / (1000 * 60 * 60 * 24),
      );

      const existingTypes = new Set(invoice.reminders.map((r) => r.type));
      const outstanding = invoice.total - invoice.paidAmount;
      const formattedAmount = `$${(outstanding / 100).toFixed(2)}`;

      for (const milestone of MILESTONES) {
        if (daysOverdue < milestone) continue;

        const reminderType = `${milestone}_day`;
        if (existingTypes.has(reminderType)) continue;

        try {
          // Create reminder record
          await this.prisma.invoiceReminder.create({
            data: {
              invoiceId: invoice.id,
              type: reminderType,
            },
          });

          // Send push notification to org owner
          await this.notificationService.sendPushNotification(
            invoice.organization.ownerId,
            'Invoice Overdue',
            `${invoice.invoiceNumber} is ${daysOverdue} days overdue — ${formattedAmount} outstanding`,
            { screen: 'invoice', invoiceId: invoice.id },
            'invoice_reminder',
          );

          sentCount++;
        } catch (err) {
          this.logger.error(
            `Failed to send ${reminderType} reminder for invoice ${invoice.id}: ${err}`,
          );
        }
      }
    }

    this.logger.log(
      `Done: processed ${overdueInvoices.length} overdue invoices, sent ${sentCount} reminders`,
    );
  }
}
