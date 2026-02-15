import { database, PendingActionModel } from '../index';
import { Q } from '@nozbe/watermelondb';
import { apiClient } from '../../api/client';

const MAX_RETRIES = 5;

const ENTITY_ENDPOINTS: Record<string, string> = {
  receipt: '/receipts',
  job: '/jobs',
  expense: '/expenses',
};

export async function pushPendingActions(): Promise<number> {
  const pendingActions = await database
    .get<PendingActionModel>('pending_actions')
    .query(
      Q.where('status', 'pending'),
      Q.sortBy('created_at', Q.asc),
    )
    .fetch();

  let processed = 0;

  for (const action of pendingActions) {
    const endpoint = ENTITY_ENDPOINTS[action.entityType];
    if (!endpoint) continue;

    try {
      await database.write(async () => {
        await action.update((a) => {
          a.status = 'processing';
        });
      });

      const payload = action.payload;

      switch (action.actionType) {
        case 'create':
          await apiClient.post(endpoint, payload);
          break;
        case 'update':
          await apiClient.patch(`${endpoint}/${action.entityId}`, payload);
          break;
        case 'delete':
          await apiClient.delete(`${endpoint}/${action.entityId}`);
          break;
      }

      // Mark as done
      await database.write(async () => {
        await action.update((a) => {
          a.status = 'done';
        });
      });

      processed++;
    } catch (error: any) {
      const newRetryCount = action.retryCount + 1;
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';

      await database.write(async () => {
        await action.update((a) => {
          a.retryCount = newRetryCount;
          a.error = errorMsg;
          a.status = newRetryCount >= MAX_RETRIES ? 'failed' : 'pending';
        });
      });
    }
  }

  return processed;
}
