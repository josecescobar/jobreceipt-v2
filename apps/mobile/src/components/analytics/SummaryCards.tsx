import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatMoney } from '../../lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../theme';
import type { AnalyticsTotals, PeriodComparison } from '@jobreceipt/shared';

interface SummaryCardsProps {
  totals: AnalyticsTotals;
  comparison?: PeriodComparison;
}

function DeltaIndicator({
  delta,
  invertColor,
  colors,
}: {
  delta: number | null | undefined;
  invertColor?: boolean;
  colors: ThemeColors;
}) {
  if (delta == null) return null;
  const isUp = delta > 0;
  const color = invertColor
    ? isUp ? colors.error : colors.success
    : isUp ? colors.success : colors.error;
  const icon = isUp ? 'trending-up' : 'trending-down';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
      <Ionicons name={icon} size={10} color={color} />
      <Text style={{ fontSize: 10, color, marginLeft: 2, fontVariant: ['tabular-nums'] }}>
        {Math.abs(delta).toFixed(1)}%
      </Text>
    </View>
  );
}

export function SummaryCards({ totals, comparison }: SummaryCardsProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      <View style={styles.card}>
        <Text style={styles.value}>{formatMoney(totals.totalExpenses)}</Text>
        <Text style={styles.label}>Expenses</Text>
        <DeltaIndicator delta={comparison?.expensesDelta} invertColor colors={colors} />
      </View>
      <View style={styles.card}>
        <Text style={[styles.value, { color: colors.success }]}>
          {formatMoney(totals.totalMileageDeductions)}
        </Text>
        <Text style={styles.label}>Mileage</Text>
        <DeltaIndicator delta={comparison?.mileageDelta} colors={colors} />
      </View>
      <View style={styles.card}>
        <Text style={styles.value}>{totals.receiptCount}</Text>
        <Text style={styles.label}>Receipts</Text>
        <DeltaIndicator delta={comparison?.receiptsDelta} colors={colors} />
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
