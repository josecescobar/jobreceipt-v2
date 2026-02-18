import { Module } from '@nestjs/common';
import { PunchListsController } from './punch-lists.controller';
import { PunchListsService } from './punch-lists.service';
import { S3Service } from '../../common/services/s3.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [PunchListsController],
  providers: [PunchListsService, S3Service],
  exports: [PunchListsService],
})
export class PunchListsModule {}
