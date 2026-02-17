import { Module } from '@nestjs/common';
import { MileageController } from './mileage.controller';
import { MileageService } from './mileage.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [MileageController],
  providers: [MileageService],
  exports: [MileageService],
})
export class MileageModule {}
