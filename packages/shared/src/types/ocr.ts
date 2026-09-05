export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type MaterialCategory =
  | 'lumber'
  | 'electrical'
  | 'plumbing'
  | 'roofing'
  | 'hardware'
  | 'paint'
  | 'fasteners'
  | 'concrete'
  | 'insulation'
  | 'drywall'
  | 'flooring'
  | 'tools'
  | 'safety'
  | 'other';

export interface ReceiptOcrPayload {
  merchant: {
    name: string;
    address: string | null;
    phone: string | null;
    store_number: string | null;
  };
  transaction: {
    date: string;
    time: string | null;
    receipt_number: string | null;
    payment_method: 'cash' | 'credit' | 'debit' | 'check' | 'account';
    card_last_four: string | null;
  };
  line_items: Array<{
    description: string;
    sku: string | null;
    quantity: number;
    unit_price: number;
    total_price: number;
    is_construction_material: boolean;
    material_category: MaterialCategory;
  }>;
  totals: {
    subtotal: number;
    tax_amount: number;
    tax_rate_percent: number | null;
    discount_amount: number | null;
    total_amount: number;
  };
  confidence: {
    overall: ConfidenceLevel;
    notes: string;
  };
}
