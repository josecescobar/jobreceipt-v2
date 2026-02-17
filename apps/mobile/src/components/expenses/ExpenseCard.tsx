import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Card, Badge } from '../ui';
import { formatMoney, formatDate } from '../../lib/format';
import { colors, spacing } from '../../theme';
import type { Expense } from '@jobreceipt/shared';

interface ExpenseCardProps {
  expense: Expense;
  jobName?: string;
  onPress?: () => void;
  selectionMode?: boolean;
  selected?: boolean;
  onLongPress?: () => void;
  onSelect?: () => void;
}

export function ExpenseCard({
  expense,
  jobName,
  onPress,
  selectionMode,
  selected,
  onLongPress,
  onSelect,
}: ExpenseCardProps) {
  const handlePress = () => {
    if (selectionMode && onSelect) {
      Haptics.selectionAsync();
      onSelect();
      return;
    }
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const handleLongPress = () => {
    if (onLongPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onLongPress();
    }
  };

  const content = (
    <Card style={StyleSheet.flatten([styles.card, selected && styles.cardSelected])}>
      <View style={styles.row}>
        {selectionMode ? (
          <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
            {selected && <Ionicons name="checkmark" size={14} color={colors.white} />}
          </View>
        ) : (
          <View style={styles.iconContainer}>
            <Ionicons
              name={expense.receiptId ? 'receipt-outline' : 'create-outline'}
              size={20}
              color={colors.textMuted}
            />
          </View>
        )}
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

  if (onPress || selectionMode) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        onLongPress={handleLongPress}
        activeOpacity={0.7}
        delayLongPress={400}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  cardSelected: {
    borderColor: colors.primary + '60',
    backgroundColor: colors.primary + '10',
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
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    marginLeft: 6,
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
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
