import { Module } from '@nestjs/common';
import { WarrantiesController } from './warranties.controller';
import { WarrantiesService } from './warranties.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [WarrantiesController],
  providers: [WarrantiesService],
  exports: [WarrantiesService],
})
export class WarrantiesModule {}
