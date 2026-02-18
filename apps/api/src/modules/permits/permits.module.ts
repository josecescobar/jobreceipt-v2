import { Module } from '@nestjs/common';
import { PermitsController } from './permits.controller';
import { PermitsService } from './permits.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [PermitsController],
  providers: [PermitsService],
  exports: [PermitsService],
})
export class PermitsModule {}
