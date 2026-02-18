import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ChangeOrdersController } from './change-orders.controller';
import { ChangeOrdersService } from './change-orders.service';
import { NotificationService } from '../../common/services/notification.service';

@Module({
  imports: [AuthModule],
  controllers: [ChangeOrdersController],
  providers: [ChangeOrdersService, NotificationService],
  exports: [ChangeOrdersService],
})
export class ChangeOrdersModule {}
