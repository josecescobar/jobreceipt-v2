import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import { ReceiptModel, JobModel, ExpenseModel, PendingActionModel } from './models';

const adapter = new SQLiteAdapter({
  schema,
  jsi: true,
  onSetUpError: (error) => {
    console.error('WatermelonDB setup error:', error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [ReceiptModel, JobModel, ExpenseModel, PendingActionModel],
});

export { ReceiptModel, JobModel, ExpenseModel, PendingActionModel };
export { schema };
