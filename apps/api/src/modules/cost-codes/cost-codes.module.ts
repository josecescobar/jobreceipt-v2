import { Module } from '@nestjs/common';
import { CostCodesController } from './cost-codes.controller';
import { CostCodesService } from './cost-codes.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [CostCodesController],
  providers: [CostCodesService],
  exports: [CostCodesService],
})
export class CostCodesModule {}
