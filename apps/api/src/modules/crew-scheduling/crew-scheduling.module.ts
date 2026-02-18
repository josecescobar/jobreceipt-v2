import { Module } from '@nestjs/common';
import { CrewSchedulingController } from './crew-scheduling.controller';
import { CrewSchedulingService } from './crew-scheduling.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [CrewSchedulingController],
  providers: [CrewSchedulingService],
  exports: [CrewSchedulingService],
})
export class CrewSchedulingModule {}
