import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { receiptOcrSchema, type ReceiptOcrPayload } from '@jobreceipt/shared';

type ReceiptMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

const RECEIPT_EXTRACTION_PROMPT = `You are an expert receipt parser for a construction expense tracking app.
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
    "card_last_four": "string or null"
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
    "discount_amount": number or null,
    "total_amount": number
  },
  "confidence": {
    "overall": "high | medium | low",
    "notes": "string describing any issues"
  }
}

RULES:
- All monetary values as numbers: 29.99 not "$29.99"
- If text is faded/unclear, best guess + confidence "medium" or "low"
- Be specific about material_category for construction items
- Include SKU/item codes if visible`;

@Injectable()
export class ReceiptOcrService {
  private readonly logger = new Logger(ReceiptOcrService.name);
  private readonly anthropic: Anthropic;

  constructor(private readonly configService: ConfigService) {
    this.anthropic = new Anthropic({
      apiKey: this.configService.getOrThrow<string>('ANTHROPIC_API_KEY'),
    });
  }

  private parseJson(text: string): unknown {
    const cleaned = text
      .replace(/^```json/gi, '')
      .replace(/^```/gim, '')
      .replace(/```$/gim, '')
      .trim();

    try {
      return JSON.parse(cleaned);
    } catch (error) {
      this.logger.warn(
        `JSON parse failed – first 200 chars: ${cleaned.slice(0, 200)}`,
      );
      throw error;
    }
  }

  private fallbackPayload(): ReceiptOcrPayload {
    return {
      merchant: {
        name: 'Unknown Merchant',
        address: null,
        phone: null,
        store_number: null,
      },
      transaction: {
        date: new Date().toISOString().slice(0, 10),
        time: null,
        receipt_number: null,
        payment_method: 'credit',
        card_last_four: null,
      },
      line_items: [],
      totals: {
        subtotal: 0,
        tax_amount: 0,
        tax_rate_percent: null,
        discount_amount: null,
        total_amount: 0,
      },
      confidence: {
        overall: 'low',
        notes: 'Fallback payload used because OCR extraction failed',
      },
    };
  }

  async extract(base64Image: string, mediaType: ReceiptMediaType = 'image/jpeg'): Promise<ReceiptOcrPayload> {
    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-latest',
        max_tokens: 2000,
        temperature: 0,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: RECEIPT_EXTRACTION_PROMPT,
              },
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: base64Image,
                },
              },
            ],
          },
        ],
      });

      const rawText = response.content
        .filter((part) => part.type === 'text')
        .map((part) => (part.type === 'text' ? part.text : ''))
        .join('\n');

      const parsed = this.parseJson(rawText);
      const validated = receiptOcrSchema.parse(parsed);

      return validated as ReceiptOcrPayload;
    } catch (error) {
      this.logger.error('OCR extraction failed, returning fallback payload', error as Error);
      return this.fallbackPayload();
    }
  }
}
