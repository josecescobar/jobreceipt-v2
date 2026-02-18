import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { AuthModule } from '../auth/auth.module';
import { S3Service } from '../../common/services/s3.service';

@Module({
  imports: [AuthModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, S3Service],
  exports: [DocumentsService],
})
export class DocumentsModule {}
