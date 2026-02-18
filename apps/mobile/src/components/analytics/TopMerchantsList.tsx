import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../ui';
import { formatMoney } from '../../lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../theme';
import type { TopMerchant } from '@jobreceipt/shared';

interface TopMerchantsListProps {
  data: TopMerchant[];
}

export function TopMerchantsList({ data }: TopMerchantsListProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (data.length === 0) return null;

  return (
    <Card style={styles.container}>
      <Text style={styles.title}>Top Merchants</Text>
      {data.map((merchant, index) => (
        <View key={merchant.merchantName} style={styles.row}>
          <View style={styles.rank}>
            <Text style={styles.rankText}>{index + 1}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.merchantName} numberOfLines={1}>
              {merchant.merchantName}
            </Text>
            <Text style={styles.meta}>
              {merchant.receiptCount} receipt{merchant.receiptCount !== 1 ? 's' : ''}
              {' · '}
              {merchant.percentage.toFixed(1)}%
            </Text>
          </View>
          <Text style={styles.amount}>{formatMoney(merchant.totalSpent)}</Text>
        </View>
      ))}
    </Card>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  info: {
    flex: 1,
    marginRight: spacing.md,
  },
  merchantName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  meta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
});
