import { Module } from '@nestjs/common';
import { DailyLogsController } from './daily-logs.controller';
import { DailyLogsService } from './daily-logs.service';
import { S3Service } from '../../common/services/s3.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [DailyLogsController],
  providers: [DailyLogsService, S3Service],
  exports: [DailyLogsService],
})
export class DailyLogsModule {}
