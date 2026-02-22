import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MileageService } from '../../src/modules/mileage/mileage.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { IRS_MILEAGE_RATE_CENTS } from '@jobreceipt/shared';

describe('MileageService', () => {
  let service: MileageService;

  const ORG_ID = 'org-abc';
  const OTHER_ORG_ID = 'org-xyz';
  const USER_ID = 'user-1';
  const TRIP_ID = 'trip-1';

  const mockTrip = {
    id: TRIP_ID,
    organizationId: ORG_ID,
    userId: USER_ID,
    jobId: 'job-1',
    distanceMiles: 42.5,
    irsRate: IRS_MILEAGE_RATE_CENTS,
    totalDeduction: Math.round(42.5 * IRS_MILEAGE_RATE_CENTS),
    date: new Date('2025-01-15'),
    purpose: 'Site visit',
    startLat: 39.1,
    startLng: -77.5,
    endLat: 39.5,
    endLng: -77.9,
    job: { id: 'job-1', name: 'Smith Roof Replacement' },
    user: { id: USER_ID, name: 'Test User', email: 'test@example.com' },
  };

  const mockPrisma = {
    mileageTrip: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MileageService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<MileageService>(MileageService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── create ──────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('should create a trip scoped to the organization', async () => {
      mockPrisma.mileageTrip.create.mockResolvedValue(mockTrip);

      const result = await service.create(ORG_ID, USER_ID, {
        jobId: 'job-1',
        distanceMiles: 42.5,
        date: '2025-01-15',
        purpose: 'Site visit',
        startLat: 39.1,
        startLng: -77.5,
        endLat: 39.5,
        endLng: -77.9,
      });

      expect(mockPrisma.mileageTrip.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: ORG_ID,
            userId: USER_ID,
            distanceMiles: 42.5,
          }),
        }),
      );
      expect(result.organizationId).toBe(ORG_ID);
    });

    it('should calculate totalDeduction using IRS rate when no custom rate provided', async () => {
      const expectedDeduction = Math.round(42.5 * IRS_MILEAGE_RATE_CENTS);
      mockPrisma.mileageTrip.create.mockResolvedValue(mockTrip);

      await service.create(ORG_ID, USER_ID, {
        jobId: 'job-1',
        distanceMiles: 42.5,
        date: '2025-01-15',
        startLat: 39.1,
        startLng: -77.5,
        endLat: 39.5,
        endLng: -77.9,
      });

      const callArg = mockPrisma.mileageTrip.create.mock.calls[0][0];
      expect(callArg.data.totalDeduction).toBe(expectedDeduction);
      expect(callArg.data.irsRate).toBe(IRS_MILEAGE_RATE_CENTS);
    });

    it('should use custom irsRate when explicitly provided', async () => {
      const customRate = 7000; // 70 cents per mile
      const expectedDeduction = Math.round(10 * customRate);
      mockPrisma.mileageTrip.create.mockResolvedValue({
        ...mockTrip,
        distanceMiles: 10,
        irsRate: customRate,
        totalDeduction: expectedDeduction,
      });

      await service.create(ORG_ID, USER_ID, {
        jobId: 'job-1',
        distanceMiles: 10,
        irsRate: customRate,
        date: '2025-01-15',
        startLat: 39.1,
        startLng: -77.5,
        endLat: 39.5,
        endLng: -77.9,
      });

      const callArg = mockPrisma.mileageTrip.create.mock.calls[0][0];
      expect(callArg.data.irsRate).toBe(customRate);
      expect(callArg.data.totalDeduction).toBe(expectedDeduction);
    });
  });

  // ── findAll ─────────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should return paginated trips scoped to orgId', async () => {
      mockPrisma.mileageTrip.findMany.mockResolvedValue([mockTrip]);
      mockPrisma.mileageTrip.count.mockResolvedValue(1);

      const result = await service.findAll(ORG_ID, { page: 1, limit: 20 });

      expect(mockPrisma.mileageTrip.findMany).toHaveBeenCalledWith(
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

    it('should filter by jobId when provided', async () => {
      mockPrisma.mileageTrip.findMany.mockResolvedValue([mockTrip]);
      mockPrisma.mileageTrip.count.mockResolvedValue(1);

      await service.findAll(ORG_ID, { jobId: 'job-1', page: 1, limit: 20 });

      expect(mockPrisma.mileageTrip.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ organizationId: ORG_ID, jobId: 'job-1' }),
        }),
      );
    });

    it('should apply date range filters when provided', async () => {
      mockPrisma.mileageTrip.findMany.mockResolvedValue([]);
      mockPrisma.mileageTrip.count.mockResolvedValue(0);

      await service.findAll(ORG_ID, {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        page: 1,
        limit: 20,
      });

      const callArg = mockPrisma.mileageTrip.findMany.mock.calls[0][0];
      expect(callArg.where.date).toBeDefined();
      expect(callArg.where.date.gte).toBeInstanceOf(Date);
      expect(callArg.where.date.lte).toBeInstanceOf(Date);
    });
  });

  // ── findOne ─────────────────────────────────────────────────────────────────
  describe('findOne', () => {
    it('should return trip belonging to correct org', async () => {
      mockPrisma.mileageTrip.findFirst.mockResolvedValue(mockTrip);

      const result = await service.findOne(ORG_ID, TRIP_ID);

      expect(mockPrisma.mileageTrip.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: TRIP_ID, organizationId: ORG_ID },
        }),
      );
      expect(result.id).toBe(TRIP_ID);
    });

    it('should throw NotFoundException when trip belongs to a different org', async () => {
      mockPrisma.mileageTrip.findFirst.mockResolvedValue(null);

      await expect(service.findOne(OTHER_ORG_ID, TRIP_ID)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrisma.mileageTrip.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: TRIP_ID, organizationId: OTHER_ORG_ID },
        }),
      );
    });
  });

  // ── update ──────────────────────────────────────────────────────────────────
  describe('update', () => {
    it('should update trip and recalculate deduction when distanceMiles changes', async () => {
      mockPrisma.mileageTrip.findFirst.mockResolvedValue(mockTrip);
      const newDistance = 60;
      const expectedDeduction = Math.round(newDistance * IRS_MILEAGE_RATE_CENTS);
      mockPrisma.mileageTrip.update.mockResolvedValue({
        ...mockTrip,
        distanceMiles: newDistance,
        totalDeduction: expectedDeduction,
      });

      const result = await service.update(ORG_ID, TRIP_ID, { distanceMiles: newDistance });

      expect(mockPrisma.mileageTrip.update).toHaveBeenCalled();
      const callArg = mockPrisma.mileageTrip.update.mock.calls[0][0];
      expect(callArg.data.totalDeduction).toBe(expectedDeduction);
      expect(result.totalDeduction).toBe(expectedDeduction);
    });

    it('should throw NotFoundException when updating trip from another org', async () => {
      mockPrisma.mileageTrip.findFirst.mockResolvedValue(null);

      await expect(
        service.update(OTHER_ORG_ID, TRIP_ID, { purpose: 'Hacked' }),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.mileageTrip.update).not.toHaveBeenCalled();
    });
  });

  // ── remove ──────────────────────────────────────────────────────────────────
  describe('remove', () => {
    it('should delete trip by id', async () => {
      mockPrisma.mileageTrip.findFirst.mockResolvedValue(mockTrip);
      mockPrisma.mileageTrip.delete.mockResolvedValue(mockTrip);

      await service.remove(ORG_ID, TRIP_ID);

      expect(mockPrisma.mileageTrip.delete).toHaveBeenCalledWith({
        where: { id: TRIP_ID },
      });
    });

    it('should throw NotFoundException when deleting trip from another org', async () => {
      mockPrisma.mileageTrip.findFirst.mockResolvedValue(null);

      await expect(service.remove(OTHER_ORG_ID, TRIP_ID)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockPrisma.mileageTrip.delete).not.toHaveBeenCalled();
    });
  });

  // ── getSummary ───────────────────────────────────────────────────────────────
  describe('getSummary', () => {
    it('should aggregate miles and deductions scoped to org', async () => {
      mockPrisma.mileageTrip.aggregate.mockResolvedValue({
        _sum: { distanceMiles: 120.5, totalDeduction: 72300 },
      });
      mockPrisma.mileageTrip.count.mockResolvedValue(4);

      const result = await service.getSummary(ORG_ID, {});

      expect(mockPrisma.mileageTrip.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ organizationId: ORG_ID }),
        }),
      );
      expect(result.totalTrips).toBe(4);
      expect(result.totalMiles).toBe(120.5);
      expect(result.totalDeduction).toBe(72300);
    });

    it('should return zeros when no trips exist', async () => {
      mockPrisma.mileageTrip.aggregate.mockResolvedValue({
        _sum: { distanceMiles: null, totalDeduction: null },
      });
      mockPrisma.mileageTrip.count.mockResolvedValue(0);

      const result = await service.getSummary(ORG_ID, {});

      expect(result.totalTrips).toBe(0);
      expect(result.totalMiles).toBe(0);
      expect(result.totalDeduction).toBe(0);
    });

    it('should filter summary by jobId', async () => {
      mockPrisma.mileageTrip.aggregate.mockResolvedValue({
        _sum: { distanceMiles: 42.5, totalDeduction: 25500 },
      });
      mockPrisma.mileageTrip.count.mockResolvedValue(1);

      await service.getSummary(ORG_ID, { jobId: 'job-1' });

      expect(mockPrisma.mileageTrip.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ organizationId: ORG_ID, jobId: 'job-1' }),
        }),
      );
    });
  });
});
