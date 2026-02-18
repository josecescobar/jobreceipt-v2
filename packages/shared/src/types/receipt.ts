import { MaterialCategory } from '../constants/material-categories';

export enum ReceiptStatus {
  PROCESSING = 'PROCESSING',
  REVIEW = 'REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
  CHECK = 'CHECK',
  ACCOUNT = 'ACCOUNT',
}

export interface Receipt {
  id: string;
  organizationId: string;
  uploadedById: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  status: ReceiptStatus;
  ocrRawJson: unknown | null;
  merchantName: string | null;
  merchantAddress: string | null;
  /** In cents */
  subtotal: number | null;
  /** In cents */
  taxAmount: number | null;
  /** In cents */
  totalAmount: number | null;
  transactionDate: string | null;
  currency: string;
  processedAt: Date | null;
  confidenceScore: string | null;
  suggestedJobId: string | null;
  suggestedCategory: string | null;
  autoAssigned: boolean;
  duplicateOfId: string | null;
  createdAt: Date;
  updatedAt: Date;
  /** Signed download URL for the receipt image (included when includeThumbnails is requested) */
  imageDownloadUrl?: string;
  /** Populated when fetching a single receipt — original receipt if flagged as duplicate */
  duplicateOf?: {
    id: string;
    merchantName: string | null;
    totalAmount: number | null;
    transactionDate: string | null;
    status: string;
  } | null;
  /** Populated when fetching a single receipt */
  lineItems?: ReceiptLineItem[];
  /** Parsed OCR data (from ocrRawJson) */
  ocrData?: OcrResult | null;
  /** Populated when fetching a single receipt — linked expenses */
  expenses?: Array<{
    id: string;
    amount: number;
    description: string;
    category: string | null;
    date: string;
    jobId: string;
    job?: { id: string; name: string };
  }>;
}

export interface ReceiptLineItem {
  id: string;
  receiptId: string;
  description: string;
  sku: string | null;
  quantity: number;
  /** In cents */
  unitPrice: number;
  /** In cents */
  totalPrice: number;
  isConstructionMaterial: boolean;
  materialCategory: MaterialCategory | null;
  costCodeId: string | null;
  jobId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OcrResult {
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
    payment_method: string;
    card_last_four: string | null;
    account_number: string | null;
  };
  line_items: Array<{
    description: string;
    sku: string | null;
    quantity: number;
    unit_price: number;
    total_price: number;
    is_construction_material: boolean;
    material_category: string;
  }>;
  totals: {
    subtotal: number;
    tax_amount: number;
    tax_rate_percent: number | null;
    tip_amount: number | null;
    discount_amount: number | null;
    total_amount: number;
  };
  confidence: {
    overall: 'high' | 'medium' | 'low';
    notes: string;
  };
}
