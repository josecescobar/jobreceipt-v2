import { z } from 'zod';

export const RequestUploadUrlSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().regex(/^image\/(jpeg|png|heic|heif|webp)$/),
});

export const ConfirmUploadSchema = z.object({
  receiptId: z.string().min(1),
  imageKey: z.string().min(1),
});

export const UpdateReceiptSchema = z.object({
  merchantName: z.string().max(255).optional(),
  merchantAddress: z.string().max(500).optional(),
  subtotal: z.number().int().min(0).optional(),
  taxAmount: z.number().int().min(0).optional(),
  totalAmount: z.number().int().min(0).optional(),
  transactionDate: z.string().datetime().optional(),
  status: z.enum(['PROCESSING', 'REVIEW', 'APPROVED', 'REJECTED']).optional(),
  suggestedJobId: z.string().uuid().nullable().optional(),
  duplicateOfId: z.string().uuid().nullable().optional(),
});

export const SplitLineItemsSchema = z.object({
  assignments: z.array(
    z.object({
      lineItemId: z.string().uuid(),
      jobId: z.string().uuid(),
    }),
  ).min(1),
});

export const ReceiptQuerySchema = z.object({
  status: z.enum(['PROCESSING', 'REVIEW', 'APPROVED', 'REJECTED']).optional(),
  jobId: z.string().uuid().optional(),
  merchantName: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  includeThumbnails: z.string().optional(),
});

export const OcrResultSchema = z.object({
  merchant: z.object({
    name: z.string(),
    address: z.string().nullable(),
    phone: z.string().nullable(),
    store_number: z.string().nullable(),
  }),
  transaction: z.object({
    date: z.string(),
    time: z.string().nullable(),
    receipt_number: z.string().nullable(),
    payment_method: z.string(),
    card_last_four: z.string().nullable(),
    account_number: z.string().nullable().optional(),
  }),
  line_items: z.array(
    z.object({
      description: z.string(),
      sku: z.string().nullable(),
      quantity: z.number(),
      unit_price: z.number(),
      total_price: z.number(),
      is_construction_material: z.boolean(),
      material_category: z.string(),
    }),
  ),
  totals: z.object({
    subtotal: z.number(),
    tax_amount: z.number(),
    tax_rate_percent: z.number().nullable(),
    tip_amount: z.number().nullable().optional(),
    discount_amount: z.number().nullable().optional(),
    total_amount: z.number(),
  }),
  confidence: z.object({
    overall: z.enum(['high', 'medium', 'low']),
    notes: z.string(),
  }),
});

export const CreateLineItemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().min(0),
  unitPrice: z.number().int().min(0),
  totalPrice: z.number().int().min(0),
  isConstructionMaterial: z.boolean().optional().default(false),
  materialCategory: z.string().nullable().optional(),
});

export const UpdateLineItemSchema = z.object({
  description: z.string().min(1).max(500).optional(),
  quantity: z.number().min(0).optional(),
  unitPrice: z.number().int().min(0).optional(),
  totalPrice: z.number().int().min(0).optional(),
  isConstructionMaterial: z.boolean().optional(),
  materialCategory: z.string().nullable().optional(),
});

export type RequestUploadUrlDto = z.infer<typeof RequestUploadUrlSchema>;
export type ConfirmUploadDto = z.infer<typeof ConfirmUploadSchema>;
export type UpdateReceiptDto = z.infer<typeof UpdateReceiptSchema>;
export type SplitLineItemsDto = z.infer<typeof SplitLineItemsSchema>;
export type ReceiptQueryDto = z.input<typeof ReceiptQuerySchema>;
export type OcrResultDto = z.infer<typeof OcrResultSchema>;
export type CreateLineItemDto = z.input<typeof CreateLineItemSchema>;
export type UpdateLineItemDto = z.input<typeof UpdateLineItemSchema>;
