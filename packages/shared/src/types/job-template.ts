export interface JobTemplateLineItem {
  id: string;
  templateId: string;
  description: string;
  category: string | null;
  /** In cents */
  estimatedAmount: number | null;
  costCodeId: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  costCode?: { id: string; code: string; name: string } | null;
}

export interface JobTemplate {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  customerName: string | null;
  /** In cents */
  budgetTotal: number | null;
  /** In cents */
  budgetMaterials: number | null;
  /** In cents */
  budgetLabor: number | null;
  /** In cents */
  contractValue: number | null;
  notes: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  lineItems?: JobTemplateLineItem[];
}
