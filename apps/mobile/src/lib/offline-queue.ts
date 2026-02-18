import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { apiClient } from '../api/client';

export interface OfflineMeta {
  type: 'expense' | 'mileage' | 'receipt';
  description: string;
}

export interface QueuedAction {
  id: string;
  method: 'POST' | 'PATCH' | 'DELETE';
  url: string;
  data?: unknown;
  meta?: OfflineMeta;
  retryCount: number;
  createdAt: number;
}

const QUEUE_KEY = '@jobreceipt/offline_queue';
const MAX_RETRIES = 5;

class OfflineQueue {
  private processing = false;
  private unsubscribe: (() => void) | null = null;

  onSync?: (syncedCount: number, remainingCount: number, syncedTypes: string[]) => void;

  async enqueue(action: Omit<QueuedAction, 'id' | 'retryCount' | 'createdAt'>) {
    const queue = await this.getQueue();
    queue.push({
      ...action,
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      retryCount: 0,
      createdAt: Date.now(),
    });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }

  async processQueue() {
    if (this.processing) return;
    this.processing = true;

    try {
      const netState = await NetInfo.fetch();
      if (!netState.isConnected) return;

      const queue = await this.getQueue();
      if (queue.length === 0) return;

      const remaining: QueuedAction[] = [];
      const syncedTypes: Set<string> = new Set();

      for (const action of queue) {
        try {
          await apiClient.request({
            method: action.method,
            url: action.url,
            data: action.data,
          });
          if (action.meta?.type) syncedTypes.add(action.meta.type);
        } catch (error: any) {
          // Client errors (4xx) won't be fixed by retrying — drop them
          if (error.response?.status >= 400 && error.response?.status < 500) {
            continue;
          }
          action.retryCount++;
          if (action.retryCount < MAX_RETRIES) {
            remaining.push(action);
          }
        }
      }

      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));

      const syncedCount = queue.length - remaining.length;
      if (syncedCount > 0) {
        this.onSync?.(syncedCount, remaining.length, [...syncedTypes]);
      }
    } finally {
      this.processing = false;
    }
  }

  startListening() {
    // Process any queued actions from previous session
    this.processQueue();

    this.unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        this.processQueue();
      }
    });
  }

  stopListening() {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  async getQueueLength(): Promise<number> {
    return (await this.getQueue()).length;
  }

  async getQueue(): Promise<QueuedAction[]> {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  }
}

export const offlineQueue = new OfflineQueue();
