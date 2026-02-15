import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Badge } from '../ui';
import { formatMoney, formatDate } from '../../lib/format';
import { colors, spacing } from '../../theme';
import type { Expense } from '@jobreceipt/shared';

interface ExpenseCardProps {
  expense: Expense;
  jobName?: string;
}

export function ExpenseCard({ expense, jobName }: ExpenseCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={expense.receiptId ? 'receipt-outline' : 'create-outline'}
            size={20}
            color={colors.textMuted}
          />
        </View>
        <View style={styles.info}>
          <Text style={styles.description} numberOfLines={1}>
            {expense.description || 'Expense'}
          </Text>
          <View style={styles.meta}>
            {expense.date && (
              <Text style={styles.date}>{formatDate(expense.date)}</Text>
            )}
            {jobName && (
              <Badge label={jobName} />
            )}
          </View>
        </View>
        <Text style={styles.amount}>{formatMoney(expense.amount)}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  info: {
    flex: 1,
    marginRight: spacing.md,
  },
  description: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: spacing.sm,
  },
  date: {
    fontSize: 12,
    color: colors.textMuted,
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
});
