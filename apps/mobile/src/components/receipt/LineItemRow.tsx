import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors, spacing, MIN_TOUCH_TARGET } from '../../theme';
import { formatMoney, centsToDollars, dollarsToCents } from '../../lib/format';
import { Input } from '../ui';
import type { ReceiptLineItem } from '@jobreceipt/shared';

interface LineItemRowProps {
  item: ReceiptLineItem;
  jobName?: string;
  editing?: boolean;
  onSave?: (data: { description: string; quantity: number; unitPrice: number; totalPrice: number }) => void;
  onDelete?: () => void;
}

export function LineItemRow({ item, jobName, editing, onSave, onDelete }: LineItemRowProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [desc, setDesc] = useState(item.description);
  const [qty, setQty] = useState(item.quantity.toString());
  const [unitPriceStr, setUnitPriceStr] = useState(centsToDollars(item.unitPrice).toFixed(2));
  const [expanded, setExpanded] = useState(false);

  if (!editing) {
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

  const handleSave = () => {
    if (!onSave) return;
    const quantity = parseFloat(qty) || 1;
    const unitPrice = dollarsToCents(parseFloat(unitPriceStr) || 0);
    const totalPrice = Math.round(quantity * unitPrice);
    onSave({
      description: desc.trim() || item.description,
      quantity,
      unitPrice,
      totalPrice,
    });
    setExpanded(false);
  };

  if (!expanded) {
    return (
      <TouchableOpacity
        style={styles.editableContainer}
        onPress={() => setExpanded(true)}
        activeOpacity={0.7}
      >
        <View style={styles.info}>
          <Text style={styles.description} numberOfLines={1}>
            {item.description}
          </Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.total}>{formatMoney(item.totalPrice)}</Text>
        </View>
        <Ionicons name="create-outline" size={16} color={colors.textMuted} style={styles.editIcon} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.expandedContainer}>
      <Input
        label="Description"
        value={desc}
        onChangeText={setDesc}
        placeholder="Item description"
      />
      <View style={styles.row}>
        <View style={styles.thirdField}>
          <Input
            label="Qty"
            value={qty}
            onChangeText={setQty}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={styles.twoThirdField}>
          <Input
            label="Unit Price"
            value={unitPriceStr}
            onChangeText={setUnitPriceStr}
            keyboardType="decimal-pad"
            prefix="$"
          />
        </View>
      </View>
      <View style={styles.editActions}>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
          <Ionicons name="checkmark" size={18} color={colors.white} />
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
        {onDelete && (
          <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={16} color={colors.error} />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => setExpanded(false)} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  editableContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  expandedContainer: {
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
  editIcon: {
    marginLeft: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  thirdField: {
    flex: 1,
  },
  twoThirdField: {
    flex: 2,
  },
  editActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  saveBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  deleteBtn: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  cancelText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
