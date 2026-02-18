import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { ReceiptOcrProcessor } from './receipt-ocr.processor';
import { RecurringExpensesProcessor } from './recurring-expenses.processor';
import { RecurringExpensesScheduler } from './recurring-expenses.scheduler';
import { S3Service } from '../common/services/s3.service';
import { NotificationService } from '../common/services/notification.service';
import { ReceiptsModule } from '../modules/receipts/receipts.module';
import { RecurringExpensesModule } from '../modules/recurring-expenses/recurring-expenses.module';
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
      { name: QUEUE_NAMES.RECURRING_EXPENSES },
    ),
    forwardRef(() => ReceiptsModule),
    RecurringExpensesModule,
  ],
  providers: [
    ReceiptOcrProcessor,
    RecurringExpensesProcessor,
    RecurringExpensesScheduler,
    S3Service,
    NotificationService,
  ],
  exports: [BullModule],
})
export class QueueModule {}
