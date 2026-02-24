import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { InvoicesService } from '../../src/modules/invoices/invoices.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NotificationService } from '../../src/common/services/notification.service';

describe('InvoicesService', () => {
  let service: InvoicesService;

  const ORG_ID = 'org-abc';
  const OTHER_ORG_ID = 'org-xyz';
  const USER_ID = 'user-1';
  const INVOICE_ID = 'inv-1';
  const JOB_ID = 'job-1';

  const mockInvoice = {
    id: INVOICE_ID,
    organizationId: ORG_ID,
    jobId: JOB_ID,
    invoiceNumber: 'INV-0001',
    status: 'DRAFT',
    subtotal: 10000,
    taxRate: 0.1,
    taxAmount: 1000,
    total: 11000,
    paidAmount: 0,
    shareToken: null,
    createdById: USER_ID,
    dueDate: new Date('2025-03-01'),
    job: { id: JOB_ID, name: 'Test Job', customerName: 'Acme', customerAddress: '123 Main' },
    lineItems: [{ id: 'li-1', description: 'Labor', quantity: 10, unitPrice: 1000, total: 10000, sortOrder: 0 }],
    payments: [],
  };

  const mockPrisma: any = {
    invoice: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    invoiceLineItem: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
    },
    invoicePayment: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    invoiceReminder: {
      create: jest.fn(),
    },
    organization: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((fn: (tx: any) => any) => fn(mockPrisma)),
  };

  const mockNotificationService = {
    sendPushNotification: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── create ──────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('should create an invoice with line items and computed totals', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(null); // no previous invoices
      mockPrisma.invoice.create.mockResolvedValue({ id: INVOICE_ID });
      mockPrisma.invoiceLineItem.createMany.mockResolvedValue({ count: 1 });
      mockPrisma.invoice.findUnique.mockResolvedValue(mockInvoice);

      const result = await service.create(ORG_ID, USER_ID, {
        jobId: JOB_ID,
        taxRate: 0.1,
        lineItems: [
          { description: 'Labor', quantity: 10, unitPrice: 1000 } as any,
        ],
      });

      expect(mockPrisma.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            invoiceNumber: 'INV-0001',
            subtotal: 10000,
            taxAmount: 1000,
            total: 11000,
          }),
        }),
      );
      expect(result.id).toBe(INVOICE_ID);
    });

    it('should auto-increment the invoice number', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue({ invoiceNumber: 'INV-0042' });
      mockPrisma.invoice.create.mockResolvedValue({ id: 'inv-new' });
      mockPrisma.invoiceLineItem.createMany.mockResolvedValue({ count: 1 });
      mockPrisma.invoice.findUnique.mockResolvedValue({ ...mockInvoice, invoiceNumber: 'INV-0043' });

      await service.create(ORG_ID, USER_ID, {
        jobId: JOB_ID,
        lineItems: [{ description: 'Item', quantity: 1, unitPrice: 500 } as any],
      });

      expect(mockPrisma.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ invoiceNumber: 'INV-0043' }),
        }),
      );
    });
  });

  // ── findAll ─────────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should return paginated results scoped to orgId', async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([mockInvoice]);
      mockPrisma.invoice.count.mockResolvedValue(1);

      const result = await service.findAll(ORG_ID, { page: 1, limit: 10 });

      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ organizationId: ORG_ID }),
        }),
      );
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by status when provided', async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([]);
      mockPrisma.invoice.count.mockResolvedValue(0);

      await service.findAll(ORG_ID, { status: 'SENT', page: 1, limit: 10 });

      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ organizationId: ORG_ID, status: 'SENT' }),
        }),
      );
    });
  });

  // ── findOne ─────────────────────────────────────────────────────────────────
  describe('findOne', () => {
    it('should return an invoice belonging to the correct org', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(mockInvoice);

      const result = await service.findOne(ORG_ID, INVOICE_ID);

      expect(mockPrisma.invoice.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: INVOICE_ID, organizationId: ORG_ID },
        }),
      );
      expect(result.id).toBe(INVOICE_ID);
    });

    it('should throw NotFoundException for invoice in another org', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(null);

      await expect(service.findOne(OTHER_ORG_ID, INVOICE_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── addPayment ──────────────────────────────────────────────────────────────
  describe('addPayment', () => {
    it('should add a payment and update paid amount', async () => {
      const sentInvoice = { ...mockInvoice, status: 'SENT' };
      mockPrisma.invoice.findFirst.mockResolvedValue(sentInvoice);
      mockPrisma.invoicePayment.create.mockResolvedValue({});
      mockPrisma.invoice.update.mockResolvedValue({});
      mockPrisma.invoice.findUnique.mockResolvedValue({
        ...sentInvoice,
        paidAmount: 5000,
        status: 'PARTIALLY_PAID',
      });

      const result = await service.addPayment(ORG_ID, INVOICE_ID, {
        amount: 5000,
        date: '2025-02-01',
        method: 'CHECK',
      });

      expect(mockPrisma.invoicePayment.create).toHaveBeenCalled();
      expect(mockPrisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ paidAmount: 5000, status: 'PARTIALLY_PAID' }),
        }),
      );
    });

    it('should reject payment on draft invoice', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(mockInvoice); // status: DRAFT

      await expect(
        service.addPayment(ORG_ID, INVOICE_ID, {
          amount: 1000,
          date: '2025-02-01',
          method: 'CASH',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject payment exceeding remaining balance', async () => {
      const sentInvoice = { ...mockInvoice, status: 'SENT', paidAmount: 10000 };
      mockPrisma.invoice.findFirst.mockResolvedValue(sentInvoice);

      await expect(
        service.addPayment(ORG_ID, INVOICE_ID, {
          amount: 5000, // remaining is only 1000
          date: '2025-02-01',
          method: 'CASH',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should mark invoice as PAID when fully paid', async () => {
      const sentInvoice = { ...mockInvoice, status: 'SENT' };
      mockPrisma.invoice.findFirst.mockResolvedValue(sentInvoice);
      mockPrisma.invoicePayment.create.mockResolvedValue({});
      mockPrisma.invoice.update.mockResolvedValue({});
      mockPrisma.invoice.findUnique.mockResolvedValue({
        ...sentInvoice,
        paidAmount: 11000,
        status: 'PAID',
      });

      await service.addPayment(ORG_ID, INVOICE_ID, {
        amount: 11000,
        date: '2025-02-01',
        method: 'BANK_TRANSFER',
      });

      expect(mockPrisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'PAID' }),
        }),
      );
    });
  });

  // ── remove ──────────────────────────────────────────────────────────────────
  describe('remove', () => {
    it('should delete invoice by id', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(mockInvoice);
      mockPrisma.invoice.delete.mockResolvedValue(mockInvoice);

      await service.remove(ORG_ID, INVOICE_ID);

      expect(mockPrisma.invoice.delete).toHaveBeenCalledWith({
        where: { id: INVOICE_ID },
      });
    });

    it('should throw NotFoundException when deleting invoice from another org', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(null);

      await expect(service.remove(OTHER_ORG_ID, INVOICE_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── generateShareLink ──────────────────────────────────────────────────────
  describe('generateShareLink', () => {
    it('should return existing share link if token already exists', async () => {
      const invoiceWithToken = { ...mockInvoice, shareToken: 'existing-token' };
      mockPrisma.invoice.findFirst.mockResolvedValue(invoiceWithToken);

      const result = await service.generateShareLink(ORG_ID, INVOICE_ID);

      expect(result.token).toBe('existing-token');
      expect(result.url).toContain('existing-token');
      expect(mockPrisma.invoice.update).not.toHaveBeenCalled();
    });

    it('should generate a new share token if none exists', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(mockInvoice);
      mockPrisma.invoice.update.mockResolvedValue({});

      const result = await service.generateShareLink(ORG_ID, INVOICE_ID);

      expect(result.token).toBeDefined();
      expect(result.url).toContain(result.token);
      expect(mockPrisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ shareToken: expect.any(String) }),
        }),
      );
    });
  });
});
