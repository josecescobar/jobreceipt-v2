export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const hitSlop = {
  top: 12,
  bottom: 12,
  left: 12,
  right: 12,
} as const;

// Minimum touch target per accessibility guidelines
export const MIN_TOUCH_TARGET = 48;
