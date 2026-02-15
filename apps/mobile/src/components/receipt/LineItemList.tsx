import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LineItemRow } from './LineItemRow';
import { colors, spacing, typography } from '../../theme';
import type { ReceiptLineItem } from '@jobreceipt/shared';

interface LineItemListProps {
  items: ReceiptLineItem[];
  jobNames?: Record<string, string>;
}

export function LineItemList({ items, jobNames }: LineItemListProps) {
  if (!items || items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No line items detected</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Line Items ({items.length})</Text>
      {items.map((item, index) => (
        <LineItemRow
          key={index}
          item={item}
          jobName={item.costCodeId && jobNames ? jobNames[item.costCodeId] : undefined}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  header: {
    ...typography.label,
    marginBottom: spacing.sm,
  },
  empty: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
  },
});
