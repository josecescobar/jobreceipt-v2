import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { RecurringExpensesService } from '../modules/recurring-expenses/recurring-expenses.service';
import { QUEUE_NAMES } from './constants';

@Processor(QUEUE_NAMES.RECURRING_EXPENSES)
export class RecurringExpensesProcessor extends WorkerHost {
  private readonly logger = new Logger(RecurringExpensesProcessor.name);

  constructor(private readonly recurringExpensesService: RecurringExpensesService) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing recurring expenses job ${job.id}`);
    const result = await this.recurringExpensesService.processDueRecurringExpenses();
    this.logger.log(`Done: ${result.processed} processed, ${result.errors} errors`);
  }
}
