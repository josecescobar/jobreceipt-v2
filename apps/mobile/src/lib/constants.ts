export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const CLERK_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '';

export const QUERY_STALE_TIME = 60 * 1000; // 60 seconds
export const QUERY_CACHE_TIME = 5 * 60 * 1000; // 5 minutes

export const IMAGE_MAX_DIMENSION = 2048;
export const IMAGE_COMPRESSION_QUALITY = 0.85;
export const IMAGE_RETRY_QUALITY = 0.6;

export const LOCATION_DISTANCE_INTERVAL = 10; // meters
export const LOCATION_TIME_INTERVAL = 5000; // ms

export const RECEIPTS_RECENT_LIMIT = 5;
export const DEFAULT_PAGE_SIZE = 20;
