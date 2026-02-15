import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, text } from '@nozbe/watermelondb/decorators';

export class JobModel extends Model {
  static table = 'jobs';

  @text('server_id') serverId!: string;
  @text('organization_id') organizationId!: string;
  @text('name') name!: string;
  @text('customer_name') customerName!: string | null;
  @text('status') status!: string;
  @field('total_budget') totalBudget!: number | null;
  @field('materials_budget') materialsBudget!: number | null;
  @field('labor_budget') laborBudget!: number | null;
  @field('equipment_budget') equipmentBudget!: number | null;
  @field('subcontractor_budget') subcontractorBudget!: number | null;
  @field('overhead_budget') overheadBudget!: number | null;
  @text('notes') notes!: string | null;
  @field('is_synced') isSynced!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
