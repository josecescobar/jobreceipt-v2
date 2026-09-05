import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ReceiptsController } from './receipts.controller';
import { ReceiptsService } from './receipts.service';
import { ReceiptStorageService } from './receipt-storage.service';
import { ReceiptOcrService } from './receipt-ocr.service';
import { JobSuggestionService } from './job-suggestion.service';
import { ReceiptOcrPipelineService } from './receipt-ocr.pipeline.service';
import { ReceiptOcrProcessor } from './receipt-ocr.processor';
import { QueueModule } from '../queue/queue.module';
import { RECEIPT_OCR_QUEUE } from '../queue/queue.constants';

@Module({
  imports: [
    QueueModule,
    BullModule.registerQueue({ name: RECEIPT_OCR_QUEUE }),
  ],
  controllers: [ReceiptsController],
  providers: [
    ReceiptsService,
    ReceiptStorageService,
    ReceiptOcrService,
    JobSuggestionService,
    ReceiptOcrPipelineService,
    ReceiptOcrProcessor,
  ],
  exports: [ReceiptsService],
})
export class ReceiptsModule {}
