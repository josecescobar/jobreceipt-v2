import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ReceiptStatusBadge } from '../receipt';
import { formatMoney, formatDate, formatMiles } from '../../lib/format';
import { useTheme, type ThemeColors, spacing } from '../../theme';

export type ActivityItem =
  | { type: 'receipt'; id: string; date: string; merchantName: string | null; totalAmount: number | null; status: string }
  | { type: 'expense'; id: string; date: string; description: string; amount: number; jobName?: string }
  | { type: 'mileage'; id: string; date: string; distanceMiles: number; totalDeduction: number; purpose: string | null };

interface ActivityFeedProps {
  items: ActivityItem[];
}

function getTypeConfig(colors: ThemeColors) {
  return {
    receipt: { icon: 'receipt-outline' as const, color: colors.review },
    expense: { icon: 'wallet-outline' as const, color: colors.success },
    mileage: { icon: 'car-outline' as const, color: colors.warning },
  };
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const typeConfig = useMemo(() => getTypeConfig(colors), [colors]);

  if (items.length === 0) {
    return (
      <Text style={styles.emptyText}>
        No recent activity. Scan a receipt or add an expense to get started.
      </Text>
    );
  }

  const handlePress = (item: ActivityItem) => {
    switch (item.type) {
      case 'receipt':
        router.push(`/receipt/${item.id}`);
        break;
      case 'expense':
        router.push(`/expense/edit/${item.id}`);
        break;
      case 'mileage':
        router.push(`/mileage/edit/${item.id}`);
        break;
    }
  };

  return (
    <View>
      {items.map((item) => {
        const config = typeConfig[item.type];
        return (
          <TouchableOpacity
            key={`${item.type}-${item.id}`}
            style={styles.row}
            onPress={() => handlePress(item)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: config.color + '15' }]}>
              <Ionicons name={config.icon} size={18} color={config.color} />
            </View>
            <View style={styles.info}>
              {item.type === 'receipt' && (
                <>
                  <Text style={styles.title} numberOfLines={1}>
                    {item.merchantName || 'Processing...'}
                  </Text>
                  <View style={styles.subRow}>
                    <Text style={styles.date}>{formatDate(item.date)}</Text>
                    <ReceiptStatusBadge status={item.status} />
                  </View>
                </>
              )}
              {item.type === 'expense' && (
                <>
                  <Text style={styles.title} numberOfLines={1}>
                    {item.description || 'Expense'}
                  </Text>
                  <View style={styles.subRow}>
                    <Text style={styles.date}>{formatDate(item.date)}</Text>
                    {item.jobName && (
                      <Text style={styles.jobBadge} numberOfLines={1}>{item.jobName}</Text>
                    )}
                  </View>
                </>
              )}
              {item.type === 'mileage' && (
                <>
                  <Text style={styles.title}>
                    {formatMiles(item.distanceMiles)}
                  </Text>
                  <View style={styles.subRow}>
                    <Text style={styles.date}>{formatDate(item.date)}</Text>
                    {item.purpose && (
                      <Text style={styles.purpose} numberOfLines={1}>{item.purpose}</Text>
                    )}
                  </View>
                </>
              )}
            </View>
            <Text style={styles.amount}>
              {item.type === 'receipt'
                ? (item.totalAmount != null ? formatMoney(item.totalAmount) : '\u2014')
                : item.type === 'expense'
                  ? formatMoney(item.amount)
                  : formatMoney(item.totalDeduction)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
    paddingVertical: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  info: {
    flex: 1,
    marginRight: spacing.md,
  },
  title: {
    fontSize: 14,
    color: colors.text,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  date: {
    fontSize: 12,
    color: colors.textMuted,
  },
  jobBadge: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
    maxWidth: 120,
  },
  purpose: {
    fontSize: 11,
    color: colors.textSecondary,
    maxWidth: 120,
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
});
