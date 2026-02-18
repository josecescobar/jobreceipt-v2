import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

const CACHE_KEY = '@jobreceipt/react-query-cache';

/** Increment when API response shapes change to invalidate stale cache */
export const QUERY_CACHE_BUSTER = '1';

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: CACHE_KEY,
  throttleTime: 1000,
});
