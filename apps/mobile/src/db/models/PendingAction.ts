import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, text } from '@nozbe/watermelondb/decorators';

export class PendingActionModel extends Model {
  static table = 'pending_actions';

  @text('action_type') actionType!: string;
  @text('entity_type') entityType!: string;
  @text('entity_id') entityId!: string;
  @text('payload') payloadJson!: string;
  @text('status') status!: string;
  @field('retry_count') retryCount!: number;
  @text('error') error!: string | null;
  @readonly @date('created_at') createdAt!: Date;

  get payload() {
    try {
      return JSON.parse(this.payloadJson);
    } catch {
      return {};
    }
  }
}
