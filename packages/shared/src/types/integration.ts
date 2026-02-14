export enum SyncDirection {
  PUSH = 'PUSH',
  PULL = 'PULL',
}

export enum SyncStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export interface QuickBooksConnection {
  id: string;
  organizationId: string;
  realmId: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: Date;
  lastSyncAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncLog {
  id: string;
  organizationId: string;
  entityType: string;
  entityId: string;
  qbId: string | null;
  syncDirection: SyncDirection;
  status: SyncStatus;
  errorMessage: string | null;
  syncedAt: Date;
  createdAt: Date;
}
