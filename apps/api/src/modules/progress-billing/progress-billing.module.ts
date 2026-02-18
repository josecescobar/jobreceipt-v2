import { Module } from '@nestjs/common';
import { ProgressBillingController } from './progress-billing.controller';
import { ProgressBillingService } from './progress-billing.service';
import { AuthModule } from '../auth/auth.module';
import { InvoicesModule } from '../invoices/invoices.module';

@Module({
  imports: [AuthModule, InvoicesModule],
  controllers: [ProgressBillingController],
  providers: [ProgressBillingService],
  exports: [ProgressBillingService],
})
export class ProgressBillingModule {}
