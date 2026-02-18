import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InvoicesService } from '../invoices/invoices.service';
import { Prisma, RecurringExpenseFrequency } from '@prisma/client';
import { CreateRecurringInvoiceLineItemDto } from './dto/create-recurring-invoice.dto';

interface CreateRecurringInvoiceData {
  jobId: string;
  frequency: RecurringExpenseFrequency;
  startDate: string;
  endDate?: string;
  notes?: string;
  taxRate?: number;
  lineItems: CreateRecurringInvoiceLineItemDto[];
}

interface UpdateRecurringInvoiceData {
  frequency?: RecurringExpenseFrequency;
  startDate?: string;
  endDate?: string;
  notes?: string;
  taxRate?: number;
  isActive?: boolean;
  lineItems?: CreateRecurringInvoiceLineItemDto[];
}

const recurringInvoiceInclude = {
  job: { select: { id: true, name: true } },
  lineItems: { orderBy: { sortOrder: 'asc' as const } },
  createdBy: { select: { id: true, name: true, email: true } },
};

@Injectable()
export class RecurringInvoicesService {
  private readonly logger = new Logger(RecurringInvoicesService.name);

  constructor(
    private prisma: PrismaService,
    private invoicesService: InvoicesService,
  ) {}

  async create(orgId: string, userId: string, data: CreateRecurringInvoiceData) {
    return this.prisma.$transaction(async (tx) => {
      const recurringInvoice = await tx.recurringInvoice.create({
        data: {
          organizationId: orgId,
          jobId: data.jobId,
          frequency: data.frequency,
          startDate: new Date(data.startDate),
          endDate: data.endDate ? new Date(data.endDate) : null,
          nextOccurrence: new Date(data.startDate),
          notes: data.notes || null,
          taxRate: data.taxRate ?? 0,
          createdById: userId,
        },
      });

      if (data.lineItems.length > 0) {
        await tx.recurringInvoiceLineItem.createMany({
          data: data.lineItems.map((item, index) => ({
            recurringInvoiceId: recurringInvoice.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            sortOrder: index,
          })),
        });
      }

      return tx.recurringInvoice.findUnique({
        where: { id: recurringInvoice.id },
        include: recurringInvoiceInclude,
      });
    });
  }

  async findAll(orgId: string, query: { isActive?: string; jobId?: string; page: number; limit: number }) {
    const where: Prisma.RecurringInvoiceWhereInput = { organizationId: orgId };

    if (query.isActive !== undefined) {
      where.isActive = query.isActive === 'true';
    }
    if (query.jobId) {
      where.jobId = query.jobId;
    }

    const [data, total] = await Promise.all([
      this.prisma.recurringInvoice.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: recurringInvoiceInclude,
      }),
      this.prisma.recurringInvoice.count({ where }),
    ]);

    return { data, total, page: query.page, limit: query.limit };
  }

  async findOne(orgId: string, id: string) {
    const item = await this.prisma.recurringInvoice.findFirst({
      where: { id, organizationId: orgId },
      include: recurringInvoiceInclude,
    });
    if (!item) throw new NotFoundException('Recurring invoice not found');
    return item;
  }

  async update(orgId: string, id: string, data: UpdateRecurringInvoiceData) {
    await this.findOne(orgId, id);

    return this.prisma.$transaction(async (tx) => {
      const updateData: Prisma.RecurringInvoiceUpdateInput = {};
      if (data.frequency !== undefined) updateData.frequency = data.frequency;
      if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
      if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.taxRate !== undefined) updateData.taxRate = data.taxRate;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      if (data.lineItems) {
        await tx.recurringInvoiceLineItem.deleteMany({ where: { recurringInvoiceId: id } });
        if (data.lineItems.length > 0) {
          await tx.recurringInvoiceLineItem.createMany({
            data: data.lineItems.map((item, index) => ({
              recurringInvoiceId: id,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              sortOrder: index,
            })),
          });
        }
      }

      await tx.recurringInvoice.update({ where: { id }, data: updateData });

      return tx.recurringInvoice.findUnique({
        where: { id },
        include: recurringInvoiceInclude,
      });
    });
  }

  async remove(orgId: string, id: string) {
    await this.findOne(orgId, id);
    return this.prisma.recurringInvoice.delete({ where: { id } });
  }

  async processDueRecurringInvoices(): Promise<{ processed: number; errors: number }> {
    const now = new Date();
    const dueItems = await this.prisma.recurringInvoice.findMany({
      where: {
        isActive: true,
        nextOccurrence: { lte: now },
      },
      include: {
        lineItems: { orderBy: { sortOrder: 'asc' } },
        job: { select: { name: true } },
      },
    });

    this.logger.log(`Found ${dueItems.length} due recurring invoices`);
    let processed = 0;
    let errors = 0;

    for (const item of dueItems) {
      try {
        // Create the invoice via InvoicesService
        const invoice = await this.invoicesService.create(item.organizationId, item.createdById, {
          jobId: item.jobId,
          notes: item.notes || undefined,
          taxRate: item.taxRate,
          lineItems: item.lineItems.map((li) => ({
            description: li.description,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
          })),
        });

        // Auto-send: mark as SENT with a share token so it's immediately shareable
        if (invoice) {
          const { randomUUID } = await import('crypto');
          await this.prisma.invoice.update({
            where: { id: invoice.id },
            data: { status: 'SENT', shareToken: randomUUID() },
          });
        }

        // Compute next occurrence
        const nextDate = this.computeNextOccurrence(item.nextOccurrence, item.frequency);
        const shouldDeactivate = item.endDate && nextDate > item.endDate;

        await this.prisma.recurringInvoice.update({
          where: { id: item.id },
          data: {
            lastCreatedAt: now,
            nextOccurrence: nextDate,
            isActive: shouldDeactivate ? false : undefined,
          },
        });

        processed++;
      } catch (err) {
        errors++;
        this.logger.error(`Failed to process recurring invoice ${item.id}: ${err}`);
      }
    }

    this.logger.log(`Processed ${processed}, errors ${errors}`);
    return { processed, errors };
  }

  private computeNextOccurrence(current: Date, frequency: RecurringExpenseFrequency): Date {
    const next = new Date(current);
    switch (frequency) {
      case 'WEEKLY':
        next.setDate(next.getDate() + 7);
        break;
      case 'BIWEEKLY':
        next.setDate(next.getDate() + 14);
        break;
      case 'MONTHLY':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'QUARTERLY':
        next.setMonth(next.getMonth() + 3);
        break;
      case 'ANNUALLY':
        next.setFullYear(next.getFullYear() + 1);
        break;
    }
    return next;
  }
}
