import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Queue } from 'bullmq';
import { UserRole } from '@prisma/client';
import type { RequestUser } from '../common/decorators/current-user.decorator';
import { RequestContextService } from '../common/request-context/request-context.service';
import { PrismaService } from '../prisma/prisma.service';
import { RECEIPT_OCR_QUEUE } from '../queue/queue.constants';
import { buildPaginatedResponse } from '../common/dto/paginated-response.dto';
import { BulkAction, BulkActionDto } from './dto/bulk-action.dto';
import { ListReceiptsDto } from './dto/list-receipts.dto';
import { PatchReceiptDto } from './dto/patch-receipt.dto';
import { SplitReceiptDto } from './dto/split-receipt.dto';
import { UploadReceiptDto } from './dto/upload-receipt.dto';
import { ReceiptStorageService } from './receipt-storage.service';
import { validateSplitAssignments } from './split-validator';

@Injectable()
export class ReceiptsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly requestContext: RequestContextService,
    private readonly storage: ReceiptStorageService,
    @InjectQueue(RECEIPT_OCR_QUEUE) private readonly queue: Queue,
  ) {}

  private organizationId(): string {
    const organizationId = this.requestContext.getOrganizationId();

    if (!organizationId) {
      throw new BadRequestException('x-org-id header is required');
    }

    return organizationId;
  }

  private async ensureUser(auth: RequestUser): Promise<{ id: string }> {
    return this.prisma.user.upsert({
      where: { clerkId: auth.clerkId },
      create: {
        clerkId: auth.clerkId,
        email: `${auth.clerkId}@jobreceipt.local`,
        role: UserRole.OWNER,
      },
      update: {},
      select: { id: true },
    });
  }

  async upload(auth: RequestUser, dto: UploadReceiptDto) {
    const organizationId = this.organizationId();
    const user = await this.ensureUser(auth);

    const receipt = await this.prisma.receipt.create({
      data: {
        organizationId,
        uploadedById: user.id,
        imageUrl: 'pending://upload',
        status: 'PROCESSING',
      },
    });

    const safeName = this.storage.sanitizeFileName(dto.fileName);
    const objectKey = `org/${organizationId}/receipts/${receipt.id}/${Date.now()}-${safeName}`;

    await this.prisma.receipt.updateMany({
      where: {
        id: receipt.id,
      },
      data: {
        imageUrl: `s3://${this.storage.getBucket()}/${objectKey}`,
      },
    });

    const presigned = await this.storage.createPutUploadUrl(objectKey, dto.contentType);

    return {
      receiptId: receipt.id,
      objectKey,
      uploadUrl: presigned.url,
      expiresInSeconds: presigned.expiresIn,
    };
  }

  async process(receiptId: string) {
    await this.getById(receiptId);

    const job = await this.queue.add(
      'receipt-ocr',
      { receiptId },
      {
        jobId: receiptId,
      },
    );

    return {
      queued: true,
      queueJobId: job.id,
    };
  }

  async getById(receiptId: string) {
    const receipt = await this.prisma.receipt.findFirst({
      where: {
        id: receiptId,
      },
      include: {
        lineItems: true,
        expenses: true,
      },
    });

    if (!receipt) {
      throw new NotFoundException('Receipt not found');
    }

    return receipt;
  }

  async list(query: ListReceiptsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 25;
    const skip = (page - 1) * limit;

    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.merchant
        ? {
            merchantName: {
              contains: query.merchant,
              mode: 'insensitive' as const,
            },
          }
        : {}),
      ...(query.startDate || query.endDate
        ? {
            transactionDate: {
              ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
              ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
            },
          }
        : {}),
      ...(query.jobId
        ? {
            OR: [
              { suggestedJobId: query.jobId },
              { lineItems: { some: { jobId: query.jobId } } },
            ],
          }
        : {}),
    };

    const [data, totalCount] = await Promise.all([
      this.prisma.receipt.findMany({
        where,
        include: { lineItems: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.receipt.count({ where }),
    ]);

    return buildPaginatedResponse(data, totalCount, page, limit);
  }

  async patch(receiptId: string, auth: RequestUser, dto: PatchReceiptDto) {
    const receipt = await this.getById(receiptId);
    const user = await this.ensureUser(auth);

    await this.prisma.receipt.updateMany({
      where: {
        id: receiptId,
      },
      data: {
        status: dto.status,
        suggestedJobId: dto.jobId,
        merchantName: dto.merchantName,
        merchantAddress: dto.merchantAddress,
        transactionDate: dto.transactionDate ? new Date(dto.transactionDate) : undefined,
        subtotalCents: dto.subtotalCents,
        taxAmountCents: dto.taxAmountCents,
        totalAmountCents: dto.totalAmountCents,
      },
    });

    if (dto.status === 'APPROVED') {
      const jobId = dto.jobId ?? receipt.suggestedJobId;
      if (!jobId) {
        throw new BadRequestException('Approving a receipt requires a job assignment');
      }

      const existingExpense = await this.prisma.expense.findFirst({
        where: {
          receiptId,
        },
      });

      if (!existingExpense) {
        await this.prisma.expense.create({
          data: {
            organizationId: receipt.organizationId,
            receiptId,
            jobId,
            amountCents: dto.totalAmountCents ?? receipt.totalAmountCents ?? 0,
            description: `Receipt from ${dto.merchantName ?? receipt.merchantName ?? 'Unknown merchant'}`,
            category: 'MATERIALS',
            date: receipt.transactionDate ?? new Date(),
            createdById: user.id,
            approvedById: user.id,
            approvedAt: new Date(),
          },
        });
      }
    }

    return this.getById(receiptId);
  }

  async split(receiptId: string, auth: RequestUser, dto: SplitReceiptDto) {
    const receipt = await this.getById(receiptId);
    const user = await this.ensureUser(auth);

    const lookup = new Map(receipt.lineItems.map((lineItem) => [lineItem.id, lineItem]));

    const assignments = dto.lineItems.map((item) => {
      const lineItem = lookup.get(item.lineItemId);
      if (!lineItem) {
        throw new BadRequestException(`Line item ${item.lineItemId} does not belong to receipt ${receiptId}`);
      }

      return {
        lineItemId: item.lineItemId,
        jobId: item.jobId,
        lineItemTotalCents: lineItem.totalPriceCents,
      };
    });

    const total = receipt.totalAmountCents ?? 0;
    const validated = validateSplitAssignments(assignments, total, dto.unassignedRemainderCents ?? 0);

    await this.prisma.$transaction(async (transaction) => {
      for (const assignment of dto.lineItems) {
        await transaction.receiptLineItem.updateMany({
          where: {
            id: assignment.lineItemId,
            receiptId,
          },
          data: {
            jobId: assignment.jobId,
          },
        });
      }

      await transaction.expense.deleteMany({
        where: {
          receiptId,
        },
      });

      await transaction.expense.createMany({
        data: Object.entries(validated.totalsByJob).map(([jobId, amountCents]) => ({
          organizationId: receipt.organizationId,
          receiptId,
          jobId,
          amountCents,
          description: `Split receipt allocation (${receipt.merchantName ?? 'Unknown merchant'})`,
          category: 'MATERIALS',
          date: receipt.transactionDate ?? new Date(),
          createdById: user.id,
        })),
      });

      await transaction.receipt.updateMany({
        where: {
          id: receiptId,
        },
        data: {
          status: 'REVIEW',
        },
      });
    });

    return {
      receiptId,
      totalsByJob: validated.totalsByJob,
      assignedTotalCents: validated.assignedTotalCents,
      unassignedRemainderCents: dto.unassignedRemainderCents ?? 0,
    };
  }

  async bulkAction(dto: BulkActionDto) {
    const organizationId = this.organizationId();

    const where = {
      id: { in: dto.receiptIds },
      organizationId,
    };

    if (dto.action === BulkAction.DELETE) {
      const result = await this.prisma.receipt.deleteMany({ where });
      return { affected: result.count };
    }

    const status = dto.action === BulkAction.APPROVE ? 'APPROVED' : 'REJECTED';
    const result = await this.prisma.receipt.updateMany({
      where,
      data: { status },
    });

    return { affected: result.count };
  }
}
