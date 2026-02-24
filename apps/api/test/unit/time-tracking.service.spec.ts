import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TimeTrackingService } from '../../src/modules/time-tracking/time-tracking.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('TimeTrackingService', () => {
  let service: TimeTrackingService;

  const ORG_ID = 'org-abc';
  const OTHER_ORG_ID = 'org-xyz';
  const USER_ID = 'user-1';
  const ENTRY_ID = 'te-1';
  const JOB_ID = 'job-1';

  const mockEntry = {
    id: ENTRY_ID,
    organizationId: ORG_ID,
    userId: USER_ID,
    jobId: JOB_ID,
    date: new Date('2025-02-10'),
    startTime: '08:00',
    endTime: '16:00',
    durationMinutes: 480,
    hourlyRate: 5000,
    overtimeMinutes: 0,
    overtimeRate: null,
    totalCost: 40000,
    isRunning: false,
    clockInAt: null,
    description: 'Framing work',
    createdAt: new Date(),
    job: { id: JOB_ID, name: 'Test Job' },
    user: { id: USER_ID, name: 'John', email: 'john@test.com' },
  };

  const mockPrisma = {
    timeEntry: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimeTrackingService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TimeTrackingService>(TimeTrackingService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── create ──────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('should create a time entry with overtime calculation', async () => {
      mockPrisma.timeEntry.aggregate.mockResolvedValue({ _sum: { durationMinutes: 0 } });
      mockPrisma.timeEntry.create.mockResolvedValue(mockEntry);

      const result = await service.create(ORG_ID, USER_ID, {
        jobId: JOB_ID,
        date: '2025-02-10',
        startTime: '08:00',
        endTime: '16:00',
        durationMinutes: 480,
        hourlyRate: 5000,
      } as any);

      expect(mockPrisma.timeEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: ORG_ID,
            userId: USER_ID,
            jobId: JOB_ID,
            durationMinutes: 480,
          }),
        }),
      );
      expect(result.id).toBe(ENTRY_ID);
    });

    it('should calculate overtime when weekly hours exceed 40', async () => {
      // Already 2280 minutes (38 hours) logged this week
      mockPrisma.timeEntry.aggregate.mockResolvedValue({ _sum: { durationMinutes: 2280 } });
      mockPrisma.timeEntry.create.mockResolvedValue({
        ...mockEntry,
        durationMinutes: 480,
        overtimeMinutes: 360, // 6 hours overtime (38h + 8h = 46h, 6h over 40h)
      });

      await service.create(ORG_ID, USER_ID, {
        jobId: JOB_ID,
        date: '2025-02-14',
        durationMinutes: 480,
        hourlyRate: 5000,
      } as any);

      const callArg = mockPrisma.timeEntry.create.mock.calls[0][0];
      // 2280 existing + 480 new = 2760 total, 2400 limit => 360 overtime
      expect(callArg.data.overtimeMinutes).toBe(360);
    });

    it('should set zero overtime when under weekly limit', async () => {
      mockPrisma.timeEntry.aggregate.mockResolvedValue({ _sum: { durationMinutes: 960 } }); // 16 hours
      mockPrisma.timeEntry.create.mockResolvedValue(mockEntry);

      await service.create(ORG_ID, USER_ID, {
        jobId: JOB_ID,
        date: '2025-02-10',
        durationMinutes: 480,
        hourlyRate: 5000,
      } as any);

      const callArg = mockPrisma.timeEntry.create.mock.calls[0][0];
      expect(callArg.data.overtimeMinutes).toBe(0);
    });
  });

  // ── findAll ─────────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should return paginated results scoped to orgId', async () => {
      mockPrisma.timeEntry.findMany.mockResolvedValue([mockEntry]);
      mockPrisma.timeEntry.count.mockResolvedValue(1);

      const result = await service.findAll(ORG_ID, { page: 1, limit: 10 });

      expect(mockPrisma.timeEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ organizationId: ORG_ID }),
        }),
      );
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by date range when provided', async () => {
      mockPrisma.timeEntry.findMany.mockResolvedValue([]);
      mockPrisma.timeEntry.count.mockResolvedValue(0);

      await service.findAll(ORG_ID, {
        startDate: '2025-02-01',
        endDate: '2025-02-28',
        page: 1,
        limit: 10,
      });

      expect(mockPrisma.timeEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: ORG_ID,
            date: {
              gte: expect.any(Date),
              lte: expect.any(Date),
            },
          }),
        }),
      );
    });
  });

  // ── findOne ─────────────────────────────────────────────────────────────────
  describe('findOne', () => {
    it('should return a time entry belonging to the correct org', async () => {
      mockPrisma.timeEntry.findFirst.mockResolvedValue(mockEntry);

      const result = await service.findOne(ORG_ID, ENTRY_ID);

      expect(result.id).toBe(ENTRY_ID);
    });

    it('should throw NotFoundException for entry in another org', async () => {
      mockPrisma.timeEntry.findFirst.mockResolvedValue(null);

      await expect(service.findOne(OTHER_ORG_ID, ENTRY_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── clockIn ─────────────────────────────────────────────────────────────────
  describe('clockIn', () => {
    it('should create a running time entry', async () => {
      mockPrisma.timeEntry.findFirst.mockResolvedValue(null); // no active timer
      mockPrisma.timeEntry.create.mockResolvedValue({
        ...mockEntry,
        isRunning: true,
        clockInAt: new Date(),
        durationMinutes: 0,
      });

      const result = await service.clockIn(ORG_ID, USER_ID, JOB_ID, 5000);

      expect(mockPrisma.timeEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isRunning: true,
            hourlyRate: 5000,
          }),
        }),
      );
    });

    it('should reject clock-in when a timer is already running', async () => {
      mockPrisma.timeEntry.findFirst.mockResolvedValue({
        ...mockEntry,
        isRunning: true,
      });

      await expect(
        service.clockIn(ORG_ID, USER_ID, JOB_ID),
      ).rejects.toThrow(BadRequestException);
    });

    it('should use last entry hourly rate when none provided', async () => {
      mockPrisma.timeEntry.findFirst
        .mockResolvedValueOnce(null) // no active timer
        .mockResolvedValueOnce({ hourlyRate: 7500 }); // last entry
      mockPrisma.timeEntry.create.mockResolvedValue({ ...mockEntry, isRunning: true });

      await service.clockIn(ORG_ID, USER_ID, JOB_ID);

      expect(mockPrisma.timeEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ hourlyRate: 7500 }),
        }),
      );
    });
  });

  // ── clockOut ────────────────────────────────────────────────────────────────
  describe('clockOut', () => {
    it('should stop the timer and compute duration', async () => {
      const clockInTime = new Date(Date.now() - 120 * 60 * 1000); // 2 hours ago
      mockPrisma.timeEntry.findFirst.mockResolvedValue({
        ...mockEntry,
        isRunning: true,
        clockInAt: clockInTime,
      });
      mockPrisma.timeEntry.aggregate.mockResolvedValue({ _sum: { durationMinutes: 0 } });
      mockPrisma.timeEntry.update.mockResolvedValue({
        ...mockEntry,
        isRunning: false,
        durationMinutes: 120,
      });

      const result = await service.clockOut(ORG_ID, ENTRY_ID);

      expect(mockPrisma.timeEntry.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isRunning: false,
            durationMinutes: expect.any(Number),
          }),
        }),
      );
    });

    it('should throw NotFoundException for non-existent entry', async () => {
      mockPrisma.timeEntry.findFirst.mockResolvedValue(null);

      await expect(service.clockOut(ORG_ID, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if timer is not running', async () => {
      mockPrisma.timeEntry.findFirst.mockResolvedValue(mockEntry); // isRunning: false

      await expect(service.clockOut(ORG_ID, ENTRY_ID)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ── remove ──────────────────────────────────────────────────────────────────
  describe('remove', () => {
    it('should delete time entry by id', async () => {
      mockPrisma.timeEntry.findFirst.mockResolvedValue(mockEntry);
      mockPrisma.timeEntry.delete.mockResolvedValue(mockEntry);

      await service.remove(ORG_ID, ENTRY_ID);

      expect(mockPrisma.timeEntry.delete).toHaveBeenCalledWith({
        where: { id: ENTRY_ID },
      });
    });

    it('should throw NotFoundException for entry in another org', async () => {
      mockPrisma.timeEntry.findFirst.mockResolvedValue(null);

      await expect(service.remove(OTHER_ORG_ID, ENTRY_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── getSummary ──────────────────────────────────────────────────────────────
  describe('getSummary', () => {
    it('should aggregate time entry totals', async () => {
      mockPrisma.timeEntry.aggregate.mockResolvedValue({
        _sum: { durationMinutes: 2400, totalCost: 200000, overtimeMinutes: 120 },
      });
      mockPrisma.timeEntry.count.mockResolvedValue(5);

      const result = await service.getSummary(ORG_ID, {});

      expect(result.totalMinutes).toBe(2400);
      expect(result.totalCost).toBe(200000);
      expect(result.overtimeMinutes).toBe(120);
      expect(result.regularMinutes).toBe(2280);
      expect(result.totalEntries).toBe(5);
    });
  });
});
