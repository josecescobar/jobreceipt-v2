import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PunchListsModule } from '../punch-lists/punch-lists.module';
import { CloseOutController } from './close-out.controller';
import { CloseOutService } from './close-out.service';
import { S3Service } from '../../common/services/s3.service';

@Module({
  imports: [AuthModule, PunchListsModule],
  controllers: [CloseOutController],
  providers: [CloseOutService, S3Service],
})
export class CloseOutModule {}
