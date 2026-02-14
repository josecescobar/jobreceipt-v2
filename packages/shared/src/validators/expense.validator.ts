import { z } from 'zod';

export const CreateExpenseSchema = z.object({
  jobId: z.string().uuid(),
  receiptId: z.string().uuid().nullable().optional(),
  costCodeId: z.string().uuid().nullable().optional(),
  /** Amount in cents */
  amount: z.number().int().min(0),
  description: z.string().min(1).max(500),
  category: z.string().max(100).nullable().optional(),
  taxCategory: z.string().max(50).nullable().optional(),
  mileage: z.number().min(0).nullable().optional(),
  date: z.string().datetime(),
});

export const UpdateExpenseSchema = CreateExpenseSchema.partial();

export const ExpenseQuerySchema = z.object({
  jobId: z.string().uuid().optional(),
  category: z.string().optional(),
  taxCategory: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateExpenseDto = z.infer<typeof CreateExpenseSchema>;
export type UpdateExpenseDto = z.infer<typeof UpdateExpenseSchema>;
export type ExpenseQueryDto = z.infer<typeof ExpenseQuerySchema>;
