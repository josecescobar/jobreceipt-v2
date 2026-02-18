import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { ReportService } from './report.service';
import { S3Service } from '../../common/services/s3.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [JobsController],
  providers: [JobsService, ReportService, S3Service],
  exports: [JobsService],
})
export class JobsModule {}
