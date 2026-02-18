import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportGeneratorService } from './report-generator.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [ReportsController],
  providers: [ReportsService, ReportGeneratorService],
})
export class ReportsModule {}
