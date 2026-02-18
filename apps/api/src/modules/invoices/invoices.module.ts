import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { InvoiceReportService } from './invoice-report.service';

@Module({
  imports: [AuthModule],
  controllers: [InvoicesController],
  providers: [InvoicesService, InvoiceReportService],
  exports: [InvoicesService, InvoiceReportService],
})
export class InvoicesModule {}
