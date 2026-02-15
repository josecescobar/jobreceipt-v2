import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme';
import { formatMoney } from '../../lib/format';
import type { ReceiptLineItem } from '@jobreceipt/shared';

interface LineItemRowProps {
  item: ReceiptLineItem;
  jobName?: string;
}

export function LineItemRow({ item, jobName }: LineItemRowProps) {
  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text style={styles.description} numberOfLines={1}>
          {item.description}
        </Text>
        {jobName && <Text style={styles.job}>{jobName}</Text>}
      </View>
      <View style={styles.right}>
        {item.quantity > 1 && (
          <Text style={styles.qty}>
            {item.quantity} x {formatMoney(item.unitPrice)}
          </Text>
        )}
        <Text style={styles.total}>{formatMoney(item.totalPrice)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  info: {
    flex: 1,
    marginRight: spacing.md,
  },
  description: {
    fontSize: 14,
    color: colors.text,
  },
  job: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
  },
  qty: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 2,
  },
  total: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
});
