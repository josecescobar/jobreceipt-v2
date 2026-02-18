import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import Anthropic from '@anthropic-ai/sdk';
import sharp from 'sharp';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../common/services/s3.service';
import { NotificationService } from '../common/services/notification.service';
import { JobSuggestionService } from '../modules/receipts/job-suggestion.service';
import { ReceiptsService } from '../modules/receipts/receipts.service';
import { OcrResultSchema } from '@jobreceipt/shared';
import { QUEUE_NAMES } from './constants';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';

interface OcrJobData {
  receiptId: string;
  imageKey: string;
  organizationId: string;
}

const SYSTEM_PROMPT = `You are an expert receipt parser for a construction expense tracking app.
Extract structured data from this receipt image.

Return ONLY valid JSON with this exact structure:
{
  "merchant": {
    "name": "string",
    "address": "string or null",
    "phone": "string or null",
    "store_number": "string or null"
  },
  "transaction": {
    "date": "YYYY-MM-DD",
    "time": "HH:MM or null",
    "receipt_number": "string or null",
    "payment_method": "cash | credit | debit | check | account",
    "card_last_four": "string or null",
    "account_number": "string or null"
  },
  "line_items": [
    {
      "description": "string (exact text from receipt)",
      "sku": "string or null",
      "quantity": number,
      "unit_price": number,
      "total_price": number,
      "is_construction_material": boolean,
      "material_category": "lumber | electrical | plumbing | roofing | hardware | paint | fasteners | concrete | insulation | drywall | flooring | tools | safety | other"
    }
  ],
  "totals": {
    "subtotal": number,
    "tax_amount": number,
    "tax_rate_percent": number or null,
    "tip_amount": number or null,
    "discount_amount": number or null,
    "total_amount": number
  },
  "confidence": {
    "overall": "high | medium | low",
    "notes": "string describing any issues (faded text, partial image, etc.)"
  }
}

IMPORTANT RULES:
- All monetary values as numbers (not strings): 29.99 not "$29.99"
- If text is faded/unclear, make best guess and set confidence to "medium" or "low"
- For construction materials, be specific about material_category
- SKU/item codes help identify products — include if visible
- If receipt appears to be from a known construction supplier (Home Depot, Lowe's, Menards, 84 Lumber, Ferguson, Grainger, Fastenal), note this in confidence.notes`;

