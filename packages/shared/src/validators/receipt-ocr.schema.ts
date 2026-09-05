import { z } from 'zod';

const materialCategorySchema = z.enum([
  'lumber',
  'electrical',
  'plumbing',
  'roofing',
  'hardware',
  'paint',
  'fasteners',
  'concrete',
  'insulation',
  'drywall',
  'flooring',
  'tools',
  'safety',
  'other',
]);

const paymentMethodSchema = z.enum(['cash', 'credit', 'debit', 'check', 'account']);

const lineItemSchema = z.object({
  description: z.string().min(1),
  sku: z.string().nullable(),
  quantity: z.number().nonnegative(),
  unit_price: z.number().nonnegative(),
  total_price: z.number().nonnegative(),
  is_construction_material: z.boolean(),
  material_category: materialCategorySchema,
});

export const receiptOcrSchema = z.object({
  merchant: z.object({
    name: z.string().min(1),
    address: z.string().nullable(),
    phone: z.string().nullable(),
    store_number: z.string().nullable(),
  }),
  transaction: z.object({
    date: z.string().min(1),
    time: z.string().nullable(),
    receipt_number: z.string().nullable(),
    payment_method: paymentMethodSchema,
    card_last_four: z.string().nullable(),
  }),
  line_items: z.array(lineItemSchema),
  totals: z.object({
    subtotal: z.number().nonnegative(),
    tax_amount: z.number().nonnegative(),
    tax_rate_percent: z.number().nullable(),
    discount_amount: z.number().nullable(),
    total_amount: z.number().nonnegative(),
  }),
  confidence: z.object({
    overall: z.enum(['high', 'medium', 'low']),
    notes: z.string(),
  }),
});

export type ReceiptOcrSchema = z.infer<typeof receiptOcrSchema>;
