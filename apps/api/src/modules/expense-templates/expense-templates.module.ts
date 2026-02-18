import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ExpenseTemplatesController } from './expense-templates.controller';
import { ExpenseTemplatesService } from './expense-templates.service';

@Module({
  imports: [AuthModule],
  controllers: [ExpenseTemplatesController],
  providers: [ExpenseTemplatesService],
  exports: [ExpenseTemplatesService],
})
export class ExpenseTemplatesModule {}
