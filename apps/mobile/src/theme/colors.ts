export const colors = {
  // Base
  background: '#0F1117',
  surface: '#1A1D27',
  surfaceLight: '#252836',
  border: '#2E3142',

  // Text
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',

  // Primary
  primary: '#3B82F6',
  primaryLight: '#60A5FA',

  // Budget status
  budgetGood: '#22C55E',
  budgetWarning: '#F59E0B',
  budgetOver: '#EF4444',

  // Status
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Receipt status
  processing: '#F59E0B',
  review: '#3B82F6',
  approved: '#22C55E',
  rejected: '#EF4444',

  // Misc
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.6)',
} as const;

export type ColorKey = keyof typeof colors;

export function getBudgetColor(spent: number, budget: number): string {
  if (budget <= 0) return colors.textMuted;
  const ratio = spent / budget;
  if (ratio >= 1) return colors.budgetOver;
  if (ratio >= 0.75) return colors.budgetWarning;
  return colors.budgetGood;
}

export function getReceiptStatusColor(status: string): string {
  switch (status) {
    case 'PROCESSING':
      return colors.processing;
    case 'REVIEW':
      return colors.review;
    case 'APPROVED':
      return colors.approved;
    case 'REJECTED':
      return colors.rejected;
    default:
      return colors.textMuted;
  }
}
