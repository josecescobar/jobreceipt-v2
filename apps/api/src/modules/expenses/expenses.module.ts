import { Module } from '@nestjs/common';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { AuthModule } from '../auth/auth.module';
import { S3Service } from '../../common/services/s3.service';
import { NotificationService } from '../../common/services/notification.service';

@Module({
  imports: [AuthModule],
  controllers: [ExpensesController],
  providers: [ExpensesService, S3Service, NotificationService],
  exports: [ExpensesService],
})
export class ExpensesModule {}
