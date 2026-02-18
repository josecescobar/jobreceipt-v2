import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../theme';
import { formatMoney } from '../../lib/format';

interface BudgetWarningBannerProps {
  ratio: number;
  remaining: number; // cents (positive = remaining, negative = over)
}

export function BudgetWarningBanner({ ratio, remaining }: BudgetWarningBannerProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isOver = ratio >= 1.0;
  const bgColor = isOver ? colors.error : colors.warning;
  const icon = isOver ? 'warning' : 'alert-circle';
  const message = isOver
    ? `Over budget by ${formatMoney(Math.abs(remaining))}`
    : `${Math.round(ratio * 100)}% of budget used — ${formatMoney(remaining)} remaining`;

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <Ionicons name={icon} size={20} color={colors.white} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

/** @deprecated Use BudgetWarningBanner instead */
export function OverBudgetBanner({ overBy }: { overBy: number }) {
  return <BudgetWarningBanner ratio={1.0} remaining={-overBy} />;
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  text: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: spacing.sm,
    flex: 1,
  },
});
