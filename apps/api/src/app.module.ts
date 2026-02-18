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
import { RecurringInvoicesModule } from './modules/recurring-invoices/recurring-invoices.module';
import { JobTemplatesModule } from './modules/job-templates/job-templates.module';
import { VendorsModule } from './modules/vendors/vendors.module';
import { SubcontractorsModule } from './modules/subcontractors/subcontractors.module';
import { CustomersModule } from './modules/customers/customers.module';
import { PublicModule } from './modules/public/public.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { DailyLogsModule } from './modules/daily-logs/daily-logs.module';
import { CrewSchedulingModule } from './modules/crew-scheduling/crew-scheduling.module';
import { PunchListsModule } from './modules/punch-lists/punch-lists.module';
import { MessagesModule } from './modules/messages/messages.module';
import { MaterialsModule } from './modules/materials/materials.module';
import { EquipmentModule } from './modules/equipment/equipment.module';
import { CloseOutModule } from './modules/close-out/close-out.module';
import { ReportsModule } from './modules/reports/reports.module';
import { WarrantiesModule } from './modules/warranties/warranties.module';
import { PermitsModule } from './modules/permits/permits.module';
import { SafetyModule } from './modules/safety/safety.module';
import { ProgressBillingModule } from './modules/progress-billing/progress-billing.module';

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
    RecurringInvoicesModule,
    JobTemplatesModule,
    VendorsModule,
    SubcontractorsModule,
    CustomersModule,
    PublicModule,
    DocumentsModule,
    DailyLogsModule,
    CrewSchedulingModule,
    PunchListsModule,
    MessagesModule,
    MaterialsModule,
    EquipmentModule,
    CloseOutModule,
    ReportsModule,
    WarrantiesModule,
    PermitsModule,
    SafetyModule,
    ProgressBillingModule,
  ],
})
export class AppModule {}
