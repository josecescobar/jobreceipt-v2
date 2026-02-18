import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { InvoiceReportService } from './invoice-report.service';
import { NotificationService } from '../../common/services/notification.service';

@Module({
  imports: [AuthModule],
  controllers: [InvoicesController],
  providers: [InvoicesService, InvoiceReportService, NotificationService],
  exports: [InvoicesService, InvoiceReportService],
})
export class InvoicesModule {}
