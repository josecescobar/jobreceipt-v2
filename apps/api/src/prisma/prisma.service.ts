import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { RequestContextService } from '../common/request-context/request-context.service';
import { tenantScopeExtension } from './tenant-scope.middleware';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly _scoped: ReturnType<typeof this.$extends>;

  constructor(private readonly requestContext: RequestContextService) {
    super();
    this._scoped = this.$extends(tenantScopeExtension(this.requestContext));
  }

  /** Returns the tenant-scoped client that auto-injects organizationId */
  get scoped() {
    return this._scoped;
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
