import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { RecurringInvoicesService } from '../modules/recurring-invoices/recurring-invoices.service';
import { QUEUE_NAMES } from './constants';

@Processor(QUEUE_NAMES.RECURRING_INVOICES)
export class RecurringInvoicesProcessor extends WorkerHost {
  private readonly logger = new Logger(RecurringInvoicesProcessor.name);

  constructor(private readonly recurringInvoicesService: RecurringInvoicesService) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing recurring invoices job ${job.id}`);
    const result = await this.recurringInvoicesService.processDueRecurringInvoices();
    this.logger.log(`Done: ${result.processed} processed, ${result.errors} errors`);
  }
}
