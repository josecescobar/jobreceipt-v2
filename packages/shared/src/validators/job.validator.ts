import { z } from 'zod';

export const CreateJobSchema = z.object({
  name: z.string().min(1).max(255),
  customerName: z.string().max(255).nullable().optional(),
  customerAddress: z.string().max(500).nullable().optional(),
  customerLat: z.number().min(-90).max(90).nullable().optional(),
  customerLng: z.number().min(-180).max(180).nullable().optional(),
  /** Budget in cents */
  budgetTotal: z.number().int().min(0).nullable().optional(),
  budgetMaterials: z.number().int().min(0).nullable().optional(),
  budgetLabor: z.number().int().min(0).nullable().optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
});

export const UpdateJobSchema = CreateJobSchema.partial().extend({
  status: z.enum(['ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
});

export const JobQuerySchema = z.object({
  status: z.enum(['ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type CreateJobDto = z.infer<typeof CreateJobSchema>;
export type UpdateJobDto = z.infer<typeof UpdateJobSchema>;
export type JobQueryDto = z.input<typeof JobQuerySchema>;
