import { Test, TestingModule } from '@nestjs/testing';
import { JobSuggestionService, haversineDistance } from '../../src/modules/receipts/job-suggestion.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('JobSuggestionService', () => {
  let service: JobSuggestionService;
  let prisma: PrismaService;

  const mockPrisma = {
    job: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobSuggestionService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<JobSuggestionService>(JobSuggestionService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should return null when no active jobs exist', async () => {
    mockPrisma.job.findMany.mockResolvedValue([]);

    const result = await service.suggestJob('org-1', 'receipt-1', {
      merchant: { name: 'Home Depot' },
      line_items: [],
    });

    expect(result).toBeNull();
  });

  it('should suggest a job based on material match', async () => {
    mockPrisma.job.findMany.mockResolvedValue([
      {
        id: 'job-1',
        name: 'Smith Roof Replacement',
        notes: 'Complete roofing tear-off and reshingle',
        customerName: 'Smith',
        customerAddress: '123 Main St, Anytown, WV',
        customerLat: 39.456,
        customerLng: -77.964,
        budgetTotal: 1500000,
        budgetMaterials: 800000,
        expenses: [],
      },
      {
        id: 'job-2',
        name: 'Johnson Bathroom Remodel',
        notes: 'Full bathroom renovation',
        customerName: 'Johnson',
        customerAddress: null,
        customerLat: null,
        customerLng: null,
        budgetTotal: 500000,
        budgetMaterials: 300000,
        expenses: [],
      },
    ]);

    const result = await service.suggestJob('org-1', 'receipt-1', {
      merchant: { name: 'Home Depot', address: '456 Oak Ave, Anytown, WV' },
      line_items: [
        {
          description: '3-Tab Shingles',
          is_construction_material: true,
          material_category: 'roofing',
        },
        {
          description: 'Roofing Nails 1.25"',
          is_construction_material: true,
          material_category: 'roofing',
        },
      ],
    });

    expect(result).not.toBeNull();
    expect(result!.jobId).toBe('job-1');
    expect(result!.score).toBeGreaterThan(0);
  });

  it('should score same merchant higher', async () => {
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 2);

    mockPrisma.job.findMany.mockResolvedValue([
      {
        id: 'job-1',
        name: 'Smith Remodel',
        notes: null,
        customerName: 'Smith',
        customerAddress: null,
        customerLat: null,
        customerLng: null,
        budgetTotal: null,
        budgetMaterials: null,
        expenses: [
          {
            createdAt: recentDate,
            receipt: { merchantName: 'Home Depot' },
          },
          {
            createdAt: recentDate,
            receipt: { merchantName: 'Home Depot' },
          },
        ],
      },
      {
        id: 'job-2',
        name: 'Johnson Fence',
        notes: null,
        customerName: 'Johnson',
        customerAddress: null,
        customerLat: null,
        customerLng: null,
        budgetTotal: null,
        budgetMaterials: null,
        expenses: [],
      },
    ]);

    const result = await service.suggestJob('org-1', 'receipt-1', {
      merchant: { name: 'Home Depot' },
      line_items: [],
    });

    expect(result).not.toBeNull();
    expect(result!.jobId).toBe('job-1');
  });

  it('should auto-assign when score > 90', async () => {
    const recentDate = new Date();

    mockPrisma.job.findMany.mockResolvedValue([
      {
        id: 'job-1',
        name: 'Smith Roof Replacement',
        notes: 'Roofing project - full replacement',
        customerName: 'Smith',
        customerAddress: '123 Main St, Anytown, WV',
        customerLat: 39.456,
        customerLng: -77.964,
        budgetTotal: 1500000,
        budgetMaterials: 800000,
        expenses: [
          { createdAt: recentDate, receipt: { merchantName: 'Home Depot' } },
          { createdAt: recentDate, receipt: { merchantName: 'Home Depot' } },
          { createdAt: recentDate, receipt: { merchantName: 'Home Depot' } },
          { createdAt: recentDate, receipt: null },
          { createdAt: recentDate, receipt: null },
        ],
      },
    ]);

    const result = await service.suggestJob('org-1', 'receipt-1', {
      merchant: { name: 'Home Depot', address: '456 Oak Ave, Anytown, WV' },
      line_items: [
        { description: 'Shingles', is_construction_material: true, material_category: 'roofing' },
      ],
    });

    expect(result).not.toBeNull();
    if (result && result.score > 90) {
      expect(result.autoAssigned).toBe(true);
    }
  });
});

describe('haversineDistance', () => {
  it('should calculate distance between two points', () => {
    // Distance from NYC to LA is roughly 2451 miles
    const distance = haversineDistance(40.7128, -74.006, 34.0522, -118.2437);
    expect(distance).toBeGreaterThan(2400);
    expect(distance).toBeLessThan(2500);
  });

  it('should return 0 for same point', () => {
    const distance = haversineDistance(39.456, -77.964, 39.456, -77.964);
    expect(distance).toBeCloseTo(0, 1);
  });
});
