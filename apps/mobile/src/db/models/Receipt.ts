import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, text, json } from '@nozbe/watermelondb/decorators';

export class ReceiptModel extends Model {
  static table = 'receipts';

  @text('server_id') serverId!: string;
  @text('organization_id') organizationId!: string;
  @text('status') status!: string;
  @text('merchant_name') merchantName!: string | null;
  @field('total_amount') totalAmount!: number | null;
  @field('tax_amount') taxAmount!: number | null;
  @field('subtotal_amount') subtotalAmount!: number | null;
  @text('transaction_date') transactionDate!: string | null;
  @text('image_url') imageUrl!: string | null;
  @text('thumbnail_url') thumbnailUrl!: string | null;
  @text('local_image_uri') localImageUri!: string | null;
  @text('ocr_data') ocrDataJson!: string | null;
  @text('suggested_job_id') suggestedJobId!: string | null;
  @field('confidence_score') confidenceScore!: number | null;
  @field('is_synced') isSynced!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  get ocrData() {
    try {
      return this.ocrDataJson ? JSON.parse(this.ocrDataJson) : null;
    } catch {
      return null;
    }
  }
}
