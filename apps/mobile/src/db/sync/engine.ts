import { pushPendingActions } from './push';
import { pullAllChanges } from './pull';

type SyncStatus = 'idle' | 'syncing' | 'error';

let syncStatus: SyncStatus = 'idle';
let syncInterval: ReturnType<typeof setInterval> | null = null;
let statusListeners: Set<(status: SyncStatus) => void> = new Set();

const SYNC_INTERVAL_MS = 30_000; // 30 seconds

export function getSyncStatus(): SyncStatus {
  return syncStatus;
}

export function onSyncStatusChange(listener: (status: SyncStatus) => void) {
  statusListeners.add(listener);
  return () => statusListeners.delete(listener);
}

function notifyListeners() {
  statusListeners.forEach((fn) => fn(syncStatus));
}

export async function syncNow(): Promise<void> {
  if (syncStatus === 'syncing') return;

  syncStatus = 'syncing';
  notifyListeners();

  try {
    // Push first, then pull
    await pushPendingActions();
    await pullAllChanges();
    syncStatus = 'idle';
  } catch (error) {
    console.warn('Sync failed:', error);
    syncStatus = 'error';
  }

  notifyListeners();
}

export function startSyncLoop(): void {
  if (syncInterval) return;

  // Initial sync
  syncNow();

  syncInterval = setInterval(() => {
    syncNow();
  }, SYNC_INTERVAL_MS);
}

export function stopSyncLoop(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}