@Processor(QUEUE_NAMES.RECEIPT_OCR)
export class ReceiptOcrProcessor extends WorkerHost {
  private readonly logger = new Logger(ReceiptOcrProcessor.name);
  private anthropic: Anthropic;
  private s3Client: S3Client;

  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
    private notificationService: NotificationService,
    private jobSuggestionService: JobSuggestionService,
    private receiptsService: ReceiptsService,
    private configService: ConfigService,
  ) {
    super();
    this.anthropic = new Anthropic({
      apiKey: this.configService.get<string>('anthropic.apiKey'),
    });
    this.s3Client = new S3Client({
      region: this.configService.get<string>('aws.s3Region') || 'us-east-1',
      credentials: {
        accessKeyId: this.configService.get<string>('aws.accessKeyId') || '',
        secretAccessKey: this.configService.get<string>('aws.secretAccessKey') || '',
      },
    });
  }

  async process(job: Job<OcrJobData>): Promise<void> {
    const { receiptId, imageKey, organizationId } = job.data;
    this.logger.log(`Processing OCR for receipt ${receiptId}`);

    try {
      // Step 1: Fetch image from S3
      const imageBuffer = await this.fetchImageFromS3(imageKey);

      // Step 2: Pre-process with Sharp
      const processedBuffer = await this.preprocessImage(imageBuffer);

      // Step 3: Send to Claude Vision API
      const ocrResult = await this.extractWithClaude(processedBuffer);

      // Step 4: Validate the OCR result
      const parsed = OcrResultSchema.safeParse(ocrResult);
      if (!parsed.success) {
        this.logger.warn(`OCR result validation failed for receipt ${receiptId}`, parsed.error.issues);
        // Still proceed with what we have, but mark confidence as low
        ocrResult.confidence = { overall: 'low', notes: 'Validation errors in OCR output' };
      }

      // Step 5: Store OCR results
      await this.storeOcrResults(receiptId, ocrResult);

      // Step 5b: Check for duplicate receipts
      const toCents = (amount: number | null | undefined): number | null => {
        if (amount == null) return null;
        return Math.round(amount * 100);
      };
      let txnDate: Date | null = null;
      if (ocrResult.transaction?.date) {
        txnDate = new Date(ocrResult.transaction.date);
        if (isNaN(txnDate.getTime())) txnDate = null;
      }
      const duplicateId = await this.receiptsService.findPotentialDuplicate(
        receiptId,
        organizationId,
        {
          merchantName: ocrResult.merchant?.name || null,
          totalAmount: toCents(ocrResult.totals?.total_amount),
          transactionDate: txnDate,
        },
      );
      if (duplicateId) {
        await this.prisma.receipt.update({
          where: { id: receiptId },
          data: { duplicateOfId: duplicateId },
        });
        this.logger.log(`Receipt ${receiptId} flagged as potential duplicate of ${duplicateId}`);
      }

      // Step 6: Run job suggestion
      const suggestion = await this.jobSuggestionService.suggestJob(
        organizationId,
        receiptId,
        ocrResult,
      );

      // Step 7: Update receipt with suggestion and status
      await this.prisma.receipt.update({
        where: { id: receiptId },
        data: {
          status: 'REVIEW',
          processedAt: new Date(),
          suggestedJobId: suggestion?.jobId || null,
          suggestedCategory: suggestion?.suggestedCategory || null,
          autoAssigned: suggestion?.autoAssigned || false,
        },
      });

      // Step 8: Send push notification
      const receipt = await this.prisma.receipt.findUnique({
        where: { id: receiptId },
        select: { uploadedById: true },
      });
      if (receipt) {
        const merchantName = ocrResult.merchant?.name || 'Unknown merchant';
        await this.notificationService.sendPushNotification(
          receipt.uploadedById,
          'Receipt Ready for Review',
          `Your receipt from ${merchantName} has been processed.`,
          { receiptId },
        );
      }

      this.logger.log(`OCR completed for receipt ${receiptId}, confidence: ${ocrResult.confidence.overall}`);
    } catch (error) {
      this.logger.error(`OCR failed for receipt ${receiptId}`, error);

      // Mark as REVIEW with low confidence on final failure
      if (job.attemptsMade >= (job.opts.attempts || 3) - 1) {
        await this.prisma.receipt.update({
          where: { id: receiptId },
          data: {
            status: 'REVIEW',
            confidenceScore: 'low',
            processedAt: new Date(),
          },
        });
      }

      throw error; // Let BullMQ handle retry
    }
  }

  private async fetchImageFromS3(key: string): Promise<Buffer> {
    const bucket = this.configService.get<string>('aws.s3Bucket');
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const response = await this.s3Client.send(command);
    const chunks: Uint8Array[] = [];
    const stream = response.Body as AsyncIterable<Uint8Array>;
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  private async preprocessImage(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer)
      .rotate() // Auto-rotate based on EXIF
      .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
      .normalize() // Enhance contrast for faded thermal paper
      .jpeg({ quality: 85 })
      .toBuffer();
  }

  private async extractWithClaude(imageBuffer: Buffer): Promise<any> {
    const base64Image = imageBuffer.toString('base64');

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: 'Extract all data from this receipt. Return only the JSON.',
            },
          ],
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    // Parse JSON from response (handle potential markdown code blocks)
    let jsonStr = textContent.text.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    return JSON.parse(jsonStr);
  }

  private async storeOcrResults(receiptId: string, ocrResult: any): Promise<void> {
    // Convert dollar amounts to cents
    const toCents = (amount: number | null | undefined): number | null => {
      if (amount == null) return null;
      return Math.round(amount * 100);
    };

    // Parse transaction date
    let transactionDate: Date | null = null;
    if (ocrResult.transaction?.date) {
      transactionDate = new Date(ocrResult.transaction.date);
      if (isNaN(transactionDate.getTime())) transactionDate = null;
    }

    // Update receipt with extracted data
    await this.prisma.receipt.update({
      where: { id: receiptId },
      data: {
        ocrRawJson: ocrResult,
        merchantName: ocrResult.merchant?.name || null,
        merchantAddress: ocrResult.merchant?.address || null,
        subtotal: toCents(ocrResult.totals?.subtotal),
        taxAmount: toCents(ocrResult.totals?.tax_amount),
        totalAmount: toCents(ocrResult.totals?.total_amount),
        transactionDate,
        confidenceScore: ocrResult.confidence?.overall || 'low',
      },
    });

    // Create line items
    if (ocrResult.line_items?.length) {
      const lineItemsData = ocrResult.line_items.map((item: any) => ({
        receiptId,
        description: item.description || 'Unknown item',
        sku: item.sku || null,
        quantity: item.quantity || 1,
        unitPrice: toCents(item.unit_price) || 0,
        totalPrice: toCents(item.total_price) || 0,
        isConstructionMaterial: item.is_construction_material || false,
        materialCategory: item.is_construction_material
          ? (item.material_category?.toUpperCase() || 'OTHER')
          : null,
      }));

      await this.prisma.receiptLineItem.createMany({
        data: lineItemsData,
      });
    }
  }
}
