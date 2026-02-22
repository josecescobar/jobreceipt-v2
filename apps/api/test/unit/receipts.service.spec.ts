import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { ReceiptsService } from '../../src/modules/receipts/receipts.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { S3Service } from '../../src/common/services/s3.service';
import { QUEUE_NAMES } from '../../src/queue/constants';

describe('ReceiptsService', () => {
  let service: ReceiptsService;

  const ORG_ID = 'org-abc';
  const OTHER_ORG_ID = 'org-xyz';
  const USER_ID = 'user-1';
  const RECEIPT_ID = 'rec-1';
  const IMAGE_KEY = 'receipts/org-abc/rec-1/original.jpg';

  const mockReceipt = {
    id: RECEIPT_ID,
    organizationId: ORG_ID,
    uploadedById: USER_ID,
    imageUrl: IMAGE_KEY,
    status: 'PROCESSING',
    merchantName: null,
    totalAmount: null,
    transactionDate: null,
    createdAt: new Date('2025-01-15T10:00:00Z'),
    lineItems: [],
    uploadedBy: { id: USER_ID, name: 'Test User', email: 'test@example.com' },
    duplicateOf: null,
    _count: { lineItems: 0 },
  };

  const mockPrisma = {
    receipt: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    receiptLineItem: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockS3Service = {
    buildKey: jest.fn(),
    generateUploadUrl: jest.fn(),
    generateDownloadUrl: jest.fn(),
  };

  const mockOcrQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReceiptsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: S3Service, useValue: mockS3Service },
        { provide: getQueueToken(QUEUE_NAMES.RECEIPT_OCR), useValue: mockOcrQueue },
      ],
    }).compile();

    service = module.get<ReceiptsService>(ReceiptsService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── requestUploadUrl ─────────────────────────────────────────────────────────
  describe('requestUploadUrl', () => {
    it('should return receiptId, uploadUrl, and imageKey', async () => {
      mockS3Service.buildKey.mockReturnValue(IMAGE_KEY);
      mockS3Service.generateUploadUrl.mockResolvedValue({
        url: 'https://s3.amazonaws.com/bucket/signed-upload-url',
      });

      const result = await service.requestUploadUrl(ORG_ID, 'receipt.jpg', 'image/jpeg');

      expect(result).toHaveProperty('receiptId');
      expect(result).toHaveProperty('uploadUrl');
      expect(result).toHaveProperty('imageKey');
      expect(typeof result.receiptId).toBe('string');
      expect(result.receiptId.length).toBeGreaterThan(0);
      expect(result.uploadUrl).toContain('s3');
    });

    it('should call s3Service.buildKey with orgId and generated receiptId', async () => {
      mockS3Service.buildKey.mockReturnValue(IMAGE_KEY);
      mockS3Service.generateUploadUrl.mockResolvedValue({ url: 'https://s3.amazonaws.com/url' });

      await service.requestUploadUrl(ORG_ID, 'photo.png', 'image/png');

      expect(mockS3Service.buildKey).toHaveBeenCalledWith(
        ORG_ID,
        expect.any(String), // receiptId (uuid)
        'original',
        'png',
      );
    });
  });

  // ── confirmUpload ─────────────────────────────────────────────────────────────
  describe('confirmUpload', () => {
    it('should create a receipt record with PROCESSING status', async () => {
      mockPrisma.receipt.create.mockResolvedValue(mockReceipt);
      mockOcrQueue.add.mockResolvedValue({ id: 'job-1' });

      const result = await service.confirmUpload(ORG_ID, USER_ID, RECEIPT_ID, IMAGE_KEY);

      expect(mockPrisma.receipt.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            id: RECEIPT_ID,
            organizationId: ORG_ID,
            uploadedById: USER_ID,
            imageUrl: IMAGE_KEY,
            status: 'PROCESSING',
          }),
        }),
      );
      expect(result.status).toBe('PROCESSING');
    });

    it('should enqueue a BullMQ OCR job after creating the receipt', async () => {
      mockPrisma.receipt.create.mockResolvedValue(mockReceipt);
      mockOcrQueue.add.mockResolvedValue({ id: 'job-1' });

      await service.confirmUpload(ORG_ID, USER_ID, RECEIPT_ID, IMAGE_KEY);

      expect(mockOcrQueue.add).toHaveBeenCalledWith(
        'process-receipt',
        expect.objectContaining({
          receiptId: RECEIPT_ID,
          imageKey: IMAGE_KEY,
          organizationId: ORG_ID,
        }),
        expect.objectContaining({
          attempts: 3,
          backoff: expect.objectContaining({ type: 'exponential' }),
        }),
      );
    });

    it('should scope the receipt to the correct organizationId', async () => {
      mockPrisma.receipt.create.mockResolvedValue(mockReceipt);
      mockOcrQueue.add.mockResolvedValue({ id: 'job-1' });

      await service.confirmUpload(ORG_ID, USER_ID, RECEIPT_ID, IMAGE_KEY);

      const callArg = mockPrisma.receipt.create.mock.calls[0][0];
      expect(callArg.data.organizationId).toBe(ORG_ID);
    });
  });

  // ── findAll ─────────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should return paginated receipts scoped to orgId', async () => {
      mockPrisma.receipt.findMany.mockResolvedValue([mockReceipt]);
      mockPrisma.receipt.count.mockResolvedValue(1);

      const result = await service.findAll(ORG_ID, { page: 1, limit: 20 });

      expect(mockPrisma.receipt.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ organizationId: ORG_ID }),
          skip: 0,
          take: 20,
        }),
      );
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should filter by status when provided', async () => {
      mockPrisma.receipt.findMany.mockResolvedValue([]);
      mockPrisma.receipt.count.mockResolvedValue(0);

      await service.findAll(ORG_ID, { status: 'APPROVED', page: 1, limit: 20 });

      expect(mockPrisma.receipt.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: ORG_ID,
            status: 'APPROVED',
          }),
        }),
      );
    });

    it('should filter by merchantName (case-insensitive) when provided', async () => {
      mockPrisma.receipt.findMany.mockResolvedValue([]);
      mockPrisma.receipt.count.mockResolvedValue(0);

      await service.findAll(ORG_ID, { merchantName: 'Home Depot', page: 1, limit: 20 });

      const callArg = mockPrisma.receipt.findMany.mock.calls[0][0];
      expect(callArg.where.merchantName).toEqual(
        expect.objectContaining({ contains: 'Home Depot', mode: 'insensitive' }),
      );
    });

    it('should apply page offset correctly (page 3, limit 10 → skip 20)', async () => {
      mockPrisma.receipt.findMany.mockResolvedValue([]);
      mockPrisma.receipt.count.mockResolvedValue(0);

      await service.findAll(ORG_ID, { page: 3, limit: 10 });

      expect(mockPrisma.receipt.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });
  });

  // ── findOne ─────────────────────────────────────────────────────────────────
  describe('findOne', () => {
    it('should return receipt belonging to correct org', async () => {
      mockPrisma.receipt.findFirst.mockResolvedValue(mockReceipt);

      const result = await service.findOne(ORG_ID, RECEIPT_ID);

      expect(mockPrisma.receipt.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: RECEIPT_ID, organizationId: ORG_ID },
        }),
      );
      expect(result.id).toBe(RECEIPT_ID);
    });

    it('should throw NotFoundException when receipt belongs to a different org', async () => {
      mockPrisma.receipt.findFirst.mockResolvedValue(null);

      await expect(service.findOne(OTHER_ORG_ID, RECEIPT_ID)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrisma.receipt.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: RECEIPT_ID, organizationId: OTHER_ORG_ID },
        }),
      );
    });

    it('should throw NotFoundException for non-existent receipt', async () => {
      mockPrisma.receipt.findFirst.mockResolvedValue(null);

      await expect(service.findOne(ORG_ID, 'nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── update ──────────────────────────────────────────────────────────────────
  describe('update', () => {
    it('should update receipt fields after verifying org ownership', async () => {
      mockPrisma.receipt.findFirst.mockResolvedValue(mockReceipt);
      mockPrisma.receipt.update.mockResolvedValue({
        ...mockReceipt,
        merchantName: 'Home Depot',
        totalAmount: 17974,
        status: 'REVIEW',
      });

      const result = await service.update(ORG_ID, RECEIPT_ID, {
        merchantName: 'Home Depot',
        totalAmount: 17974,
        status: 'REVIEW',
      });

      expect(mockPrisma.receipt.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: RECEIPT_ID } }),
      );
      expect(result.merchantName).toBe('Home Depot');
      expect(result.totalAmount).toBe(17974);
    });

    it('should store totalAmount as integer cents (not dollars)', async () => {
      mockPrisma.receipt.findFirst.mockResolvedValue(mockReceipt);
      mockPrisma.receipt.update.mockResolvedValue({ ...mockReceipt, totalAmount: 17974 });

      // Caller passes cents — service stores as-is
      await service.update(ORG_ID, RECEIPT_ID, { totalAmount: 17974 });

      const callArg = mockPrisma.receipt.update.mock.calls[0][0];
      expect(callArg.data.totalAmount).toBe(17974);
      // Should NOT be multiplied by 100
      expect(callArg.data.totalAmount).not.toBe(17974 * 100);
    });

    it('should throw NotFoundException when updating receipt from another org', async () => {
      mockPrisma.receipt.findFirst.mockResolvedValue(null);

      await expect(
        service.update(OTHER_ORG_ID, RECEIPT_ID, { merchantName: 'Hack' }),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.receipt.update).not.toHaveBeenCalled();
    });

    it('should convert transactionDate string to Date object', async () => {
      mockPrisma.receipt.findFirst.mockResolvedValue(mockReceipt);
      mockPrisma.receipt.update.mockResolvedValue(mockReceipt);

      await service.update(ORG_ID, RECEIPT_ID, {
        transactionDate: '2025-01-15T00:00:00.000Z',
      });

      const callArg = mockPrisma.receipt.update.mock.calls[0][0];
      expect(callArg.data.transactionDate).toBeInstanceOf(Date);
    });
  });
});
