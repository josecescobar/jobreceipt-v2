import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, ProgressBar, MoneyText } from '../ui';
import { colors, spacing } from '../../theme';

interface CategoryBreakdownCardProps {
  label: string;
  spent: number;
  budget: number;
}

export function CategoryBreakdownCard({ label, spent, budget }: CategoryBreakdownCardProps) {
  if (budget <= 0 && spent <= 0) return null;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <MoneyText cents={spent} style={styles.amount} />
      </View>
      {budget > 0 && (
        <>
          <ProgressBar spent={spent} budget={budget} height={4} style={styles.bar} />
          <Text style={styles.budgetText}>
            of <MoneyText cents={budget} style={styles.budgetAmount} /> budget
          </Text>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
  },
  bar: {
    marginTop: spacing.sm,
  },
  budgetText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  budgetAmount: {
    fontSize: 12,
    fontWeight: '500',
  },
});
