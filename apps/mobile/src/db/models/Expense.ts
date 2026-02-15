import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, text } from '@nozbe/watermelondb/decorators';

export class ExpenseModel extends Model {
  static table = 'expenses';

  @text('server_id') serverId!: string;
  @text('organization_id') organizationId!: string;
  @text('job_id') jobId!: string | null;
  @text('receipt_id') receiptId!: string | null;
  @field('amount') amount!: number;
  @text('description') description!: string | null;
  @text('category') category!: string | null;
  @text('tax_category') taxCategory!: string | null;
  @field('mileage') mileage!: number | null;
  @text('date') dateStr!: string | null;
  @field('is_synced') isSynced!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
