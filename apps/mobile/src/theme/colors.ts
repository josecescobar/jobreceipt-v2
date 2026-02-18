export const darkColors = {
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
};

export const lightColors: ThemeColors = {
  // Base
  background: '#FFFFFF',
  surface: '#F8FAFC',
  surfaceLight: '#F1F5F9',
  border: '#E2E8F0',

  // Text
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',

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
  overlay: 'rgba(0, 0, 0, 0.4)',
};

export type ThemeColors = typeof darkColors;

// Static default for non-component code
export const colors = darkColors;

export type ColorKey = keyof ThemeColors;

export function getBudgetColor(spent: number, budget: number, palette: ThemeColors = colors): string {
  if (budget <= 0) return palette.textMuted;
  const ratio = spent / budget;
  if (ratio >= 1) return palette.budgetOver;
  if (ratio >= 0.75) return palette.budgetWarning;
  return palette.budgetGood;
}

export function getReceiptStatusColor(status: string, palette: ThemeColors = colors): string {
  switch (status) {
    case 'PROCESSING':
      return palette.processing;
    case 'REVIEW':
      return palette.review;
    case 'APPROVED':
      return palette.approved;
    case 'REJECTED':
      return palette.rejected;
    default:
      return palette.textMuted;
  }
}
