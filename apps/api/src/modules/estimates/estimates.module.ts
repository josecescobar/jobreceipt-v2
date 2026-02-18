import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { EstimatesController } from './estimates.controller';
import { EstimatesService } from './estimates.service';
import { EstimateReportService } from './estimate-report.service';

@Module({
  imports: [AuthModule, InvoicesModule],
  controllers: [EstimatesController],
  providers: [EstimatesService, EstimateReportService],
  exports: [EstimatesService, EstimateReportService],
})
export class EstimatesModule {}
