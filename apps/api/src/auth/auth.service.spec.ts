import { NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';

function createService(overrides: Record<string, unknown> = {}) {
  const upsert = jest.fn().mockResolvedValue({ id: 'user_1' });
  const findFirst = jest.fn().mockResolvedValue(null);
  const updateMany = jest.fn().mockResolvedValue({ count: 0 });

  const prisma = {
    user: { upsert, findFirst, updateMany, ...overrides },
  };

  const config = {
    getOrThrow: jest.fn().mockReturnValue('whsec_test'),
  };

  const service = new AuthService(prisma as never, config as never);
  return { service, prisma };
}

const mockUser = {
  id: 'user_1',
  clerkId: 'clerk_1',
  email: 'test@example.com',
  name: 'Test User',
  phone: '555-1234',
  role: 'OWNER',
  createdAt: new Date(),
};

describe('AuthService', () => {
  it('upserts user on user.created webhook and is idempotent', async () => {
    const { service, prisma } = createService();

    const request = {
      headers: { 'x-clerk-webhook-secret': 'whsec_test' },
    } as never;

    const event = {
      type: 'user.created',
      data: {
        id: 'clerk_user_1',
        email_addresses: [{ id: 'e1', email_address: 'a@b.com' }],
        primary_email_address_id: 'e1',
      },
    };

    await service.handleClerkWebhook(request, event as never);
    await service.handleClerkWebhook(request, event as never);

    expect(prisma.user.upsert).toHaveBeenCalledTimes(2);
  });

  describe('getProfile', () => {
    it('returns user profile when found', async () => {
      const { service } = createService({
        findFirst: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.getProfile({ clerkId: 'clerk_1' });
      expect(result.email).toBe('test@example.com');
      expect(result.name).toBe('Test User');
    });

    it('throws NotFoundException when user not found', async () => {
      const { service } = createService();
      await expect(service.getProfile({ clerkId: 'missing' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    it('updates name and phone', async () => {
      const updatedUser = { ...mockUser, name: 'New Name', phone: '555-9999' };
      const { service } = createService({
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findFirst: jest.fn().mockResolvedValue(updatedUser),
      });

      const result = await service.updateProfile(
        { clerkId: 'clerk_1' },
        { name: 'New Name', phone: '555-9999' },
      );
      expect(result.name).toBe('New Name');
      expect(result.phone).toBe('555-9999');
    });

    it('throws NotFoundException when user not found', async () => {
      const { service } = createService();
      await expect(
        service.updateProfile({ clerkId: 'missing' }, { name: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
