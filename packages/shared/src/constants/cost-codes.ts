import { CostCodeCategory } from '../types/job';

export interface DefaultCostCode {
  code: string;
  name: string;
  category: CostCodeCategory;
}

export const DEFAULT_COST_CODES: DefaultCostCode[] = [
  // Materials
  { code: '06-11-00', name: 'Framing Lumber', category: CostCodeCategory.MATERIALS },
  { code: '06-20-00', name: 'Finish Carpentry', category: CostCodeCategory.MATERIALS },
  { code: '07-31-00', name: 'Roofing Materials', category: CostCodeCategory.MATERIALS },
  { code: '07-46-00', name: 'Siding', category: CostCodeCategory.MATERIALS },
  { code: '09-29-00', name: 'Drywall', category: CostCodeCategory.MATERIALS },
  { code: '09-91-00', name: 'Paint & Coatings', category: CostCodeCategory.MATERIALS },
  { code: '09-65-00', name: 'Flooring', category: CostCodeCategory.MATERIALS },
  { code: '22-00-00', name: 'Plumbing Materials', category: CostCodeCategory.MATERIALS },
  { code: '26-00-00', name: 'Electrical Materials', category: CostCodeCategory.MATERIALS },
  { code: '03-30-00', name: 'Concrete', category: CostCodeCategory.MATERIALS },
  { code: '07-21-00', name: 'Insulation', category: CostCodeCategory.MATERIALS },
  { code: '05-50-00', name: 'Hardware & Fasteners', category: CostCodeCategory.MATERIALS },

  // Labor
  { code: 'LAB-01', name: 'General Labor', category: CostCodeCategory.LABOR },
  { code: 'LAB-02', name: 'Skilled Trade Labor', category: CostCodeCategory.LABOR },
  { code: 'LAB-03', name: 'Supervisory Labor', category: CostCodeCategory.LABOR },

  // Equipment
  { code: 'EQP-01', name: 'Equipment Rental', category: CostCodeCategory.EQUIPMENT },
  { code: 'EQP-02', name: 'Tool Purchase', category: CostCodeCategory.EQUIPMENT },
  { code: 'EQP-03', name: 'Fuel & Maintenance', category: CostCodeCategory.EQUIPMENT },

  // Subcontractor
  { code: 'SUB-01', name: 'Subcontractor - General', category: CostCodeCategory.SUBCONTRACTOR },
  { code: 'SUB-02', name: 'Subcontractor - Electrical', category: CostCodeCategory.SUBCONTRACTOR },
  { code: 'SUB-03', name: 'Subcontractor - Plumbing', category: CostCodeCategory.SUBCONTRACTOR },
  { code: 'SUB-04', name: 'Subcontractor - HVAC', category: CostCodeCategory.SUBCONTRACTOR },

  // Overhead
  { code: 'OVH-01', name: 'Permits & Fees', category: CostCodeCategory.OVERHEAD },
  { code: 'OVH-02', name: 'Insurance', category: CostCodeCategory.OVERHEAD },
  { code: 'OVH-03', name: 'Waste Disposal', category: CostCodeCategory.OVERHEAD },
  { code: 'OVH-04', name: 'Delivery & Shipping', category: CostCodeCategory.OVERHEAD },
];
