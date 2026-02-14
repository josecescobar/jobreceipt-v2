export interface TaxCategory {
  name: string;
  keywords: string[];
}

export const SCHEDULE_C_CATEGORIES: Record<string, TaxCategory> = {
  line_8: { name: 'Advertising', keywords: ['yard sign', 'business card', 'flyer', 'marketing', 'wrap'] },
  line_9: { name: 'Car and truck expenses', keywords: ['fuel', 'gas', 'diesel', 'oil change', 'tire', 'car wash'] },
  line_10: { name: 'Commissions and fees', keywords: ['referral', 'commission', 'finder', 'broker'] },
  line_13: { name: 'Depreciation (Sec. 179)', keywords: ['equipment', 'tool', 'saw', 'drill', 'compressor', 'generator', 'trailer'] },
  line_15: { name: 'Insurance', keywords: ['liability', 'workers comp', 'insurance premium', 'bond'] },
  line_17: { name: 'Legal and professional', keywords: ['attorney', 'accountant', 'cpa', 'license', 'permit', 'inspection'] },
  line_18: { name: 'Office expense', keywords: ['office supply', 'printer', 'ink', 'paper', 'computer', 'software'] },
  line_20b: { name: 'Rent (equipment)', keywords: ['equipment rental', 'tool rental', 'dumpster', 'scaffold rental'] },
  line_22: { name: 'Supplies', keywords: ['lumber', 'nail', 'screw', 'pipe', 'wire', 'shingle', 'drywall', 'concrete', 'paint', 'caulk', 'adhesive', 'stud', 'romex', 'fitting'] },
  line_24a: { name: 'Travel', keywords: ['hotel', 'motel', 'lodging', 'airfare', 'parking', 'toll'] },
  line_24b: { name: 'Meals (50% deductible)', keywords: ['restaurant', 'lunch', 'coffee', 'food', 'breakfast', 'dinner'] },
  line_25: { name: 'Utilities', keywords: ['phone', 'internet', 'electric', 'water', 'cell phone'] },
  line_27: { name: 'Other expenses', keywords: [] },
};

export const TAX_CATEGORY_LINES = Object.keys(SCHEDULE_C_CATEGORIES);
