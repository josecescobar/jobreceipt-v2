/**
 * Convert cents integer to dollar string with 2 decimal places.
 * formatMoney(15000) → "$150.00"
 */
export function formatMoney(cents: number): string {
  const dollars = cents / 100;
  return `$${dollars.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Convert cents to dollar number for display in inputs.
 * centsToDollars(15000) → 150
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Convert dollar input to cents integer for API calls.
 * dollarsToCents(150) → 15000
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Format a date string for display.
 * formatDate("2025-03-15") → "Mar 15, 2025"
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format distance in miles.
 * formatMiles(12.5) → "12.5 mi"
 */
export function formatMiles(miles: number): string {
  return `${miles.toFixed(1)} mi`;
}

/**
 * Format a percentage.
 * formatPercent(0.75) → "75%"
 */
export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}
