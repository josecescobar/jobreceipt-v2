import { BadRequestException, ForbiddenException } from '@nestjs/common';
import type { RequestContextService } from '../common/request-context/request-context.service';

/**
 * We test the tenant scope logic directly by extracting the $allOperations handler
 * from the extension config passed to Prisma.defineExtension.
 *
 * Prisma.defineExtension returns an opaque function, so we mock it to capture
 * the config object.
 */

// Mock Prisma to capture the extension config
let capturedConfig: any;
jest.mock('@prisma/client', () => ({
  Prisma: {
    defineExtension: (config: any) => {
      capturedConfig = config;
      return config;
    },
  },
}));

// Import after mock setup
import { tenantScopeExtension } from './tenant-scope.middleware';

const createMockContext = (organizationId?: string) =>
  ({
    getOrganizationId: jest.fn().mockReturnValue(organizationId),
  }) as unknown as RequestContextService;

const getHandler = (requestContext: RequestContextService) => {
  tenantScopeExtension(requestContext);
  return capturedConfig.query.$allOperations;
};

describe('tenant scope extension', () => {
  it('injects organization scope into findMany queries', () => {
    const handler = getHandler(createMockContext('org_123'));

    const args = { where: { status: 'ACTIVE' } };
    let capturedArgs: any;
    const mockQuery = (a: any) => {
      capturedArgs = a;
      return Promise.resolve([]);
    };

    handler({ model: 'Job', operation: 'findMany', args, query: mockQuery });

    expect(capturedArgs.where).toEqual({
      AND: [{ status: 'ACTIVE' }, { organizationId: 'org_123' }],
    });
  });

  it('sets organizationId as where when no existing where clause', () => {
    const handler = getHandler(createMockContext('org_456'));

    const args = {};
    let capturedArgs: any;
    const mockQuery = (a: any) => {
      capturedArgs = a;
      return Promise.resolve([]);
    };

    handler({ model: 'Receipt', operation: 'findMany', args, query: mockQuery });

    expect(capturedArgs.where).toEqual({ organizationId: 'org_456' });
  });

  it('throws when organization scope is missing', () => {
    const handler = getHandler(createMockContext(undefined));

    expect(() =>
      handler({
        model: 'Job',
        operation: 'findMany',
        args: {},
        query: jest.fn(),
      }),
    ).toThrow(BadRequestException);
  });

  it('passes through non-tenant models without modification', () => {
    const handler = getHandler(createMockContext(undefined));

    const args = { where: { id: '123' } };
    let capturedArgs: any;
    const mockQuery = (a: any) => {
      capturedArgs = a;
      return Promise.resolve({});
    };

    handler({ model: 'User', operation: 'findMany', args, query: mockQuery });

    expect(capturedArgs.where).toEqual({ id: '123' });
  });

  it('passes through when model is undefined', () => {
    const handler = getHandler(createMockContext(undefined));

    const args = { where: {} };
    let capturedArgs: any;
    const mockQuery = (a: any) => {
      capturedArgs = a;
      return Promise.resolve({});
    };

    handler({ model: undefined, operation: 'findMany', args, query: mockQuery });

    expect(capturedArgs).toBe(args);
  });

  it('blocks unsafe actions on tenant models', () => {
    const handler = getHandler(createMockContext('org_123'));

    for (const action of ['findUnique', 'findUniqueOrThrow', 'update', 'delete', 'upsert']) {
      expect(() =>
        handler({
          model: 'Job',
          operation: action,
          args: { where: { id: '1' } },
          query: jest.fn(),
        }),
      ).toThrow(BadRequestException);
    }
  });

  it('injects organizationId into create data', () => {
    const handler = getHandler(createMockContext('org_123'));

    const args = { data: { name: 'Test Job' } };
    let capturedArgs: any;
    const mockQuery = (a: any) => {
      capturedArgs = a;
      return Promise.resolve({});
    };

    handler({ model: 'Job', operation: 'create', args, query: mockQuery });

    expect(capturedArgs.data).toEqual({ name: 'Test Job', organizationId: 'org_123' });
  });

  it('throws on create if organizationId mismatches', () => {
    const handler = getHandler(createMockContext('org_123'));

    expect(() =>
      handler({
        model: 'Job',
        operation: 'create',
        args: { data: { name: 'Test', organizationId: 'org_other' } },
        query: jest.fn(),
      }),
    ).toThrow(ForbiddenException);
  });

  it('injects organizationId into createMany records', () => {
    const handler = getHandler(createMockContext('org_123'));

    const args = { data: [{ name: 'Job A' }, { name: 'Job B' }] };
    let capturedArgs: any;
    const mockQuery = (a: any) => {
      capturedArgs = a;
      return Promise.resolve({ count: 2 });
    };

    handler({ model: 'Job', operation: 'createMany', args, query: mockQuery });

    expect(capturedArgs.data).toEqual([
      { name: 'Job A', organizationId: 'org_123' },
      { name: 'Job B', organizationId: 'org_123' },
    ]);
  });
});
