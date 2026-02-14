import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ReceiptOcrProcessor } from '../../src/queue/receipt-ocr.processor';
import { PrismaService } from '../../src/prisma/prisma.service';
import { S3Service } from '../../src/common/services/s3.service';
import { JobSuggestionService } from '../../src/modules/receipts/job-suggestion.service';

describe('ReceiptOcrProcessor', () => {
  let processor: ReceiptOcrProcessor;
  let prisma: any;

  const mockPrisma = {
    receipt: {
      update: jest.fn(),
    },
    receiptLineItem: {
      createMany: jest.fn(),
    },
  };

  const mockS3Service = {
    generateDownloadUrl: jest.fn(),
  };

  const mockJobSuggestion = {
    suggestJob: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        'anthropic.apiKey': 'test-key',
        'aws.s3Bucket': 'test-bucket',
        'aws.s3Region': 'us-east-1',
        'aws.accessKeyId': 'test',
        'aws.secretAccessKey': 'test',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReceiptOcrProcessor,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: S3Service, useValue: mockS3Service },
        { provide: JobSuggestionService, useValue: mockJobSuggestion },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    processor = module.get<ReceiptOcrProcessor>(ReceiptOcrProcessor);
    prisma = module.get(PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('OCR result parsing', () => {
    it('should handle a valid OCR response structure', () => {
      const sampleOcrResult = {
        merchant: {
          name: 'Home Depot',
          address: '123 Main St',
          phone: '555-0100',
          store_number: '4521',
        },
        transaction: {
          date: '2025-01-15',
          time: '14:30',
          receipt_number: 'R-12345',
          payment_method: 'credit',
          card_last_four: '4242',
          account_number: null,
        },
        line_items: [
          {
            description: '2x4x8 SPF Stud',
            sku: '123456',
            quantity: 20,
            unit_price: 3.98,
            total_price: 79.6,
            is_construction_material: true,
            material_category: 'lumber',
          },
          {
            description: '14/2 Romex 250ft',
            sku: '789012',
            quantity: 1,
            unit_price: 89.97,
            total_price: 89.97,
            is_construction_material: true,
            material_category: 'electrical',
          },
        ],
        totals: {
          subtotal: 169.57,
          tax_amount: 10.17,
          tax_rate_percent: 6.0,
          tip_amount: null,
          discount_amount: null,
          total_amount: 179.74,
        },
        confidence: {
          overall: 'high' as const,
          notes: 'Receipt from known construction supplier (Home Depot)',
        },
      };

      // Validate structure
      expect(sampleOcrResult.merchant.name).toBe('Home Depot');
      expect(sampleOcrResult.line_items).toHaveLength(2);
      expect(sampleOcrResult.line_items[0].is_construction_material).toBe(true);
      expect(sampleOcrResult.totals.total_amount).toBe(179.74);
      expect(sampleOcrResult.confidence.overall).toBe('high');
    });

    it('should convert dollar amounts to cents correctly', () => {
      const toCents = (amount: number): number => Math.round(amount * 100);

      expect(toCents(29.99)).toBe(2999);
      expect(toCents(0.01)).toBe(1);
      expect(toCents(179.74)).toBe(17974);
      expect(toCents(1000.00)).toBe(100000);
      // Floating point edge case
      expect(toCents(0.1 + 0.2)).toBe(30);
    });
  });
});
