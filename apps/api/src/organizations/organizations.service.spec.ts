import { NotFoundException } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';

const mockOrg = {
  id: 'org_1',
  name: 'Test Org',
  slug: 'test-org',
  plan: 'FREE',
  createdAt: new Date(),
  _count: { members: 3 },
};

function createService(overrides: Record<string, Record<string, unknown>> = {}) {
  const prisma = {
    user: {
      upsert: jest.fn().mockResolvedValue({ id: 'user_1' }),
      ...overrides.user,
    },
    organization: {
      findFirst: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue(mockOrg),
      ...overrides.organization,
    },
  };

  const requestContext = {
    getOrganizationId: jest.fn().mockReturnValue('org_1'),
  };

  const service = new OrganizationsService(prisma as never, requestContext as never);
  return { service, prisma, requestContext };
}

describe('OrganizationsService', () => {
  describe('getCurrent', () => {
    it('returns organization with member count', async () => {
      const { service } = createService({
        organization: {
          findFirst: jest.fn().mockResolvedValue(mockOrg),
        },
      });

      const result = await service.getCurrent();
      expect(result.name).toBe('Test Org');
      expect(result.memberCount).toBe(3);
      expect(result.plan).toBe('FREE');
    });

    it('throws NotFoundException when org not found', async () => {
      const { service } = createService();
      await expect(service.getCurrent()).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when no org context', async () => {
      const { service, requestContext } = createService();
      (requestContext.getOrganizationId as jest.Mock).mockReturnValue(null);
      await expect(service.getCurrent()).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateOrganization', () => {
    it('updates org name and returns updated org', async () => {
      const updatedOrg = { ...mockOrg, name: 'New Name' };
      const { service } = createService({
        organization: {
          findFirst: jest.fn().mockResolvedValue(updatedOrg),
          update: jest.fn().mockResolvedValue(updatedOrg),
        },
      });

      const result = await service.updateOrganization(
        'org_1',
        { clerkId: 'clerk_1' },
        { name: 'New Name' },
      );
      expect(result.name).toBe('New Name');
    });

    it('throws NotFoundException when org not found or not owner', async () => {
      const { service } = createService();
      await expect(
        service.updateOrganization('org_1', { clerkId: 'clerk_1' }, { name: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
