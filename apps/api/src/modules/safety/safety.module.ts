import { Module } from '@nestjs/common';
import { SafetyController } from './safety.controller';
import { SafetyService } from './safety.service';
import { S3Service } from '../../common/services/s3.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [SafetyController],
  providers: [SafetyService, S3Service],
  exports: [SafetyService],
})
export class SafetyModule {}
