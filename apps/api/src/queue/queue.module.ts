import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { ReceiptOcrProcessor } from './receipt-ocr.processor';
import { S3Service } from '../common/services/s3.service';
import { QUEUE_NAMES } from './constants';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          url: configService.get<string>('redis.url'),
        },
      }),
    }),
    BullModule.registerQueue(
      { name: QUEUE_NAMES.RECEIPT_OCR },
      { name: QUEUE_NAMES.QB_SYNC },
    ),
  ],
  providers: [ReceiptOcrProcessor, S3Service],
  exports: [BullModule],
})
export class QueueModule {}
