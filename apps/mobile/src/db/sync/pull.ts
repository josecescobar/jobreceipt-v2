import { database, ReceiptModel, JobModel, ExpenseModel } from '../index';
import { Q } from '@nozbe/watermelondb';
import { apiClient } from '../../api/client';

interface SyncMeta {
  lastSyncTimestamp: number;
}

let syncMeta: SyncMeta = { lastSyncTimestamp: 0 };

export function getLastSyncTimestamp(): number {
  return syncMeta.lastSyncTimestamp;
}

export function setLastSyncTimestamp(ts: number) {
  syncMeta.lastSyncTimestamp = ts;
}

async function pullEntity<T extends { id: string }>(
  endpoint: string,
  tableName: string,
  mapToLocal: (item: T) => Record<string, any>,
) {
  try {
    const since = syncMeta.lastSyncTimestamp
      ? new Date(syncMeta.lastSyncTimestamp).toISOString()
      : undefined;

    const { data } = await apiClient.get(endpoint, {
      params: { updatedSince: since, limit: 100 },
    });

    const items: T[] = data.data || data;

    await database.write(async () => {
      for (const item of items) {
        const collection = database.get(tableName);
        const existing = await collection
          .query(Q.where('server_id', item.id))
          .fetch();

        const localData = mapToLocal(item);

        if (existing.length > 0) {
          const local = existing[0];
          // Only update if synced (don't overwrite local edits)
          if ((local as any).isSynced !== false) {
            await local.update((record: any) => {
              Object.assign(record, localData);
              record.isSynced = true;
            });
          }
        } else {
          await collection.create((record: any) => {
            Object.assign(record, localData);
            record.serverId = item.id;
            record.isSynced = true;
          });
        }
      }
    });

    return items.length;
  } catch (error) {
    console.warn(`Pull ${tableName} failed:`, error);
    return 0;
  }
}

export async function pullAllChanges(): Promise<number> {
  let total = 0;

  total += await pullEntity<any>('/receipts', 'receipts', (r) => ({
    organizationId: r.organizationId,
    status: r.status,
    merchantName: r.merchantName,
    totalAmount: r.totalAmount,
    taxAmount: r.taxAmount,
    subtotalAmount: r.subtotalAmount,
    transactionDate: r.transactionDate,
    imageUrl: r.imageUrl,
    thumbnailUrl: r.thumbnailUrl,
    ocrDataJson: r.ocrData ? JSON.stringify(r.ocrData) : null,
    suggestedJobId: r.suggestedJobId,
    confidenceScore: r.confidenceScore,
  }));

  total += await pullEntity<any>('/jobs', 'jobs', (j) => ({
    organizationId: j.organizationId,
    name: j.name,
    customerName: j.customerName,
    status: j.status,
    totalBudget: j.totalBudget,
    materialsBudget: j.materialsBudget,
    laborBudget: j.laborBudget,
    equipmentBudget: j.equipmentBudget,
    subcontractorBudget: j.subcontractorBudget,
    overheadBudget: j.overheadBudget,
    notes: j.notes,
  }));

  total += await pullEntity<any>('/expenses', 'expenses', (e) => ({
    organizationId: e.organizationId,
    jobId: e.jobId,
    receiptId: e.receiptId,
    amount: e.amount,
    description: e.description,
    category: e.category,
    taxCategory: e.taxCategory,
    mileage: e.mileage,
    dateStr: e.date,
  }));

  syncMeta.lastSyncTimestamp = Date.now();
  return total;
}
