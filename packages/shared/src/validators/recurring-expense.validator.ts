import { z } from 'zod';

export const CreateRecurringExpenseSchema = z.object({
  jobId: z.string().uuid(),
  costCodeId: z.string().uuid().nullable().optional(),
  amount: z.number().int().min(1),
  description: z.string().min(1).max(500),
  category: z.string().max(100).nullable().optional(),
  taxCategory: z.string().max(50).nullable().optional(),
  frequency: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY']),
  startDate: z.string(),
  endDate: z.string().nullable().optional(),
});

export const UpdateRecurringExpenseSchema = CreateRecurringExpenseSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const RecurringExpenseQuerySchema = z.object({
  isActive: z.enum(['true', 'false']).optional(),
  jobId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type CreateRecurringExpenseDto = z.infer<typeof CreateRecurringExpenseSchema>;
export type UpdateRecurringExpenseDto = z.infer<typeof UpdateRecurringExpenseSchema>;
export type RecurringExpenseQueryDto = z.input<typeof RecurringExpenseQuerySchema>;
