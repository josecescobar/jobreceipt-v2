import { useEffect, useRef, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { offlineQueue, replayPendingUploads } from '../lib/offline-queue';
import { getQueryClient } from '../lib/query-client';
import { useUIStore } from '../stores/ui.store';

export function useNetworkStatus(receiptUploadFn?: (uri: string) => Promise<string | undefined>) {
  const [isConnected, setIsConnected] = useState(true);
  const [pendingActions, setPendingActions] = useState(0);
  const wasConnected = useRef(true);
  const addToast = useUIStore((s) => s.addToast);

  useEffect(() => {
    // Set up sync callback for toast notifications
    offlineQueue.onSync = (syncedCount, remainingCount, syncedTypes) => {
      setPendingActions(remainingCount);
      if (syncedCount > 0) {
        addToast({
          id: `sync_${Date.now()}`,
          message: `Synced ${syncedCount} offline action${syncedCount !== 1 ? 's' : ''}`,
          type: 'success',
        });
        // Invalidate relevant query caches based on what was synced
        const qc = getQueryClient();
        if (qc && syncedTypes.length > 0) {
          for (const type of syncedTypes) {
            if (type === 'expense') {
              qc.invalidateQueries({ queryKey: ['expenses'] });
              qc.invalidateQueries({ queryKey: ['analytics'] });
            } else if (type === 'mileage') {
              qc.invalidateQueries({ queryKey: ['mileage'] });
            } else if (type === 'receipt') {
              qc.invalidateQueries({ queryKey: ['receipts'] });
            }
          }
        }
      }
    };

    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? true;
      setIsConnected(connected);

      if (!connected) {
        // Poll queue length when going offline
        offlineQueue.getQueueLength().then(setPendingActions);
      }

      if (connected && !wasConnected.current) {
        // Just came back online
        addToast({
          id: `online_${Date.now()}`,
          message: 'Back online',
          type: 'info',
          duration: 2000,
        });
        // Replay any pending receipt uploads
        if (receiptUploadFn) {
          replayPendingUploads(receiptUploadFn).catch(() => {
            // Replay errors are non-fatal — will retry on next reconnect
          });
        }
      }

      wasConnected.current = connected;
    });

    return () => {
      unsubscribe();
      offlineQueue.onSync = undefined;
    };
  }, [addToast]);

  // Periodically update pending count while offline
  useEffect(() => {
    if (isConnected) return;

    const interval = setInterval(() => {
      offlineQueue.getQueueLength().then(setPendingActions);
    }, 3000);

    return () => clearInterval(interval);
  }, [isConnected]);

  return { isConnected, pendingActions };
}
