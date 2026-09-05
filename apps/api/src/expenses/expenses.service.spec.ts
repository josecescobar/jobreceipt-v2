import { NotFoundException } from '@nestjs/common';
import { ExpensesService } from './expenses.service';

const mockExpense = {
  id: 'exp_1',
  organizationId: 'org_1',
  jobId: 'job_1',
  amountCents: 5000,
  description: 'Test expense',
  category: 'MATERIALS',
  date: new Date('2026-01-15'),
  createdById: 'user_1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

function createService(overrides: Record<string, unknown> = {}) {
  const findMany = jest.fn().mockResolvedValue([]);
  const findFirst = jest.fn().mockResolvedValue(null);
  const count = jest.fn().mockResolvedValue(0);
  const updateMany = jest.fn().mockResolvedValue({ count: 0 });
  const deleteMany = jest.fn().mockResolvedValue({ count: 0 });

  const prisma = {
    expense: { findMany, findFirst, count, updateMany, deleteMany, ...overrides },
    job: { findFirst: jest.fn().mockResolvedValue({ id: 'job_1' }) },
  };

  const requestContext = {
    getOrganizationId: jest.fn().mockReturnValue('org_1'),
  };

  const service = new ExpensesService(prisma as never, requestContext as never);
  return { service, prisma };
}

describe('ExpensesService', () => {
  describe('list', () => {
    it('passes job/category/date filters to prisma', async () => {
      const { service, prisma } = createService();

      const result = await service.list({
        jobId: 'job_1',
        category: 'MATERIALS',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      });

      expect(prisma.expense.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            jobId: 'job_1',
            category: 'MATERIALS',
            date: expect.any(Object),
          }),
        }),
      );

      expect(prisma.expense.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            jobId: 'job_1',
            category: 'MATERIALS',
          }),
        }),
      );

      expect(result).toEqual({
        data: [],
        meta: {
          page: 1,
          limit: 25,
          totalCount: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      });
    });
  });

  describe('getById', () => {
    it('returns the expense when found', async () => {
      const { service } = createService({
        findFirst: jest.fn().mockResolvedValue(mockExpense),
      });

      const result = await service.getById('exp_1');
      expect(result).toEqual(mockExpense);
    });

    it('throws NotFoundException when not found', async () => {
      const { service } = createService();
      await expect(service.getById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates the expense and returns it', async () => {
      const { service } = createService({
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findFirst: jest.fn().mockResolvedValue({ ...mockExpense, description: 'Updated' }),
      });

      const result = await service.update('exp_1', { description: 'Updated' });
      expect(result.description).toBe('Updated');
    });

    it('throws NotFoundException when expense does not exist', async () => {
      const { service } = createService();
      await expect(service.update('missing', { description: 'x' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('validates job exists when jobId is provided', async () => {
      const { service, prisma } = createService({
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findFirst: jest.fn().mockResolvedValue(mockExpense),
      });
      (prisma.job.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.update('exp_1', { jobId: 'bad_job' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('deletes the expense', async () => {
      const { service } = createService({
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      });

      const result = await service.remove('exp_1');
      expect(result).toEqual({ deleted: true });
    });

    it('throws NotFoundException when expense does not exist', async () => {
      const { service } = createService();
      await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
