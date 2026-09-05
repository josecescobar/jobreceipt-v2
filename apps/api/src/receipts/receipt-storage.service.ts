import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class ReceiptStorageService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    this.client = new S3Client({
      region: this.configService.getOrThrow<string>('AWS_S3_REGION'),
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.getOrThrow<string>('AWS_SECRET_ACCESS_KEY'),
      },
    });

    this.bucket = this.configService.getOrThrow<string>('AWS_S3_BUCKET');
  }

  getBucket(): string {
    return this.bucket;
  }

  sanitizeFileName(fileName: string): string {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase();
  }

  async createUploadUrl(objectKey: string, contentType: string): Promise<{ url: string; expiresIn: number }> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
      ResponseContentType: contentType,
    });

    const expiresIn = 60 * 15;
    const url = await getSignedUrl(this.client, command, { expiresIn });

    return {
      url,
      expiresIn,
    };
  }

  async createPutUploadUrl(objectKey: string, contentType: string): Promise<{ url: string; expiresIn: number }> {
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
      ContentType: contentType,
    });

    const expiresIn = 60 * 15;
    const url = await getSignedUrl(this.client, command, { expiresIn });

    return { url, expiresIn };
  }

  parseS3Url(imageUrl: string): { bucket: string; key: string } {
    const prefix = 's3://';
    if (!imageUrl.startsWith(prefix)) {
      throw new BadRequestException('Invalid S3 URL: expected s3:// prefix');
    }

    const withoutPrefix = imageUrl.slice(prefix.length);
    const firstSlash = withoutPrefix.indexOf('/');

    return {
      bucket: withoutPrefix.slice(0, firstSlash),
      key: withoutPrefix.slice(firstSlash + 1),
    };
  }

  async loadReceiptImage(imageUrl: string): Promise<Buffer> {
    const { bucket, key } = this.parseS3Url(imageUrl);
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await this.client.send(command);
    const body = response.Body;

    if (!body) {
      throw new NotFoundException('Receipt image not found in S3');
    }

    const bytes = await body.transformToByteArray();
    return Buffer.from(bytes);
  }
}
