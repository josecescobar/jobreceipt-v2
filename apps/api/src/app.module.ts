import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { QueueModule } from './queue/queue.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { CostCodesModule } from './modules/cost-codes/cost-codes.module';
import { ReceiptsModule } from './modules/receipts/receipts.module';
import { MileageModule } from './modules/mileage/mileage.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { RecurringExpensesModule } from './modules/recurring-expenses/recurring-expenses.module';
import { ExpenseTemplatesModule } from './modules/expense-templates/expense-templates.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { TimeTrackingModule } from './modules/time-tracking/time-tracking.module';
import { EstimatesModule } from './modules/estimates/estimates.module';
import { ChangeOrdersModule } from './modules/change-orders/change-orders.module';

@Module({
  controllers: [AppController],
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
    MileageModule,
    AnalyticsModule,
    RecurringExpensesModule,
    ExpenseTemplatesModule,
    InvoicesModule,
    TimeTrackingModule,
    EstimatesModule,
    ChangeOrdersModule,
  ],
})
export class AppModule {}
