import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ExpensesService } from '../../src/modules/expenses/expenses.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { S3Service } from '../../src/common/services/s3.service';
import { NotificationService } from '../../src/common/services/notification.service';
import { AnalyticsService } from '../../src/modules/analytics/analytics.service';

describe('ExpensesService', () => {
  let service: ExpensesService;

  const ORG_ID = 'org-abc';
  const OTHER_ORG_ID = 'org-xyz';
  const USER_ID = 'user-1';
  const EXPENSE_ID = 'exp-1';

  const mockExpense = {
    id: EXPENSE_ID,
    organizationId: ORG_ID,
    jobId: 'job-1',
    amount: 5000,
    description: 'Lumber purchase',
    category: 'MATERIALS',
    date: new Date('2025-01-15'),
    createdById: USER_ID,
    approvedAt: null,
  };

  const mockPrisma = {
    expense: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    job: {
      findUnique: jest.fn(),
    },
  };

  const mockS3Service = {
    generateUploadUrl: jest.fn(),
    generateDownloadUrl: jest.fn(),
  };

  const mockNotificationService = {
    sendPushNotification: jest.fn(),
    notifyUser: jest.fn(),
  };

  const mockAnalyticsService = {
    checkJobMarginAlert: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpensesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: S3Service, useValue: mockS3Service },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: AnalyticsService, useValue: mockAnalyticsService },
      ],
    }).compile();

    service = module.get<ExpensesService>(ExpensesService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── create ──────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('should create an expense scoped to the organization', async () => {
      mockPrisma.expense.create.mockResolvedValue(mockExpense);
      mockPrisma.job.findUnique.mockResolvedValue({ budgetTotal: 100000, _sum: { amount: 0 } });

      const result = await service.create(ORG_ID, USER_ID, {
        jobId: 'job-1',
        amount: 5000,
        description: 'Lumber purchase',
        category: 'MATERIALS',
        date: '2025-01-15',
      });

      expect(mockPrisma.expense.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: ORG_ID,
            amount: 5000,
            description: 'Lumber purchase',
          }),
        }),
      );
      expect(result.organizationId).toBe(ORG_ID);
    });

    it('should store amount as integer cents (not dollars)', async () => {
      mockPrisma.expense.create.mockResolvedValue({ ...mockExpense, amount: 4999 });

      await service.create(ORG_ID, USER_ID, {
        jobId: 'job-1',
        amount: 4999, // 49.99 in cents
        description: 'Nails',
        date: '2025-01-15',
      });

      const callArg = mockPrisma.expense.create.mock.calls[0][0];
      // Amount must be stored as-is (integer cents) — no multiplication
      expect(callArg.data.amount).toBe(4999);
      expect(callArg.data.amount).not.toBe(4999 * 100);
    });

    it('should include optional receiptId and costCodeId when provided', async () => {
      const expenseWithReceipt = { ...mockExpense, receiptId: 'rec-1', costCodeId: 'cc-1' };
      mockPrisma.expense.create.mockResolvedValue(expenseWithReceipt);

      await service.create(ORG_ID, USER_ID, {
        jobId: 'job-1',
        receiptId: 'rec-1',
        costCodeId: 'cc-1',
        amount: 5000,
        description: 'Lumber',
        date: '2025-01-15',
      });

      const callArg = mockPrisma.expense.create.mock.calls[0][0];
      expect(callArg.data.receiptId).toBe('rec-1');
      expect(callArg.data.costCodeId).toBe('cc-1');
    });
  });

  // ── findAll ─────────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should return paginated results scoped to orgId', async () => {
      mockPrisma.expense.findMany.mockResolvedValue([mockExpense]);
      mockPrisma.expense.count.mockResolvedValue(1);

      const result = await service.findAll(ORG_ID, { page: 1, limit: 10 });

      expect(mockPrisma.expense.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ organizationId: ORG_ID }),
          skip: 0,
          take: 10,
        }),
      );
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should apply page offset correctly (page 2, limit 5 → skip 5)', async () => {
      mockPrisma.expense.findMany.mockResolvedValue([]);
      mockPrisma.expense.count.mockResolvedValue(0);

      await service.findAll(ORG_ID, { page: 2, limit: 5 });

      expect(mockPrisma.expense.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 5 }),
      );
    });

    it('should filter by jobId when provided', async () => {
      mockPrisma.expense.findMany.mockResolvedValue([]);
      mockPrisma.expense.count.mockResolvedValue(0);

      await service.findAll(ORG_ID, { jobId: 'job-1', page: 1, limit: 10 });

      expect(mockPrisma.expense.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ organizationId: ORG_ID, jobId: 'job-1' }),
        }),
      );
    });
  });

  // ── findOne ─────────────────────────────────────────────────────────────────
  describe('findOne', () => {
    it('should return an expense belonging to the correct org', async () => {
      mockPrisma.expense.findFirst.mockResolvedValue(mockExpense);

      const result = await service.findOne(ORG_ID, EXPENSE_ID);

      expect(mockPrisma.expense.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: EXPENSE_ID, organizationId: ORG_ID },
        }),
      );
      expect(result.id).toBe(EXPENSE_ID);
    });

    it('should throw NotFoundException when expense belongs to a different org', async () => {
      // Query with OTHER_ORG_ID — mock returns null (not found in that org)
      mockPrisma.expense.findFirst.mockResolvedValue(null);

      await expect(service.findOne(OTHER_ORG_ID, EXPENSE_ID)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrisma.expense.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: EXPENSE_ID, organizationId: OTHER_ORG_ID },
        }),
      );
    });

    it('should throw NotFoundException for non-existent expense', async () => {
      mockPrisma.expense.findFirst.mockResolvedValue(null);

      await expect(service.findOne(ORG_ID, 'nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── update ──────────────────────────────────────────────────────────────────
  describe('update', () => {
    it('should update expense fields', async () => {
      mockPrisma.expense.findFirst.mockResolvedValue(mockExpense);
      mockPrisma.expense.update.mockResolvedValue({
        ...mockExpense,
        amount: 9900,
        description: 'Updated lumber',
      });

      const result = await service.update(ORG_ID, EXPENSE_ID, {
        amount: 9900,
        description: 'Updated lumber',
      });

      expect(mockPrisma.expense.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: EXPENSE_ID } }),
      );
      expect(result.amount).toBe(9900);
    });

    it('should throw NotFoundException when updating expense from another org', async () => {
      mockPrisma.expense.findFirst.mockResolvedValue(null);

      await expect(
        service.update(OTHER_ORG_ID, EXPENSE_ID, { description: 'Hack' }),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.expense.update).not.toHaveBeenCalled();
    });
  });

  // ── remove ──────────────────────────────────────────────────────────────────
  describe('remove', () => {
    it('should delete expense by id', async () => {
      mockPrisma.expense.findFirst.mockResolvedValue(mockExpense);
      mockPrisma.expense.delete.mockResolvedValue(mockExpense);

      await service.remove(ORG_ID, EXPENSE_ID);

      expect(mockPrisma.expense.delete).toHaveBeenCalledWith({
        where: { id: EXPENSE_ID },
      });
    });

    it('should throw NotFoundException when deleting expense from another org', async () => {
      mockPrisma.expense.findFirst.mockResolvedValue(null);

      await expect(service.remove(OTHER_ORG_ID, EXPENSE_ID)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockPrisma.expense.delete).not.toHaveBeenCalled();
    });
  });
});
