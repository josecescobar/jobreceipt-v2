import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ReceiptsController } from './receipts.controller';
import { ReceiptsService } from './receipts.service';
import { JobSuggestionService } from './job-suggestion.service';
import { S3Service } from '../../common/services/s3.service';
import { AuthModule } from '../auth/auth.module';
import { QUEUE_NAMES } from '../../queue/constants';

@Module({
  imports: [
    AuthModule,
    BullModule.registerQueue({ name: QUEUE_NAMES.RECEIPT_OCR }),
  ],
  controllers: [ReceiptsController],
  providers: [ReceiptsService, JobSuggestionService, S3Service],
  exports: [ReceiptsService, JobSuggestionService, S3Service],
})
export class ReceiptsModule {}
