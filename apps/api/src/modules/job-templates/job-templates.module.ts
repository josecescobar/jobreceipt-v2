import { Module } from '@nestjs/common';
import { JobTemplatesController } from './job-templates.controller';
import { JobTemplatesService } from './job-templates.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [JobTemplatesController],
  providers: [JobTemplatesService],
  exports: [JobTemplatesService],
})
export class JobTemplatesModule {}
