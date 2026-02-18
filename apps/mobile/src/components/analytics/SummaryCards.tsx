import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatMoney } from '../../lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../theme';
import type { AnalyticsTotals } from '@jobreceipt/shared';

interface SummaryCardsProps {
  totals: AnalyticsTotals;
}

export function SummaryCards({ totals }: SummaryCardsProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      <View style={styles.card}>
        <Text style={styles.value}>{formatMoney(totals.totalExpenses)}</Text>
        <Text style={styles.label}>Expenses</Text>
      </View>
      <View style={styles.card}>
        <Text style={[styles.value, { color: colors.success }]}>
          {formatMoney(totals.totalMileageDeductions)}
        </Text>
        <Text style={styles.label}>Mileage</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.value}>{totals.receiptCount}</Text>
        <Text style={styles.label}>Receipts</Text>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
});
