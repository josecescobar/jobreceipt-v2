import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContextState {
  requestId: string;
  organizationId?: string;
  userId?: string;
}

@Injectable()
export class RequestContextService {
  private readonly storage = new AsyncLocalStorage<RequestContextState>();

  run<T>(state: RequestContextState, callback: () => T): T {
    return this.storage.run(state, callback);
  }

  getStore(): RequestContextState | undefined {
    return this.storage.getStore();
  }

  getRequestId(): string | undefined {
    return this.storage.getStore()?.requestId;
  }

  getOrganizationId(): string | undefined {
    return this.storage.getStore()?.organizationId;
  }

  getUserId(): string | undefined {
    return this.storage.getStore()?.userId;
  }
}
