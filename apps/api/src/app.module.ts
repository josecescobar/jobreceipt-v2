import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { QueueModule } from './queue/queue.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { CostCodesModule } from './modules/cost-codes/cost-codes.module';
import { ReceiptsModule } from './modules/receipts/receipts.module';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    QueueModule,
    AuthModule,
    OrganizationsModule,
    JobsModule,
    ExpensesModule,
    CostCodesModule,
    ReceiptsModule,
  ],
})
export class AppModule {}
