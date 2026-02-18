import { Module } from '@nestjs/common';
import { RecurringExpensesController } from './recurring-expenses.controller';
import { RecurringExpensesService } from './recurring-expenses.service';
import { AuthModule } from '../auth/auth.module';
import { NotificationService } from '../../common/services/notification.service';

@Module({
  imports: [AuthModule],
  controllers: [RecurringExpensesController],
  providers: [RecurringExpensesService, NotificationService],
  exports: [RecurringExpensesService],
})
export class RecurringExpensesModule {}
