import { z } from 'zod';

export const CreateExpenseSchema = z.object({
  jobId: z.string().uuid().optional(),
  receiptId: z.string().uuid().nullable().optional(),
  costCodeId: z.string().uuid().nullable().optional(),
  /** Amount in cents */
  amount: z.number().int().min(0),
  description: z.string().min(1).max(500),
  category: z.string().max(100).nullable().optional(),
  taxCategory: z.string().max(50).nullable().optional(),
  mileage: z.number().min(0).nullable().optional(),
  date: z.string(),
});

export const UpdateExpenseSchema = CreateExpenseSchema.partial();

export const ExpenseQuerySchema = z.object({
  jobId: z.string().uuid().optional(),
  category: z.string().optional(),
  taxCategory: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const BatchDeleteExpensesSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
});

export const BatchUpdateExpensesSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
  jobId: z.string().uuid().optional(),
  category: z.string().optional(),
});

export type CreateExpenseDto = z.infer<typeof CreateExpenseSchema>;
export type UpdateExpenseDto = z.infer<typeof UpdateExpenseSchema>;
export type ExpenseQueryDto = z.input<typeof ExpenseQuerySchema>;
export type BatchDeleteExpensesDto = z.infer<typeof BatchDeleteExpensesSchema>;
export type BatchUpdateExpensesDto = z.infer<typeof BatchUpdateExpensesSchema>;
