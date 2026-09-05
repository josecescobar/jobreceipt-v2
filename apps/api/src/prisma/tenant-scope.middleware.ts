import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RequestContextService } from '../common/request-context/request-context.service';

const TENANT_MODELS = new Set([
  'OrganizationMember',
  'Job',
  'CostCode',
  'Receipt',
  'Expense',
  'BudgetSnapshot',
  'MileageTrip',
  'QuickBooksConnection',
  'SyncLog',
]);

const UNSAFE_ACTIONS = new Set([
  'findUnique',
  'findUniqueOrThrow',
  'update',
  'delete',
  'upsert',
]);

const READ_ACTIONS = new Set([
  'findMany',
  'findFirst',
  'findFirstOrThrow',
  'count',
  'aggregate',
  'groupBy',
  'updateMany',
  'deleteMany',
]);

export const tenantScopeExtension = (requestContext: RequestContextService) =>
  Prisma.defineExtension({
    query: {
      $allOperations({ model, operation, args, query }) {
        if (!model || !TENANT_MODELS.has(model)) {
          return query(args);
        }

        const organizationId = requestContext.getOrganizationId();
        if (!organizationId) {
          throw new BadRequestException('Missing organization scope (x-org-id header)');
        }

        if (UNSAFE_ACTIONS.has(operation)) {
          throw new BadRequestException(
            `Prisma action ${operation} is disallowed for ${model}. Use scoped operations (findFirst/findMany/updateMany/deleteMany).`,
          );
        }

        if (READ_ACTIONS.has(operation)) {
          const typedArgs = args as { where?: Record<string, unknown> };
          typedArgs.where = typedArgs.where
            ? { AND: [typedArgs.where, { organizationId }] }
            : { organizationId };
          return query(args);
        }

        if (operation === 'create') {
          const typedArgs = args as { data?: Record<string, unknown> };
          const data = (typedArgs.data ?? {}) as Record<string, unknown>;
          if ('organizationId' in data && data.organizationId !== organizationId) {
            throw new ForbiddenException('Payload organizationId does not match request organization scope');
          }
          typedArgs.data = { ...data, organizationId };
          return query(args);
        }

        if (operation === 'createMany') {
          const typedArgs = args as { data?: Record<string, unknown> | Record<string, unknown>[] };
          const input = typedArgs.data ?? [];
          const records = Array.isArray(input) ? input : [input];
          typedArgs.data = records.map((record) => {
            if ('organizationId' in record && record.organizationId !== organizationId) {
              throw new ForbiddenException('Payload organizationId does not match request organization scope');
            }
            return { ...record, organizationId };
          });
          return query(args);
        }

        return query(args);
      },
    },
  });
