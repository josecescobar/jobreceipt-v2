import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { toMoneyCents } from '@jobreceipt/shared';
import { PrismaService } from '../prisma/prisma.service';
import { toPrismaJson } from '../prisma/json-value';
import { QueueMetrics } from '../queue/queue.metrics';
import { JobSuggestionService } from './job-suggestion.service';
import { ReceiptOcrService } from './receipt-ocr.service';
import { ReceiptStorageService } from './receipt-storage.service';

@Injectable()
export class ReceiptOcrPipelineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: ReceiptStorageService,
    private readonly ocr: ReceiptOcrService,
    private readonly suggestions: JobSuggestionService,
    private readonly metrics: QueueMetrics,
  ) {}

  private confidenceToScore(level: 'high' | 'medium' | 'low'): number {
    if (level === 'high') return 95;
    if (level === 'medium') return 70;
    return 45;
  }

  async process(receiptId: string): Promise<{ receiptId: string; autoAssigned: boolean; score: number }> {
    const receipt = await this.prisma.receipt.findFirst({
      where: {
        id: receiptId,
      },
      include: {
        organization: true,
      },
    });

    if (!receipt) {
      throw new NotFoundException('Receipt not found');
    }

    const image = await this.storage.loadReceiptImage(receipt.imageUrl);
    const base64 = image.toString('base64');
    const payload = await this.ocr.extract(base64);
    const scoredJobs = await this.suggestions.suggest(receipt.organizationId, payload);
    const best = scoredJobs[0] ?? null;

    const subtotalCents = toMoneyCents(payload.totals.subtotal);
    const taxAmountCents = toMoneyCents(payload.totals.tax_amount);
    const totalAmountCents = toMoneyCents(payload.totals.total_amount);

    await this.prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
      await transaction.receipt.updateMany({
        where: {
          id: receipt.id,
        },
        data: {
          status: 'REVIEW',
          ocrRawJson: toPrismaJson(payload),
          merchantName: payload.merchant.name,
          merchantAddress: payload.merchant.address,
          subtotalCents,
          taxAmountCents,
          totalAmountCents,
          transactionDate: payload.transaction.date ? new Date(payload.transaction.date) : null,
          currency: 'USD',
          confidenceScore: this.confidenceToScore(payload.confidence.overall),
          processedAt: new Date(),
          suggestedJobId: best?.jobId,
          suggestedScore: best?.score,
          suggestedReasons: toPrismaJson(best?.reasons ?? []),
        },
      });

      await transaction.receiptLineItem.deleteMany({
        where: {
          receiptId: receipt.id,
        },
      });

      if (payload.line_items.length > 0) {
        await transaction.receiptLineItem.createMany({
          data: payload.line_items.map((lineItem) => ({
            receiptId: receipt.id,
            description: lineItem.description,
            sku: lineItem.sku,
            quantity: lineItem.quantity,
            unitPriceCents: toMoneyCents(lineItem.unit_price),
            totalPriceCents: toMoneyCents(lineItem.total_price),
            isConstructionMaterial: lineItem.is_construction_material,
            materialCategory: lineItem.material_category,
            jobId: best && best.score > 90 ? best.jobId : null,
          })),
        });
      }
    });

    if (best?.score && best.score > 90) {
      this.metrics.autoAssignCount.inc();
    }

    return {
      receiptId,
      autoAssigned: (best?.score ?? 0) > 90,
      score: best?.score ?? 0,
    };
  }
}
