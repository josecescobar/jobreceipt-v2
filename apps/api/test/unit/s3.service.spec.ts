import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { S3Service } from '../../src/common/services/s3.service';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
  PutObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://s3.example.com/presigned-url'),
}));

describe('S3Service', () => {
  let service: S3Service;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        'aws.s3Bucket': 'test-bucket',
        'aws.s3Region': 'us-east-1',
        'aws.accessKeyId': 'test-key-id',
        'aws.secretAccessKey': 'test-secret',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3Service,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<S3Service>(S3Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('buildKey', () => {
    it('should build correct S3 key for original image', () => {
      const key = service.buildKey('org-123', 'receipt-456', 'original', 'jpg');
      expect(key).toBe('receipts/org-123/receipt-456/original.jpg');
    });

    it('should build correct S3 key for thumbnail', () => {
      const key = service.buildKey('org-123', 'receipt-456', 'thumbnail', 'jpg');
      expect(key).toBe('receipts/org-123/receipt-456/thumbnail.jpg');
    });

    it('should handle different file extensions', () => {
      const key = service.buildKey('org-123', 'receipt-456', 'original', 'png');
      expect(key).toBe('receipts/org-123/receipt-456/original.png');
    });
  });

  describe('generateUploadUrl', () => {
    it('should return a pre-signed URL and key', async () => {
      const result = await service.generateUploadUrl('test-key', 'image/jpeg');
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('key');
      expect(result.key).toBe('test-key');
      expect(result.url).toContain('presigned-url');
    });
  });

  describe('generateDownloadUrl', () => {
    it('should return a pre-signed download URL', async () => {
      const url = await service.generateDownloadUrl('test-key');
      expect(url).toContain('presigned-url');
    });
  });
});
