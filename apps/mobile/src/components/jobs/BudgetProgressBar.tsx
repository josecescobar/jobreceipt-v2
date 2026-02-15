import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ProgressBar, MoneyText } from '../ui';
import { getBudgetColor } from '../../theme/colors';
import { formatPercent } from '../../lib/format';
import { colors, spacing, typography } from '../../theme';

interface BudgetProgressBarProps {
  label: string;
  spent: number;
  budget: number;
}

export function BudgetProgressBar({ label, spent, budget }: BudgetProgressBarProps) {
  const ratio = budget > 0 ? spent / budget : 0;
  const color = getBudgetColor(spent, budget);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.percent, { color }]}>
          {budget > 0 ? formatPercent(ratio) : '—'}
        </Text>
      </View>
      <ProgressBar spent={spent} budget={budget} height={6} />
      <View style={styles.amounts}>
        <MoneyText cents={spent} style={[styles.amountText, { color }]} />
        <Text style={styles.separator}>/</Text>
        <MoneyText cents={budget} style={styles.budgetText} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  percent: {
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  amounts: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  amountText: {
    fontSize: 14,
    fontWeight: '600',
  },
  separator: {
    fontSize: 14,
    color: colors.textMuted,
    marginHorizontal: 4,
  },
  budgetText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textMuted,
  },
});
