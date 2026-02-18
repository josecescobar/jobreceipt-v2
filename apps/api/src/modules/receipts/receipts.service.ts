import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Service } from '../../common/services/s3.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Prisma, MaterialCategory } from '@prisma/client';
import { v4 as uuid } from 'uuid';
import { QUEUE_NAMES } from '../../queue/constants';

interface ReceiptQuery {
  status?: 'PROCESSING' | 'REVIEW' | 'APPROVED' | 'REJECTED';
  jobId?: string;
  merchantName?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  limit: number;
  includeThumbnails?: string;
}

@Injectable()
export class ReceiptsService {
  private readonly logger = new Logger(ReceiptsService.name);

  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
    @InjectQueue(QUEUE_NAMES.RECEIPT_OCR) private ocrQueue: Queue,
  ) {}

  async requestUploadUrl(orgId: string, fileName: string, contentType: string) {
    const receiptId = uuid();
    const ext = fileName.split('.').pop() || 'jpg';
    const key = this.s3Service.buildKey(orgId, receiptId, 'original', ext);

    const { url } = await this.s3Service.generateUploadUrl(key, contentType);

    return {
      receiptId,
      uploadUrl: url,
      imageKey: key,
    };
  }

  async confirmUpload(orgId: string, userId: string, receiptId: string, imageKey: string) {
    const receipt = await this.prisma.receipt.create({
      data: {
        id: receiptId,
        organizationId: orgId,
        uploadedById: userId,
        imageUrl: imageKey,
        status: 'PROCESSING',
      },
    });

    // Enqueue OCR processing job
    await this.ocrQueue.add(
      'process-receipt',
      { receiptId: receipt.id, imageKey, organizationId: orgId },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    );

    this.logger.log(`Receipt ${receipt.id} created and queued for OCR`);
    return receipt;
  }

  async findAll(orgId: string, query: ReceiptQuery) {
    const where: Prisma.ReceiptWhereInput = { organizationId: orgId };

    if (query.status) where.status = query.status;
    if (query.jobId) {
      where.lineItems = { some: { jobId: query.jobId } };
    }
    if (query.merchantName) {
      where.merchantName = { contains: query.merchantName, mode: 'insensitive' };
    }
    if (query.startDate || query.endDate) {
      where.transactionDate = {};
      if (query.startDate) where.transactionDate.gte = new Date(query.startDate);
      if (query.endDate) where.transactionDate.lte = new Date(query.endDate);
    }

    const [receipts, total] = await Promise.all([
      this.prisma.receipt.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { lineItems: true } },
        },
      }),
      this.prisma.receipt.count({ where }),
    ]);

    if (query.includeThumbnails === 'true') {
      const receiptsWithUrls = await Promise.all(
        receipts.map(async (receipt) => {
          if (!receipt.imageUrl) return receipt;
          try {
            const imageDownloadUrl = await this.s3Service.generateDownloadUrl(receipt.imageUrl);
            return { ...receipt, imageDownloadUrl };
          } catch {
            return receipt;
          }
        }),
      );
      return { data: receiptsWithUrls, total, page: query.page, limit: query.limit };
    }

    return { data: receipts, total, page: query.page, limit: query.limit };
  }

  async findOne(orgId: string, id: string) {
    const receipt = await this.prisma.receipt.findFirst({
      where: { id, organizationId: orgId },
      include: {
        lineItems: {
          include: {
            job: { select: { id: true, name: true } },
            costCode: { select: { id: true, code: true, name: true } },
          },
        },
        uploadedBy: { select: { id: true, name: true, email: true } },
        duplicateOf: {
          select: {
            id: true,
            merchantName: true,
            totalAmount: true,
            transactionDate: true,
            status: true,
          },
        },
        expenses: {
          select: {
            id: true,
            amount: true,
            description: true,
            category: true,
            date: true,
            jobId: true,
            job: { select: { id: true, name: true } },
          },
        },
      },
    });
    if (!receipt) throw new NotFoundException('Receipt not found');

    // Generate a fresh download URL for the image
    const imageUrl = await this.s3Service.generateDownloadUrl(receipt.imageUrl);

    return { ...receipt, imageUrl };
  }

  async update(orgId: string, id: string, data: {
    merchantName?: string;
    merchantAddress?: string;
    subtotal?: number;
    taxAmount?: number;
    totalAmount?: number;
    transactionDate?: string;
    status?: 'PROCESSING' | 'REVIEW' | 'APPROVED' | 'REJECTED';
    suggestedJobId?: string | null;
    duplicateOfId?: string | null;
  }) {
    await this.findOne(orgId, id);

    const updateData: Prisma.ReceiptUpdateInput = {};
    if (data.merchantName !== undefined) updateData.merchantName = data.merchantName;
    if (data.merchantAddress !== undefined) updateData.merchantAddress = data.merchantAddress;
    if (data.subtotal !== undefined) updateData.subtotal = data.subtotal;
    if (data.taxAmount !== undefined) updateData.taxAmount = data.taxAmount;
    if (data.totalAmount !== undefined) updateData.totalAmount = data.totalAmount;
    if (data.transactionDate !== undefined) updateData.transactionDate = new Date(data.transactionDate);
    if (data.status !== undefined) updateData.status = data.status;
    if (data.suggestedJobId !== undefined) updateData.suggestedJobId = data.suggestedJobId;
    if (data.duplicateOfId !== undefined) {
      updateData.duplicateOf = data.duplicateOfId
        ? { connect: { id: data.duplicateOfId } }
        : { disconnect: true };
    }

    return this.prisma.receipt.update({
      where: { id },
      data: updateData,
    });
  }

  async splitLineItems(orgId: string, receiptId: string, assignments: Array<{ lineItemId: string; jobId: string }>) {
    const receipt = await this.findOne(orgId, receiptId);

    return this.prisma.$transaction(async (tx: any) => {
      // Update each line item with its new job assignment
      for (const assignment of assignments) {
        await tx.receiptLineItem.update({
          where: { id: assignment.lineItemId },
          data: { jobId: assignment.jobId },
        });
      }

      // Create Expense records per job
      const jobExpenses = new Map<string, number>();
      for (const assignment of assignments) {
        const lineItem = receipt.lineItems.find((li: any) => li.id === assignment.lineItemId);
        if (lineItem) {
          const current = jobExpenses.get(assignment.jobId) || 0;
          jobExpenses.set(assignment.jobId, current + lineItem.totalPrice);
        }
      }

      const expenses = [];
      for (const [jobId, amount] of jobExpenses) {
        const expense = await tx.expense.create({
          data: {
            organizationId: orgId,
            receiptId,
            jobId,
            amount,
            description: `Receipt from ${receipt.merchantName || 'Unknown'}`,
            category: 'MATERIALS',
            date: receipt.transactionDate || new Date(),
            createdById: receipt.uploadedBy.id,
          },
        });
        expenses.push(expense);
      }

      return { receipt: { id: receiptId }, expenses };
    });
  }

  async createLineItem(orgId: string, receiptId: string, data: {
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    isConstructionMaterial?: boolean;
    materialCategory?: string | null;
  }) {
    await this.findOne(orgId, receiptId);

    return this.prisma.receiptLineItem.create({
      data: {
        receiptId,
        description: data.description,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        totalPrice: data.totalPrice,
        isConstructionMaterial: data.isConstructionMaterial ?? false,
        materialCategory: (data.materialCategory as MaterialCategory) ?? null,
      },
    });
  }

  async updateLineItem(orgId: string, receiptId: string, lineItemId: string, data: {
    description?: string;
    quantity?: number;
    unitPrice?: number;
    totalPrice?: number;
    isConstructionMaterial?: boolean;
    materialCategory?: string | null;
  }) {
    await this.findOne(orgId, receiptId);

    const lineItem = await this.prisma.receiptLineItem.findFirst({
      where: { id: lineItemId, receiptId },
    });
    if (!lineItem) throw new NotFoundException('Line item not found');

    const updateData: Prisma.ReceiptLineItemUpdateInput = {};
    if (data.description !== undefined) updateData.description = data.description;
    if (data.quantity !== undefined) updateData.quantity = data.quantity;
    if (data.unitPrice !== undefined) updateData.unitPrice = data.unitPrice;
    if (data.totalPrice !== undefined) updateData.totalPrice = data.totalPrice;
    if (data.isConstructionMaterial !== undefined) updateData.isConstructionMaterial = data.isConstructionMaterial;
    if (data.materialCategory !== undefined) updateData.materialCategory = data.materialCategory as MaterialCategory;

    return this.prisma.receiptLineItem.update({
      where: { id: lineItemId },
      data: updateData,
    });
  }

  async removeLineItem(orgId: string, receiptId: string, lineItemId: string) {
    await this.findOne(orgId, receiptId);

    const lineItem = await this.prisma.receiptLineItem.findFirst({
      where: { id: lineItemId, receiptId },
    });
    if (!lineItem) throw new NotFoundException('Line item not found');

    return this.prisma.receiptLineItem.delete({ where: { id: lineItemId } });
  }

  async findPotentialDuplicate(
    receiptId: string,
    orgId: string,
    data: { merchantName: string | null; totalAmount: number | null; transactionDate: Date | null },
  ): Promise<string | null> {
    if (!data.totalAmount || !data.transactionDate) return null;

    const dayMs = 24 * 60 * 60 * 1000;
    const dateLow = new Date(data.transactionDate.getTime() - dayMs);
    const dateHigh = new Date(data.transactionDate.getTime() + dayMs);

    const candidates = await this.prisma.receipt.findMany({
      where: {
        organizationId: orgId,
        id: { not: receiptId },
        status: { in: ['REVIEW', 'APPROVED'] },
        totalAmount: { gte: data.totalAmount - 100, lte: data.totalAmount + 100 },
        transactionDate: { gte: dateLow, lte: dateHigh },
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true, merchantName: true },
    });

    if (candidates.length === 0) return null;

    // If no merchant name to match, return first amount+date match
    if (!data.merchantName) return candidates[0].id;

    const needle = data.merchantName.toLowerCase();
    for (const c of candidates) {
      if (!c.merchantName) continue;
      const hay = c.merchantName.toLowerCase();
      if (hay.includes(needle) || needle.includes(hay)) {
        return c.id;
      }
    }

    // Return first match even without merchant match (amount + date is strong signal)
    return candidates[0].id;
  }

  async remove(orgId: string, id: string) {
    const receipt = await this.prisma.receipt.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!receipt) throw new NotFoundException('Receipt not found');

    // Delete from S3
    try {
      await this.s3Service.deleteObject(receipt.imageUrl);
      if (receipt.thumbnailUrl) {
        await this.s3Service.deleteObject(receipt.thumbnailUrl);
      }
    } catch (err) {
      this.logger.error(`Failed to delete S3 objects for receipt ${id}`, err);
    }

    return this.prisma.receipt.delete({ where: { id } });
  }
}
